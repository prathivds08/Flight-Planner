"use client";

import { useState } from "react";
import { RouteResponse, formatDuration } from "@/lib/types";
import { AllResults } from "@/app/page";
import FlightCard from "./FlightCard";

interface RouteResultsProps {
  results: AllResults;
  loading: boolean;
}

const TABS = [
  {
    key: "cheapest" as const,
    label: "Cheapest",
    icon: "💰",
    color: "text-accent-emerald",
    activeBg: "bg-accent-emerald/10 border-accent-emerald/30",
    badgeBg: "bg-accent-emerald/10 border-accent-emerald/20 text-accent-emerald",
  },
  {
    key: "fastest" as const,
    label: "Fastest",
    icon: "⚡",
    color: "text-accent-cyan",
    activeBg: "bg-accent-cyan/10 border-accent-cyan/30",
    badgeBg: "bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan",
  },
  {
    key: "bestValue" as const,
    label: "Best Value",
    icon: "🎯",
    color: "text-accent-purple",
    activeBg: "bg-accent-purple/10 border-accent-purple/30",
    badgeBg: "bg-accent-purple/10 border-accent-purple/20 text-accent-purple",
  },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ── Skeleton loader for a single tab pane ─────────────────────────── */
function TabSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="h-24 rounded-2xl bg-white/[0.03] border border-white/[0.04]"
        />
      ))}
      <div className="h-16 rounded-2xl bg-white/[0.03] border border-white/[0.04]" />
    </div>
  );
}

/* ── Single route pane ─────────────────────────────────────────────── */
function RoutePaneContent({
  result,
  tab,
}: {
  result: RouteResponse | null;
  tab: (typeof TABS)[number];
}) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3">
          <svg
            className="w-7 h-7 text-red-400"
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
        <p className="text-white/50 font-medium text-sm">No route found</p>
        <p className="text-white/25 text-xs mt-1">
          Try widening your time window
        </p>
      </div>
    );
  }

  if (result.route.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3">
          <svg
            className="w-7 h-7 text-red-400"
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
        <p className="text-white/50 font-medium text-sm">No route found</p>
        <p className="text-white/25 text-xs mt-1">
          Try widening your time window
        </p>
      </div>
    );
  }

  const duration =
    result.route[result.route.length - 1].arrival_time -
    result.route[0].departure_time;

  return (
    <>
      {/* Flight cards */}
      <div className="space-y-0 pl-2 mb-5">
        {result.route.map((flight, idx) => (
          <FlightCard
            key={`${flight.flight_no}-${idx}`}
            flight={flight}
            index={idx}
            isLast={idx === result.route.length - 1}
          />
        ))}
      </div>

      {/* Summary bar */}
      <div className="pt-4 border-t border-white/[0.06] grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className={`text-xl font-bold ${tab.color}`}>
            ₹{result.total_fare.toLocaleString()}
          </p>
          <p className="text-[10px] text-white/35 mt-0.5 uppercase tracking-wider">
            Total Fare
          </p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-white">{result.total_flights}</p>
          <p className="text-[10px] text-white/35 mt-0.5 uppercase tracking-wider">
            {result.total_flights === 1 ? "Flight" : "Flights"}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-white">
            {formatDuration(duration)}
          </p>
          <p className="text-[10px] text-white/35 mt-0.5 uppercase tracking-wider">
            Duration
          </p>
        </div>
      </div>
    </>
  );
}

/* ── Main component ─────────────────────────────────────────────────── */
export default function RouteResults({ results, loading }: RouteResultsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("cheapest");

  const activeTabMeta = TABS.find((t) => t.key === activeTab)!;
  const activeResult = results[activeTab];

  /* ── Empty State ─────────────────────────────────────────────────── */
  const hasAnyResult =
    results.cheapest !== null ||
    results.fastest !== null ||
    results.bestValue !== null;

  if (!loading && !hasAnyResult) {
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
          <p className="text-white/25 text-sm">Select cities to see routes</p>
          <p className="text-white/15 text-xs mt-1">
            All three route types will appear automatically
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-6 md:p-8 animate-fade-in">
      {/* ── Tab Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-6 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          const hasRoute = results[tab.key]?.route?.length > 0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              disabled={loading}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl text-xs font-semibold
                transition-all duration-200 border
                ${
                  isActive
                    ? `${tab.activeBg} text-white`
                    : "border-transparent text-white/40 hover:text-white/60"
                }
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="text-base leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
              {/* dot indicator: green = has route, red = no route */}
              {!loading && results[tab.key] !== null && (
                <span
                  className={`w-1 h-1 rounded-full ${
                    hasRoute ? "bg-accent-emerald" : "bg-red-500/60"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ────────────────────────────────────────────── */}
      {loading ? (
        <TabSkeleton />
      ) : (
        <div className="animate-fade-in">
          {/* Badge */}
          {activeResult && activeResult.route.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/70">
                {activeResult.strategy}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${activeTabMeta.badgeBg}`}
              >
                {activeResult.total_flights}{" "}
                {activeResult.total_flights === 1 ? "flight" : "flights"}
              </span>
            </div>
          )}

          <RoutePaneContent result={activeResult} tab={activeTabMeta} />
        </div>
      )}
    </div>
  );
}
