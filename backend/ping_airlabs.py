"""
ping_airlabs.py — Diagnostic script to test AirLabs API connectivity.

Run from the backend directory:
    python ping_airlabs.py

Checks:
    1. API key is present in .env
    2. /ping endpoint responds (key validity)
    3. /schedules endpoint returns real flight data for each Indian airport
    4. Parsed time slots are valid
"""

import asyncio
import sys
from pathlib import Path

# ── Allow importing app modules ────────────────────────────────────────────
sys.path.insert(0, str(Path(__file__).parent))

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from app.config import settings
from app.live_api import (
    AIRLABS_BASE,
    IATA_TO_CITY,
    AIRLINE_NAMES,
    _parse_time,
)

# ANSI colors
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

OK   = f"{GREEN}  ✔{RESET}"
WARN = f"{YELLOW}  ⚠{RESET}"
FAIL = f"{RED}  ✘{RESET}"


def header(text: str) -> None:
    print(f"\n{BOLD}{CYAN}{'─' * 60}{RESET}")
    print(f"{BOLD}{CYAN}  {text}{RESET}")
    print(f"{BOLD}{CYAN}{'─' * 60}{RESET}")


# ── Check 1: API key present ───────────────────────────────────────────────
header("Check 1 — API Key")

api_key = settings.airlabs_api_key
if api_key:
    masked = api_key[:8] + "****" + api_key[-4:]
    print(f"{OK}  Key found in .env: {masked}")
else:
    print(f"{FAIL}  No AIRLABS_API_KEY found in .env")
    print(f"      Add it to backend/.env:  AIRLABS_API_KEY=<your-key>")
    sys.exit(1)

print(f"      USE_MOCK_DATA = {settings.use_mock_data}")


async def main() -> None:
    async with httpx.AsyncClient(timeout=15.0) as client:

        # ── Check 2: /ping ─────────────────────────────────────────────────
        header("Check 2 — AirLabs /ping (key validity)")
        try:
            resp = await client.get(
                f"{AIRLABS_BASE}/ping",
                params={"api_key": api_key},
            )
            body = resp.json()
            if resp.status_code == 200 and "request" in body:
                info = body.get("request", {})
                print(f"{OK}  /ping OK  (status {resp.status_code})")
                print(f"      Limit  : {info.get('limit', '?')} req/month")
                print(f"      Used   : {info.get('used', '?')} req/month")
                remaining = info.get("limit", 0) - info.get("used", 0)
                if remaining < 50:
                    print(f"{WARN}  Only {remaining} requests remaining — quota almost exhausted!")
            elif resp.status_code == 403:
                body_err = body.get("error", {})
                print(f"{FAIL}  403 Forbidden — {body_err.get('message', 'API key rejected')}")
                print(f"      → Key is invalid, expired, or quota exhausted.")
                print(f"      → Visit https://airlabs.co to regenerate your key.")
                sys.exit(1)
            else:
                print(f"{WARN}  Unexpected response: HTTP {resp.status_code}")
                print(f"      Body: {body}")
        except httpx.RequestError as e:
            print(f"{FAIL}  Network error: {e}")
            sys.exit(1)

        # ── Check 3: /schedules for each airport ───────────────────────────
        header("Check 3 — /schedules per Airport")

        total_flights = 0
        failed_airports = []

        for iata, city in IATA_TO_CITY.items():
            try:
                resp = await client.get(
                    f"{AIRLABS_BASE}/schedules",
                    params={"api_key": api_key, "dep_iata": iata},
                )
                if resp.status_code != 200:
                    print(f"{FAIL}  {iata} ({city:12s}) — HTTP {resp.status_code}")
                    failed_airports.append(iata)
                    continue

                flights = resp.json().get("response", [])

                # Filter to only Indian-airport arrivals
                mapped = [
                    f for f in flights
                    if f.get("arr_iata", "") in IATA_TO_CITY
                ]

                # Count parseable times
                valid = 0
                for f in mapped:
                    dt = _parse_time(f.get("dep_time", ""))
                    at = _parse_time(f.get("arr_time", ""))
                    if dt >= 0 and at >= 0:
                        valid += 1

                total_flights += valid
                print(f"{OK}  {iata} ({city:12s}) — "
                      f"{len(flights):3d} raw | "
                      f"{len(mapped):3d} Indian routes | "
                      f"{valid:3d} with valid times")

            except httpx.RequestError as e:
                print(f"{FAIL}  {iata} ({city}) — Network error: {e}")
                failed_airports.append(iata)

        # ── Check 4: Sample flight details ─────────────────────────────────
        header("Check 4 — Sample Flight Data (BOM departures)")
        try:
            resp = await client.get(
                f"{AIRLABS_BASE}/schedules",
                params={"api_key": api_key, "dep_iata": "BOM"},
            )
            if resp.status_code == 200:
                flights = resp.json().get("response", [])
                indian_flights = [
                    f for f in flights
                    if f.get("arr_iata", "") in IATA_TO_CITY
                ]
                print(f"  Showing up to 8 BOM -> Indian-airport flights:\n")
                print(f"  {'Route':<22} {'Depart (raw)':<22} {'Arrive (raw)':<22} {'Parsed dep':>10} {'Airline'}")
                print(f"  {'─'*22} {'─'*22} {'─'*22} {'─'*10} {'─'*15}")
                for f in indian_flights[:8]:
                    arr_city = IATA_TO_CITY.get(f.get("arr_iata", ""), "?")
                    dep_raw  = str(f.get("dep_time", "?"))
                    arr_raw  = str(f.get("arr_time", "?"))
                    dep_min  = _parse_time(dep_raw)
                    al_iata  = f.get("airline_iata", "")
                    al_name  = AIRLINE_NAMES.get(al_iata, al_iata)
                    route    = f"Mumbai -> {arr_city}"
                    parsed   = f"{dep_min//60}:{dep_min%60:02d}" if dep_min >= 0 else "FAIL"
                    status   = OK if dep_min >= 0 else FAIL
                    print(f"  {route:<22} {dep_raw:<22} {arr_raw:<22} {parsed:>10}  {al_name}")
        except Exception as e:
            print(f"{WARN}  Could not fetch sample data: {e}")

        # ── Summary ────────────────────────────────────────────────────────
        header("Summary")
        if failed_airports:
            print(f"{WARN}  Failed airports : {', '.join(failed_airports)}")
        else:
            print(f"{OK}  All airports responded successfully")

        print(f"{OK}  Total valid mapped flights : {total_flights}")

        if total_flights > 0:
            print(f"\n{GREEN}{BOLD}  AirLabs API is WORKING — live data will be used.{RESET}")
            print(f"  Restart the backend to reload live schedules.")
        else:
            print(f"\n{RED}{BOLD}  No valid flights found — backend will fall back to CSV mock data.{RESET}")

        print()


asyncio.run(main())
