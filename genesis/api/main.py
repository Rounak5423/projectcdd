"""FastAPI application: REST API, live WebSocket updates and the static web app."""
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from ..errors import GenesisError
from .deps import get_service
from .routes.api import router

STATIC = Path(__file__).resolve().parent.parent / "static"
app = FastAPI(title="GENESIS - The Artificial Civilisation Engine", version="1.0.0")
app.include_router(router)
app.mount("/static", StaticFiles(directory=str(STATIC)), name="static")


class Connections:
    def __init__(self):
        self.sockets = []

    async def broadcast(self, message):
        for ws in list(self.sockets):
            try:
                await ws.send_json(message)
            except Exception:  # noqa: BLE001 - drop broken connections
                if ws in self.sockets:
                    self.sockets.remove(ws)


connections = Connections()


@app.on_event("startup")
async def _startup():
    get_service().broadcast = connections.broadcast


@app.on_event("shutdown")
async def _shutdown():
    svc = get_service()
    svc.running = False
    svc.save()


@app.exception_handler(GenesisError)
async def _genesis_error(_, exc):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html")


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    """Live updates: the server pushes {"type": "state", "data": <world state>} after every simulated day."""
    await ws.accept()
    connections.sockets.append(ws)
    try:
        await ws.send_json({"type": "state", "data": get_service().state()})
        while True:
            await ws.receive_text()        # clients may send "ping"; we reply with the latest state
            await ws.send_json({"type": "state", "data": get_service().state()})
    except WebSocketDisconnect:
        pass
    finally:
        if ws in connections.sockets:
            connections.sockets.remove(ws)
