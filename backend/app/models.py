from pydantic import BaseModel


class RouteRequest(BaseModel):
    """Request body for route-finding endpoints."""
    start_city: str
    end_city: str
    t1: int  # earliest departure time (minutes from midnight)
    t2: int  # latest arrival time (minutes from midnight)


class FlightSegment(BaseModel):
    """A single flight segment in a route."""
    flight_no: int
    start_city: str
    departure_time: int
    departure_time_formatted: str = ""
    end_city: str
    arrival_time: int
    arrival_time_formatted: str = ""
    fare: int
    airline: str = ""


class RouteResponse(BaseModel):
    """Response body for route-finding endpoints."""
    route: list[FlightSegment]
    total_fare: int
    total_flights: int
    strategy: str


class CitiesResponse(BaseModel):
    """Response body for the cities endpoint."""
    cities: list[str]


class TimeSlot(BaseModel):
    """A selectable time slot with raw value and display label."""
    value: int
    label: str


class TimeSlotsResponse(BaseModel):
    """Available departure and arrival time slots from the current data."""
    departure_times: list[TimeSlot]
    arrival_times: list[TimeSlot]
