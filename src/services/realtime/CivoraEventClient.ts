/**
 * CIVORA — Centralized Real-Time Event Client (Phase 6)
 *
 * Provides a resilient, high-performance WebSocket connection layer for React:
 * 1. Single shared WebSocket instance per world to avoid connection explosion.
 * 2. Exponential backoff reconnect with randomized jitter.
 * 3. Monotonic sequence tracking, duplicate rejection, and gap detection.
 * 4. Delta-based state patching with automatic snapshot resynchronization on gaps.
 * 5. Fine-grained category subscriptions preventing unnecessary React tree re-renders.
 * 6. Native integration with Phase 1 performance monitoring.
 */

import { performanceMonitor } from '../monitoring/performanceMonitor';

export type EventPriority = 'critical' | 'normal' | 'low';

export interface EventEnvelope<T = any> {
  event_id: string;
  event_type: string;
  category: string;
  schema_version: string;
  world_id: string;
  sequence_number: number;
  world_state_version: number;
  timestamp: number;
  priority: EventPriority;
  idempotency_key?: string;
  payload: T;
  type?: string;
}

export type EventCallback<T = any> = (envelope: EventEnvelope<T>) => void;

function deepMerge(target: any, source: any): any {
  if (!source || typeof source !== 'object') return source;
  if (!target || typeof target !== 'object') return { ...source };

  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      key in target &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

export class CivoraEventClient {
  private socket: WebSocket | null = null;
  private currentWorldId: string | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private lastSequenceNumber = 0;
  private lastStateVersion = 0;
  private authoritativeState: Record<string, any> = {};

  // Connection & Reconnection state
  private isConnecting = false;
  private shouldReconnect = true;
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private maxReconnectDelay = 15000;
  private baseReconnectDelay = 1000;

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  private handleVisibilityChange() {
    if (document.visibilityState === 'visible' && (!this.socket || this.socket.readyState !== WebSocket.OPEN)) {
      if (this.currentWorldId) {
        this.connect(this.currentWorldId);
      }
    }
  }

  /**
   * Establishes a persistent WebSocket connection to the world stream.
   */
  public connect(worldId: string): void {
    if (typeof window === 'undefined') return;

    if (this.socket && this.currentWorldId === worldId && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.disconnect();
    this.currentWorldId = worldId;
    this.shouldReconnect = true;
    this.isConnecting = true;
    performanceMonitor.setWebSocketStatus('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host =
      import.meta.env.VITE_WS_URL ||
      (window.location.port === '8000'
        ? window.location.host
        : `${window.location.hostname}:8000`);

    const wsUrl = `${protocol}//${host}/ws/world/${encodeURIComponent(worldId)}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        performanceMonitor.setWebSocketStatus('connected');
      };

      this.socket.onmessage = (event: MessageEvent) => {
        performanceMonitor.recordWebSocketMessageReceived();
        this.handleIncomingMessage(event.data);
      };

      this.socket.onerror = () => {
        performanceMonitor.recordWebSocketError();
      };

      this.socket.onclose = (event) => {
        this.isConnecting = false;
        performanceMonitor.setWebSocketStatus('disconnected');
        if (this.shouldReconnect && event.code !== 1000) {
          this.scheduleReconnect();
        }
      };
    } catch {
      this.isConnecting = false;
      performanceMonitor.recordWebSocketError();
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(
      this.maxReconnectDelay,
      this.baseReconnectDelay * Math.pow(1.5, this.reconnectAttempts)
    ) + Math.random() * 500; // Random jitter

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      if (this.shouldReconnect && this.currentWorldId) {
        this.connect(this.currentWorldId);
      }
    }, delay);
  }

  /**
   * Handles deserialization, sequence checks, delta application, and dispatching.
   */
  private handleIncomingMessage(rawText: string) {
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      performanceMonitor.recordWebSocketError();
      return;
    }

    const envelope: EventEnvelope = {
      event_id: parsed.event_id || `evt_${Date.now()}`,
      event_type: parsed.event_type || parsed.type || 'unknown',
      category: parsed.category || 'simulation',
      schema_version: parsed.schema_version || '1.0',
      world_id: parsed.world_id || this.currentWorldId || '',
      sequence_number: parsed.sequence_number || 0,
      world_state_version: parsed.world_state_version || 0,
      timestamp: parsed.timestamp || Date.now(),
      priority: parsed.priority || 'normal',
      idempotency_key: parsed.idempotency_key,
      payload: parsed.payload || parsed,
      type: parsed.type || parsed.event_type,
    };

    // 1. Monotonic Sequence & Gap Check
    if (envelope.sequence_number > 0) {
      if (this.lastSequenceNumber > 0 && envelope.sequence_number <= this.lastSequenceNumber) {
        // Stale or duplicate packet rejected
        return;
      }

      if (this.lastSequenceNumber > 0 && envelope.sequence_number > this.lastSequenceNumber + 1) {
        // Sequence gap detected: request authoritative snapshot resynchronization
        this.requestResync();
      }

      this.lastSequenceNumber = envelope.sequence_number;
    }

    // 2. Authoritative State Patching (Snapshots & Deltas)
    if (envelope.event_type === 'initial_state' || envelope.event_type === 'world.state.snapshot') {
      const stateData = envelope.payload?.world || envelope.payload?.state || envelope.payload;
      this.authoritativeState = { ...stateData };
      if (envelope.world_state_version) {
        this.lastStateVersion = envelope.world_state_version;
      }
    } else if (envelope.event_type === 'world.state.delta' || (envelope.payload && envelope.payload.delta)) {
      const deltaObj = envelope.payload.delta || envelope.payload;
      if (deltaObj && deltaObj.updates) {
        this.authoritativeState = deepMerge(this.authoritativeState, deltaObj.updates);
        if (Array.isArray(deltaObj.removals)) {
          for (const remKey of deltaObj.removals) {
            delete this.authoritativeState[remKey];
          }
        }
      }
      if (envelope.world_state_version) {
        this.lastStateVersion = envelope.world_state_version;
      }
    }

    // 3. Heartbeat Response
    if (envelope.event_type === 'heartbeat.ping') {
      this.send('heartbeat.pong', { client_timestamp: Date.now() });
      return;
    }

    // 4. Dispatch to subscribers
    this.dispatchEvent(envelope);
  }

  private dispatchEvent(envelope: EventEnvelope) {
    const specificListeners = this.listeners.get(envelope.event_type);
    if (specificListeners) {
      specificListeners.forEach((cb) => {
        try {
          cb(envelope);
        } catch {
          // Guard against subscriber errors breaking the event loop
        }
      });
    }

    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach((cb) => {
        try {
          cb(envelope);
        } catch {}
      });
    }
  }

  /**
   * Subscribes a listener to a specific event type or '*' wildcard.
   * Returns an unsubscribe cleanup callback.
   */
  public subscribe<T = any>(eventType: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback as EventCallback);

    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(callback as EventCallback);
        if (set.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Sends an outbound command over WebSocket with optional idempotency protection.
   */
  public send(type: string, payload: Record<string, any> = {}, idempotencyKey?: string): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    const message = JSON.stringify({
      type,
      idempotency_key: idempotencyKey,
      timestamp: Date.now(),
      ...payload,
    });

    try {
      this.socket.send(message);
      performanceMonitor.recordWebSocketMessageSent();
      return true;
    } catch {
      performanceMonitor.recordWebSocketError();
      return false;
    }
  }

  /**
   * Requests an immediate authoritative state resynchronization from the server.
   */
  public requestResync(): void {
    if (this.currentWorldId) {
      this.send('resync', { world_id: this.currentWorldId });
    }
  }

  /**
   * Gets the current authoritative client-side reconciled state snapshot.
   */
  public getState(): Record<string, any> {
    return this.authoritativeState;
  }

  /**
   * Safely closes the WebSocket connection and prevents auto-reconnection.
   */
  public disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.onmessage = null;
      this.socket.close(1000, 'Client disconnected');
      this.socket = null;
    }
    performanceMonitor.setWebSocketStatus('idle');
  }
}

// Global Singleton Client
export const civoraEventClient = new CivoraEventClient();
