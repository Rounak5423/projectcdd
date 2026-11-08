"""
CIVORA — Performance Monitoring ASGI Middleware
Tracks HTTP request timings, correlation IDs and rolling API metrics.
"""

import time
import uuid
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from monitoring.collector import perf_collector


class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """
    Lightweight middleware capturing request durations, correlation IDs
    and status codes without logging sensitive headers, tokens or bodies.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Determine or generate Correlation ID
        correlation_id = (
            request.headers.get("X-Correlation-ID")
            or request.headers.get("X-Request-ID")
            or f"corr_{uuid.uuid4().hex[:12]}"
        )

        # Store correlation ID in request state for downstream handlers
        request.state.correlation_id = correlation_id

        # Measure wall clock execution duration
        start_time = time.perf_counter()
        status_code = 500

        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        except Exception as exc:
            status_code = 500
            raise exc
        finally:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0

            # Exclude diagnostics and internal openapi paths from sampling to avoid polluting telemetry
            path = request.url.path
            if not (path.startswith("/api/v1/diagnostics") or path in ("/openapi.json", "/docs", "/redoc")):
                # Normalize path for parameterized routes where possible
                perf_collector.record_api_request(
                    method=request.method,
                    path=path,
                    status_code=status_code,
                    duration_ms=elapsed_ms,
                    correlation_id=correlation_id,
                )

            # In Starlette, response object is available if no unhandled exception occurred
            try:
                if 'response' in locals() and response is not None:
                    response.headers["X-Correlation-ID"] = correlation_id
                    response.headers["X-Response-Time-Ms"] = f"{elapsed_ms:.2f}"
            except Exception:
                pass

