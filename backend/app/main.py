"""
Flight Planner — FastAPI Application

Wraps the original Planner algorithms into RESTful endpoints.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models import (
    RouteRequest,
    RouteResponse,
    FlightSegment,
    CitiesResponse,
    TimeSlot,
    TimeSlotsResponse,
)
from app.planner import Planner
from app.data_loader import load_flights, get_cities, get_data_source


# ── Module-level state ──────────────────────────────────────────────────────
_planner: Planner | None = None
_flights: list = []
_airline_map: dict[int, str] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load flight data and initialize the Planner on startup."""
    global _planner, _flights, _airline_map
    _flights, _airline_map = await load_flights()
    _planner = Planner(_flights)
    print(f"[Startup] Planner ready — {len(_flights)} flights across {len(get_cities(_flights))} cities")
    yield


# ── App Setup ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Flight Planner API",
    description="Intelligent Flight Route Optimization — powered by custom graph algorithms",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ─────────────────────────────────────────────────────────────────
def format_time(minutes: int) -> str:
    """Convert minutes from midnight to 12-hour format (e.g. '6:30 AM')."""
    hours = (minutes // 60) % 24
    mins = minutes % 60
    period = "AM" if hours < 12 else "PM"
    display_hours = hours % 12 or 12
    return f"{display_hours}:{mins:02d} {period}"


def _make_segment(f) -> FlightSegment:
    """Create a FlightSegment with formatted times from a Flight object."""
    return FlightSegment(
        flight_no=f.flight_no,
        start_city=f.start_city,
        departure_time=f.departure_time,
        departure_time_formatted=format_time(f.departure_time),
        end_city=f.end_city,
        arrival_time=f.arrival_time,
        arrival_time_formatted=format_time(f.arrival_time),
        fare=f.fare,
        airline=_airline_map.get(f.flight_no, ""),
    )


def _serialize_route(route_flights: list, strategy: str) -> RouteResponse:
    """Convert a list of Flight objects into a typed API response."""
    segments: list[FlightSegment] = []
    total_fare = 0

    for f in route_flights:
        total_fare += f.fare
        segments.append(_make_segment(f))

    return RouteResponse(
        route=segments,
        total_fare=total_fare,
        total_flights=len(segments),
        strategy=strategy,
    )


# ── Endpoints ───────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    """Health check endpoint."""
    source = get_data_source()
    return {
        "status": "ok",
        "flights_loaded": len(_flights),
        "cities": len(get_cities(_flights)),
        "data_source": source,
        "mode": "live (AirLabs)" if source == "airlabs" else "mock (CSV fallback)",
    }


@app.get("/api/cities", response_model=CitiesResponse)
async def cities():
    """Return all available cities in the current flight network."""
    city_list = get_cities(_flights)
    return CitiesResponse(cities=city_list)


@app.get("/api/flights", response_model=list[FlightSegment])
async def all_flights():
    """Return all loaded flights — used by the frontend graph visualizer."""
    return [_make_segment(f) for f in _flights]


@app.get("/api/time-slots", response_model=TimeSlotsResponse)
async def time_slots(source: str | None = None, destination: str | None = None):
    """Return unique departure/arrival times, optionally filtered by city.

    - **source**: if provided, only return departure times from this city.
    - **destination**: if provided, only return arrival times to this city.

    The frontend uses these to populate time-constraint dropdowns so users
    can only pick times that actually exist for their chosen route.
    """
    if source:
        dep_times = sorted(set(f.departure_time for f in _flights if f.start_city == source))
    else:
        dep_times = sorted(set(f.departure_time for f in _flights))

    if destination:
        arr_times = sorted(set(f.arrival_time for f in _flights if f.end_city == destination))
    else:
        arr_times = sorted(set(f.arrival_time for f in _flights))

    return TimeSlotsResponse(
        departure_times=[
            TimeSlot(value=t, label=format_time(t)) for t in dep_times
        ],
        arrival_times=[
            TimeSlot(value=t, label=format_time(t)) for t in arr_times
        ],
    )


@app.post("/api/routes/cheapest", response_model=RouteResponse)
async def cheapest_route(req: RouteRequest):
    """Find the cheapest route between two cities (Dijkstra on fares)."""
    route = _planner.cheapest_route(req.start_city, req.end_city, req.t1, req.t2)
    return _serialize_route(route, "Cheapest Route")


@app.post("/api/routes/least-flights-earliest", response_model=RouteResponse)
async def least_flights_earliest(req: RouteRequest):
    """Find the route with fewest flights; tie-break by earliest arrival (BFS)."""
    route = _planner.least_flights_earliest_route(req.start_city, req.end_city, req.t1, req.t2)
    return _serialize_route(route, "Least Flights · Earliest Arrival")


@app.post("/api/routes/least-flights-cheapest", response_model=RouteResponse)
async def least_flights_cheapest(req: RouteRequest):
    """Find the route with fewest flights; tie-break by cheapest fare (BFS)."""
    route = _planner.least_flights_cheapest_route(req.start_city, req.end_city, req.t1, req.t2)
    return _serialize_route(route, "Least Flights · Cheapest Fare")


@app.post("/api/routes/refresh")
async def refresh_data():
    """Re-fetch flight data from the live API (or regenerate mock data)."""
    global _planner, _flights, _airline_map
    _flights, _airline_map = await load_flights()
    _planner = Planner(_flights)
    return {
        "status": "refreshed",
        "flights_loaded": len(_flights),
        "cities": len(get_cities(_flights)),
    }
