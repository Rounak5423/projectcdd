"""
CIVORA — Real-Time Event Engine (Phase 6)
Real-Time Connection Manager: Bounded per-client queues, non-blocking broadcast,
backpressure protection, heartbeat keepalives, and graceful lifecycle management.
"""

import asyncio
import json
import time
import uuid
from typing import Dict, Set, Optional, Any, List
from fastapi import WebSocket, WebSocketDisconnect
from realtime.envelope import EventEnvelope, EventPriority, EventCategory
from realtime.sequencer import sequencer
from realtime.delta import delta_engine
from monitoring.collector import perf_collector


class ClientSession:
    """Manages an individual client WebSocket session with dedicated outbound queue."""

    def __init__(self, websocket: WebSocket, world_id: str, queue_size: int = 128):
        self.client_id: str = f"cli_{uuid.uuid4().hex[:8]}"
        self.websocket: WebSocket = websocket
        self.world_id: str = world_id
        self.queue: asyncio.Queue = asyncio.Queue(maxsize=queue_size)
        self.connected_at: float = time.time()
        self.last_heartbeat: float = time.time()
        self.is_alive: bool = True
        self.worker_task: Optional[asyncio.Task] = None
        self.messages_sent: int = 0
        self.bytes_sent: int = 0
        self.dropped_messages: int = 0
        self.last_acked_seq: int = 0

    def enqueue(self, message_str: str, priority: EventPriority = EventPriority.NORMAL) -> bool:
        """
        Non-blocking enqueue with backpressure policy.
        Returns True if queued, False if dropped due to backpressure.
        """
        if not self.is_alive:
            return False

        try:
            self.queue.put_nowait(message_str)
            return True
        except asyncio.QueueFull:
            if priority == EventPriority.LOW:
                self.dropped_messages += 1
                return False
            # For CRITICAL/NORMAL events, evict oldest non-critical item if possible
            try:
                _ = self.queue.get_nowait()
                self.queue.task_done()
                self.dropped_messages += 1
            except (asyncio.QueueEmpty, ValueError):
                pass

            try:
                self.queue.put_nowait(message_str)
                return True
            except asyncio.QueueFull:
                self.dropped_messages += 1
                return False


