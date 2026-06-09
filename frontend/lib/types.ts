/* ── TypeScript interfaces for the Flight Planner API ──────────────────── */

export interface FlightSegment {
  flight_no: number;
  start_city: string;
  departure_time: number;
  departure_time_formatted: string;
  end_city: string;
  arrival_time: number;
  arrival_time_formatted: string;
  fare: number;
  airline: string;
}

export interface RouteResponse {
  route: FlightSegment[];
  total_fare: number;
  total_flights: number;
  strategy: string;
}

export interface RouteRequest {
  start_city: string;
  end_city: string;
  t1: number;
  t2: number;
}

export interface TimeSlot {
  value: number;
  label: string;
}

export interface TimeSlotsResponse {
  departure_times: TimeSlot[];
  arrival_times: TimeSlot[];
}

export type Strategy =
  | "cheapest"
  | "least-flights-earliest"
  | "least-flights-cheapest";

/**
 * Format a duration in minutes to a human-readable string like "2h 30m".
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
