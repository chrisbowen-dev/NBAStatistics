"""
NBA Stats FastAPI application entry point.

Starts the FastAPI app, registers CORS middleware (Express on :5000 is the
only allowed origin), and mounts the players and teams routers.

Run with:
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import players, teams

app = FastAPI(
    title="NBA Stats API",
    description=(
        "Internal FastAPI service that wraps nba_api. "
        "Called only by the Express backend — not exposed to the browser."
    ),
    version="1.0.0",
)

# Allow the Express backend (http://localhost:5000) to call this service.
# Only GET requests are needed; no credentials or exotic headers are used.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Register routers — each carries its own prefix (/players, /teams).
app.include_router(players.router)
app.include_router(teams.router)


@app.get("/health", tags=["health"])
def health():
    """Simple liveness check — returns HTTP 200 when the service is running."""
    return {"status": "ok"}