class RealtimeConnectionManager:
    """
    Centralized, high-throughput WebSocket connection manager for CIVORA.
    Eliminates head-of-line blocking using per-client asynchronous queues.
    """

    def __init__(self, client_queue_size: int = 128, heartbeat_interval: float = 25.0):
        self.client_queue_size = client_queue_size
        self.heartbeat_interval = heartbeat_interval
        self._sessions: Dict[str, Dict[str, ClientSession]] = {}  # world_id -> {client_id: session}
        self._lock: Optional[asyncio.Lock] = None
        self._heartbeat_task: Optional[asyncio.Task] = None
        self._is_shutting_down: bool = False

    def _ensure_lock(self) -> asyncio.Lock:
        if self._lock is None:
            self._lock = asyncio.Lock()
        return self._lock

    async def connect(self, world_id: str, websocket: WebSocket) -> ClientSession:
        """Registers and initializes a new client connection with dedicated worker."""
        await websocket.accept()
        session = ClientSession(websocket, world_id, queue_size=self.client_queue_size)

        lock = self._ensure_lock()
        async with lock:
            if world_id not in self._sessions:
                self._sessions[world_id] = {}
            self._sessions[world_id][session.client_id] = session

        # Start background sender worker for this client
        session.worker_task = asyncio.create_task(self._sender_loop(session))

        perf_collector.record_ws_connect()

        # Start heartbeat loop if not running
        if self._heartbeat_task is None or self._heartbeat_task.done():
            self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())

        return session

    async def disconnect(self, world_id: str, session: ClientSession):
        """Cleans up client connection and stops worker task."""
        session.is_alive = False
        if session.worker_task and not session.worker_task.done():
            session.worker_task.cancel()
            try:
                await session.worker_task
            except (asyncio.CancelledError, Exception):
                pass

        lock = self._ensure_lock()
        async with lock:
            if world_id in self._sessions:
                self._sessions[world_id].pop(session.client_id, None)
                if not self._sessions[world_id]:
                    del self._sessions[world_id]

        perf_collector.record_ws_disconnect()

    async def _sender_loop(self, session: ClientSession):
        """Dedicated client worker loop pulling from bounded queue and pushing to socket."""
        try:
            while session.is_alive and not self._is_shutting_down:
                try:
                    message_str = await session.queue.get()
                    t0 = time.perf_counter()
                    await session.websocket.send_text(message_str)
                    dt = (time.perf_counter() - t0) * 1000.0

                    session.messages_sent += 1
                    msg_len = len(message_str.encode('utf-8'))
                    session.bytes_sent += msg_len
                    perf_collector.record_ws_message_sent(msg_len)
                    session.queue.task_done()
                except (WebSocketDisconnect, ConnectionResetError):
                    session.is_alive = False
                    break
                except asyncio.CancelledError:
                    break
                except Exception:
                    session.is_alive = False
                    perf_collector.record_ws_error()
                    break
        finally:
            session.is_alive = False

    async def broadcast_envelope(self, world_id: str, envelope: EventEnvelope):
        """
        Dispatches an authoritative EventEnvelope to all clients in the world.
        Executes in non-blocking O(N) memory enqueue without awaiting network sockets.
        """
        if world_id not in self._sessions:
            return

        payload_dict = envelope.to_client_dict()
        message_str = json.dumps(payload_dict)

        sessions_snapshot = list(self._sessions[world_id].values())
        for session in sessions_snapshot:
            if session.is_alive:
                session.enqueue(message_str, priority=envelope.priority)

    async def broadcast(self, world_id: str, message: Dict[str, Any], priority: EventPriority = EventPriority.NORMAL):
        """
        Legacy-compatible broadcast wrapping raw dictionaries into EventEnvelope.
        """
        seq = sequencer.next_sequence(world_id)
        event_type = message.get("type", "simulation.tick")

        envelope = EventEnvelope(
            event_type=event_type,
            world_id=world_id,
            sequence_number=seq,
            world_state_version=sequencer.get_state_version(world_id),
            priority=priority,
            payload=message
        )
        await self.broadcast_envelope(world_id, envelope)

    async def send_to_session(self, session: ClientSession, envelope: EventEnvelope):
        """Sends an envelope directly to a specific client session."""
        if not session.is_alive:
            return
        payload_dict = envelope.to_client_dict()
        session.enqueue(json.dumps(payload_dict), priority=envelope.priority)

    async def resync_client(self, session: ClientSession, world_state: Dict[str, Any]):
        """Transmits a fresh authoritative full snapshot to a client that fell behind."""
        seq = sequencer.next_sequence(session.world_id)
        ver = sequencer.get_state_version(session.world_id)

        snapshot_envelope = EventEnvelope(
            event_type="world.state.snapshot",
            category=EventCategory.WORLD_STATE,
            world_id=session.world_id,
            sequence_number=seq,
            world_state_version=ver,
            priority=EventPriority.CRITICAL,
            payload={
                "world_id": session.world_id,
                "version": ver,
                "is_snapshot": True,
                "state": world_state
            }
        )
        await self.send_to_session(session, snapshot_envelope)

    async def _heartbeat_loop(self):
        """Background heartbeat ping loop detecting hung or half-open connections."""
        try:
            while not self._is_shutting_down:
                await asyncio.sleep(self.heartbeat_interval)
                now = time.time()
                for world_id, client_map in list(self._sessions.items()):
                    for cid, session in list(client_map.items()):
                        if not session.is_alive:
                            continue
                        # Send ping envelope
                        ping_env = EventEnvelope(
                            event_type="heartbeat.ping",
                            category=EventCategory.NOTIFICATION,
                            world_id=world_id,
                            priority=EventPriority.LOW,
                            payload={"server_time": now}
                        )
                        session.enqueue(json.dumps(ping_env.to_client_dict()), priority=EventPriority.LOW)
        except asyncio.CancelledError:
            pass

    def get_stats(self) -> Dict[str, Any]:
        """Telemetry diagnostics on active connections, queues, and drops."""
        total_active = sum(len(c) for c in self._sessions.values())
        total_dropped = sum(
            s.dropped_messages for c in self._sessions.values() for s in c.values()
        )
        max_q_depth = max(
            [s.queue.qsize() for c in self._sessions.values() for s in c.values()] or [0]
        )
        return {
            "active_connections": total_active,
            "total_dropped_messages": total_dropped,
            "max_queue_depth": max_q_depth,
            "worlds_tracked": len(self._sessions)
        }

    async def shutdown(self):
        """Cleanly drains and shuts down all active WebSocket connections."""
        self._is_shutting_down = True
        if self._heartbeat_task and not self._heartbeat_task.done():
            self._heartbeat_task.cancel()
            try:
                await self._heartbeat_task
            except (asyncio.CancelledError, Exception):
                pass

        for world_id, client_map in list(self._sessions.items()):
            for cid, session in list(client_map.items()):
                session.is_alive = False
                if session.worker_task and not session.worker_task.done():
                    session.worker_task.cancel()
                    try:
                        await session.worker_task
                    except (asyncio.CancelledError, Exception):
                        pass
                try:
                    await session.websocket.close(code=1001, reason="Server shutting down")
                except Exception:
                    pass
        self._sessions.clear()


rt_ws_manager = RealtimeConnectionManager()
