"""
Data loading orchestrator.

Tries AirLabs live data first, then falls back to the local CSV with
realistic randomization to simulate live market conditions.
"""

import csv
import random
from pathlib import Path

from app.flight import Flight
from app.config import settings
from app.live_api import fetch_airlabs_flights


async def load_flights() -> tuple[list[Flight], dict[int, str]]:
    """
    Load flights from the best available source.

    Returns:
        (flights, airline_map)  where airline_map maps flight_no → airline name
    """
    # ── Try live data first ─────────────────────────────────────────────
    if not settings.use_mock_data:
        flights, airline_map = await fetch_airlabs_flights()
        if flights:
            print(f"[DataLoader] Loaded {len(flights)} flights from AirLabs API")
            return flights, airline_map
        print("[DataLoader] AirLabs returned no data — falling back to CSV")

    # ── Fallback: CSV with market‑jitter ────────────────────────────────
    flights, airline_map = _load_csv_flights()
    print(f"[DataLoader] Loaded {len(flights)} flights from CSV (mock mode)")
    return flights, airline_map


def _load_csv_flights() -> tuple[list[Flight], dict[int, str]]:
    """
    Read flights.csv and apply slight randomization to fares and times
    so each server restart feels like fresh live market data.
    """
    csv_path = Path(__file__).parent.parent / "data" / "flights.csv"
    flights: list[Flight] = []
    airline_map: dict[int, str] = {}

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Apply ±15 % fare jitter to simulate dynamic pricing
            base_fare = int(row["fare"])
            jittered_fare = max(500, int(base_fare * random.uniform(0.85, 1.15)))

            # Apply ±3 time‑unit jitter for schedule variance
            time_offset = random.randint(-3, 3)
            dep_time = max(0, int(row["departure_time"]) + time_offset)
            arr_time = max(dep_time + 10, int(row["arrival_time"]) + time_offset)

            fno = int(row["flight_no"])
            flights.append(
                Flight(
                    flight_no=fno,
                    start_city=row["start_city"].strip(),
                    departure_time=dep_time,
                    end_city=row["end_city"].strip(),
                    arrival_time=arr_time,
                    fare=jittered_fare,
                )
            )
            airline_map[fno] = row.get("airline", "").strip()

    return flights, airline_map


def get_cities(flights: list[Flight]) -> list[str]:
    """Extract unique city names from a flight list."""
    cities: set[str] = set()
    for f in flights:
        cities.add(f.start_city)
        cities.add(f.end_city)
    return sorted(cities)
