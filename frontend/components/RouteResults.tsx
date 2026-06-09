"use client";

import { RouteResponse } from "@/lib/types";
import FlightCard from "./FlightCard";

interface RouteResultsProps {
  result: RouteResponse | null;
  loading: boolean;
}

export default function RouteResults({ result, loading }: RouteResultsProps) {
  /* ── Loading State ────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="glass-card rounded-3xl p-8 flex items-center justify-center min-h-[320px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-accent-cyan/20" />
            <div className="absolute inset-0 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin" />
            <svg
              className="absolute inset-0 m-auto w-6 h-6 text-accent-cyan"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
          </div>
          <p className="text-white/40 text-sm">
            Calculating optimal route…
          </p>
        </div>
      </div>
    );
  }

  /* ── Empty State (no search yet) ──────────────────────────────────── */
  if (!result) {
    return (
      <div className="glass-card rounded-3xl p-8 flex items-center justify-center min-h-[320px]">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white/10"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
          </div>
          <p className="text-white/25 text-sm">
            Search for a route to see results
          </p>
          <p className="text-white/15 text-xs mt-1">
            Select cities, set time constraints, and choose a strategy
          </p>
        </div>
      </div>
    );
  }

  /* ── No Route Found ───────────────────────────────────────────────── */
  if (result.route.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-8 flex items-center justify-center min-h-[320px]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <p className="text-white/60 font-medium">No Route Found</p>
          <p className="text-white/30 text-sm mt-1">
            Try adjusting your time constraints or selecting different cities
          </p>
        </div>
      </div>
    );
  }

  /* ── Route Results ────────────────────────────────────────────────── */
  return (
    <div className="glass-card rounded-3xl p-6 md:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg
            className="w-5 h-5 text-accent-cyan"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          Route Found
        </h3>
        <span className="px-3 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-xs font-medium">
          {result.strategy}
        </span>
      </div>

      {/* Flight Segment Cards */}
      <div className="space-y-0 pl-2">
        {result.route.map((flight, index) => (
          <FlightCard
            key={`${flight.flight_no}-${index}`}
            flight={flight}
            index={index}
            isLast={index === result.route.length - 1}
          />
        ))}
      </div>

      {/* Summary Bar */}
      <div className="mt-6 pt-6 border-t border-white/[0.06]">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-accent-emerald">
              ₹{result.total_fare.toLocaleString()}
            </p>
            <p className="text-[10px] text-white/35 mt-1 uppercase tracking-wider">
              Total Fare
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-accent-cyan">
              {result.total_flights}
            </p>
            <p className="text-[10px] text-white/35 mt-1 uppercase tracking-wider">
              {result.total_flights === 1 ? "Flight" : "Flights"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-accent-purple">
              {result.route.length > 0
                ? result.route[result.route.length - 1].arrival_time -
                  result.route[0].departure_time
                : 0}
            </p>
            <p className="text-[10px] text-white/35 mt-1 uppercase tracking-wider">
              Duration
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
