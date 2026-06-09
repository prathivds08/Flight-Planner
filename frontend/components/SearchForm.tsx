"use client";

import { useState } from "react";
import { Strategy } from "@/lib/types";

interface SearchFormProps {
  cities: string[];
  onSearch: (
    source: string,
    destination: string,
    t1: number,
    t2: number,
    strategy: Strategy
  ) => void;
  loading: boolean;
  initialLoading: boolean;
}

const strategies: {
  id: Strategy;
  label: string;
  icon: string;
  desc: string;
}[] = [
  {
    id: "cheapest",
    label: "Cheapest",
    icon: "💰",
    desc: "Lowest total fare",
  },
  {
    id: "least-flights-earliest",
    label: "Fastest",
    icon: "⚡",
    desc: "Fewest stops, earliest",
  },
  {
    id: "least-flights-cheapest",
    label: "Best Value",
    icon: "🎯",
    desc: "Fewest stops, cheapest",
  },
];

export default function SearchForm({
  cities,
  onSearch,
  loading,
  initialLoading,
}: SearchFormProps) {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [t1, setT1] = useState(0);
  const [t2, setT2] = useState(500);
  const [strategy, setStrategy] = useState<Strategy>("cheapest");

  const canSubmit =
    source && destination && source !== destination && !loading && !initialLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onSearch(source, destination, t1, t2, strategy);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card rounded-3xl p-6 md:p-8 animate-slide-up"
    >
      {/* Section Header */}
      <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        Find Your Route
      </h2>

      {/* ── City Selectors ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label
            htmlFor="source-city"
            className="block text-sm text-white/50 mb-2 font-medium"
          >
            From
          </label>
          <select
            id="source-city"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="input-field"
            disabled={initialLoading}
          >
            <option value="">
              {initialLoading ? "Loading cities…" : "Select departure city"}
            </option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="dest-city"
            className="block text-sm text-white/50 mb-2 font-medium"
          >
            To
          </label>
          <select
            id="dest-city"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="input-field"
            disabled={initialLoading}
          >
            <option value="">
              {initialLoading ? "Loading cities…" : "Select arrival city"}
            </option>
            {cities
              .filter((c) => c !== source)
              .map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* ── Time Constraints ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label
            htmlFor="departure-time"
            className="block text-sm text-white/50 mb-2 font-medium"
          >
            Earliest Departure Time
          </label>
          <input
            id="departure-time"
            type="number"
            value={t1}
            onChange={(e) => setT1(Number(e.target.value))}
            min={0}
            className="input-field"
            placeholder="e.g. 0"
          />
        </div>
        <div>
          <label
            htmlFor="arrival-time"
            className="block text-sm text-white/50 mb-2 font-medium"
          >
            Latest Arrival Time
          </label>
          <input
            id="arrival-time"
            type="number"
            value={t2}
            onChange={(e) => setT2(Number(e.target.value))}
            min={t1}
            className="input-field"
            placeholder="e.g. 500"
          />
        </div>
      </div>

      {/* ── Strategy Toggle ───────────────────────────────────────────── */}
      <div className="mb-6">
        <label className="block text-sm text-white/50 mb-3 font-medium">
          Optimization Strategy
        </label>
        <div className="grid grid-cols-3 gap-3">
          {strategies.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStrategy(s.id)}
              className={`strategy-btn ${
                strategy === s.id ? "strategy-btn-active" : ""
              }`}
            >
              <span className="text-xl">{s.icon}</span>
              <span className="font-medium text-sm">{s.label}</span>
              <span className="text-[10px] text-white/35 leading-tight">
                {s.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Submit Button ─────────────────────────────────────────────── */}
      <button
        id="search-routes-btn"
        type="submit"
        disabled={!canSubmit}
        className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-white
          bg-gradient-to-r from-accent-cyan to-accent-purple
          hover:shadow-lg hover:shadow-accent-cyan/20
          active:scale-[0.98]
          transition-all duration-300
          disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none
          flex items-center justify-center gap-2 cursor-pointer"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Finding Best Route…
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Search Routes
          </>
        )}
      </button>
    </form>
  );
}
