/* ── API Client — communicates with the FastAPI backend ────────────────── */

import { FlightSegment, RouteResponse, RouteRequest, Strategy, TimeSlotsResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Fetch the list of all available cities from the flight network.
 */
export async function fetchCities(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/cities`);
  if (!res.ok) throw new Error("Failed to fetch cities");
  const data = await res.json();
  return data.cities;
}

/**
 * Fetch all loaded flights — used by the graph visualizer to render the
 * complete flight network.
 */
export async function fetchAllFlights(): Promise<FlightSegment[]> {
  const res = await fetch(`${API_BASE}/api/flights`);
  if (!res.ok) throw new Error("Failed to fetch flights");
  return res.json();
}

/**
 * Fetch available departure and arrival time slots from the current data.
 * Optionally filtered by source city (for departures) and destination city
 * (for arrivals) so users only see times relevant to their route.
 */
export async function fetchTimeSlots(
  source?: string,
  destination?: string
): Promise<TimeSlotsResponse> {
  const params = new URLSearchParams();
  if (source) params.set("source", source);
  if (destination) params.set("destination", destination);
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/api/time-slots${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to fetch time slots");
  return res.json();
}

/**
 * Request an optimized route from the backend using the specified strategy.
 */
export async function fetchRoute(
  strategy: Strategy,
  params: RouteRequest
): Promise<RouteResponse> {
  const res = await fetch(`${API_BASE}/api/routes/${strategy}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to fetch route");
  return res.json();
}

/**
 * Trigger a data refresh on the backend (re-fetch from AirLabs or
 * regenerate mock data).
 */
export async function refreshData(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/routes/refresh`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to refresh data");
}
