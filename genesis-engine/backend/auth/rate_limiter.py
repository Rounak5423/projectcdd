"""
CIVORA Engine — Lightweight In-Memory Sliding Window Rate Limiter (Phase 10)
Protects authentication endpoints from brute force and credential stuffing attacks.
"""

import time
import threading
from typing import Dict, List
from fastapi import Request, HTTPException, status
from config import settings


class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int = 30, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._lock = threading.Lock()
        self._requests: Dict[str, List[float]] = {}

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds

        with self._lock:
            timestamps = self._requests.get(client_ip, [])
            # Filter timestamps within current window
            valid_timestamps = [t for t in timestamps if t > cutoff]

            if len(valid_timestamps) >= self.max_requests:
                self._requests[client_ip] = valid_timestamps
                return False

            valid_timestamps.append(now)
            self._requests[client_ip] = valid_timestamps

            # Periodically cleanup idle IPs if dict exceeds 10,000 entries
            if len(self._requests) > 10000:
                self._requests = {k: v for k, v in self._requests.items() if v and v[-1] > cutoff}

            return True

    def reset(self):
        with self._lock:
            self._requests.clear()


auth_rate_limiter = SlidingWindowRateLimiter(
    max_requests=settings.AUTH_RATE_LIMIT_PER_MINUTE,
    window_seconds=60
)


async def check_auth_rate_limit(request: Request):
    """
    FastAPI dependency that enforces IP-level rate limiting on sensitive auth endpoints.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    
    # Check X-Forwarded-For if behind a reverse proxy
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()

    if not auth_rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts. Please wait a minute and try again."
        )
