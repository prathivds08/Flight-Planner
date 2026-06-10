"""
AirLabs live flight data integration + mock fallback service.

AirLabs API Docs: https://airlabs.co/docs/
Free tier: 1,000 requests/month.
"""

import httpx
import random
from app.flight import Flight
from app.config import settings


AIRLABS_BASE = "https://airlabs.co/api/v9"

# ── IATA ↔ City Name Mapping ───────────────────────────────────────────────
IATA_TO_CITY: dict[str, str] = {
    "BOM": "Mumbai",
    "DEL": "Delhi",
    "BLR": "Bangalore",
    "MAA": "Chennai",
    "HYD": "Hyderabad",
    "PNQ": "Pune",
    "GOI": "Goa",
    "CCU": "Kolkata",
    "AMD": "Ahmedabad",
    "LKO": "Lucknow",
    "JAI": "Jaipur",
}

# ── Estimated Base Fares (INR) ──────────────────────────────────────────────
# AirLabs free tier does not include pricing data, so we estimate fares
# based on typical domestic Indian flight prices for each route pair.
ROUTE_BASE_FARES: dict[tuple[str, str], int] = {
    ("Mumbai", "Delhi"): 5000,
    ("Mumbai", "Bangalore"): 4500,
    ("Mumbai", "Chennai"): 4800,
    ("Mumbai", "Hyderabad"): 3500,
    ("Mumbai", "Goa"): 2000,
    ("Mumbai", "Kolkata"): 6000,
    ("Mumbai", "Ahmedabad"): 2200,
    ("Mumbai", "Jaipur"): 4000,
    ("Mumbai", "Pune"): 1500,
    ("Delhi", "Chennai"): 4000,
    ("Delhi", "Hyderabad"): 3500,
    ("Delhi", "Bangalore"): 5000,
    ("Delhi", "Kolkata"): 4500,
    ("Delhi", "Lucknow"): 1500,
    ("Delhi", "Jaipur"): 1800,
    ("Delhi", "Ahmedabad"): 2800,
    ("Delhi", "Mumbai"): 5500,
    ("Bangalore", "Hyderabad"): 3000,
    ("Bangalore", "Chennai"): 1800,
    ("Bangalore", "Kolkata"): 5000,
    ("Chennai", "Hyderabad"): 3000,
    ("Chennai", "Kolkata"): 4500,
    ("Pune", "Delhi"): 2500,
    ("Pune", "Bangalore"): 3000,
    ("Goa", "Hyderabad"): 3500,
    ("Goa", "Chennai"): 2500,
    ("Goa", "Bangalore"): 2800,
    ("Kolkata", "Hyderabad"): 4000,
    ("Kolkata", "Delhi"): 3000,
    ("Ahmedabad", "Delhi"): 2800,
    ("Ahmedabad", "Goa"): 3200,
    ("Jaipur", "Delhi"): 1800,
    ("Jaipur", "Hyderabad"): 5000,
    ("Lucknow", "Hyderabad"): 3500,
}
DEFAULT_FARE = 4000


# ── Airline IATA → Name Mapping ────────────────────────────────────────────
AIRLINE_NAMES: dict[str, str] = {
    "6E": "IndiGo",
    "AI": "AirIndia",
    "UK": "Vistara",
    "SG": "SpiceJet",
    "I5": "AirAsia India",
    "QP": "Akasa Air",
    "G8": "GoFirst",
}


def _parse_time(time_str: str) -> int:
    """
    Convert a time string to minutes from midnight.

    Handles all formats returned by AirLabs:
      - 'HH:MM'                       → direct parse
      - 'YYYY-MM-DD HH:MM'            → space-separated datetime (actual AirLabs format)
      - 'YYYY-MM-DDTHH:MM:SS+05:30'   → ISO-8601 with T separator

    Returns -1 on failure.
    """
    if not time_str:
        return -1
    try:
        ts = str(time_str).strip()

        if "T" in ts:
            # ISO-8601: '2024-01-15T06:30:00+05:30'
            time_part = ts.split("T")[1][:5]
            h, m = time_part.split(":")
            return int(h) * 60 + int(m)

        if " " in ts:
            # AirLabs actual format: '2026-06-10 11:20'
            time_part = ts.split(" ")[1][:5]
            h, m = time_part.split(":")
            return int(h) * 60 + int(m)

        # Plain 'HH:MM'
        h, m = ts.split(":")[:2]
        return int(h) * 60 + int(m)

    except (ValueError, IndexError):
        return -1


async def fetch_airlabs_flights() -> tuple[list[Flight], dict[int, str]]:
    """
    Fetch scheduled flights from AirLabs for major Indian airports and map
    them into Flight objects that the Planner can ingest.

    Returns:
        (flights, airline_map)  where airline_map maps flight_no → airline name
    """
    if not settings.airlabs_api_key:
        return [], {}

    flights: list[Flight] = []
    airline_map: dict[int, str] = {}
    flight_no = 0
    seen: set[tuple[str, str, int]] = set()  # dedup key

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            for dep_iata, dep_city in IATA_TO_CITY.items():
                resp = await client.get(
                    f"{AIRLABS_BASE}/schedules",
                    params={
                        "api_key": settings.airlabs_api_key,
                        "dep_iata": dep_iata,
                    },
                )
                if resp.status_code != 200:
                    continue

                data = resp.json().get("response", [])
                for entry in data:
                    arr_iata = entry.get("arr_iata", "")
                    if arr_iata not in IATA_TO_CITY:
                        continue  # skip non‑mapped airports

                    arr_city = IATA_TO_CITY[arr_iata]

                    dep_time = _parse_time(entry.get("dep_time", ""))
                    arr_time = _parse_time(entry.get("arr_time", ""))
                    if dep_time < 0 or arr_time < 0:
                        continue
                    # Cap both times at 1439 (11:59 PM); skip impossible arrivals
                    dep_time = min(dep_time, 1439)
                    arr_time = min(arr_time, 1439)
                    if arr_time <= dep_time:
                        continue  # skip overnight/same-time flights; can't represent them cleanly

                    # Deduplicate identical (city‑pair, dep_time) combos
                    route_key = (dep_city, arr_city, dep_time)
                    if route_key in seen:
                        continue
                    seen.add(route_key)

                    # Estimate fare with ±25 % market variance
                    base = ROUTE_BASE_FARES.get((dep_city, arr_city), DEFAULT_FARE)
                    fare = int(base * random.uniform(0.80, 1.30))

                    # Resolve airline name
                    airline_iata = entry.get("airline_iata", "")
                    airline_name = AIRLINE_NAMES.get(airline_iata, airline_iata)

                    flights.append(
                        Flight(flight_no, dep_city, dep_time, arr_city, arr_time, fare)
                    )
                    airline_map[flight_no] = airline_name
                    flight_no += 1

        return flights, airline_map

    except Exception as exc:
        print(f"[AirLabs] API request failed: {exc}  — falling back to mock data")
        return [], {}
