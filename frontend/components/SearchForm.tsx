"use client";

import { useState, useEffect, useRef } from "react";
import { TimeSlot } from "@/lib/types";
import { fetchTimeSlots } from "@/lib/api";

interface SearchFormProps {
  cities: string[];
  onSearch: (
    source: string,
    destination: string,
    t1: number,
    t2: number
  ) => void;
  loading: boolean;
  initialLoading: boolean;
}

// Strategies are no longer selected in this form — they are shown as tabs in RouteResults
const strategies = [] as const; // kept for reference; unused in this component


export default function SearchForm({
  cities,
  onSearch,
  loading,
  initialLoading,
}: SearchFormProps) {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [t1, setT1] = useState<number | "">("");
  const [t2, setT2] = useState<number | "">("");

  const [departureSlots, setDepartureSlots] = useState<TimeSlot[]>([]);
  const [arrivalSlots, setArrivalSlots] = useState<TimeSlot[]>([]);
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false);

  // Track whether we've auto-searched for the current city pair
  const autoSearched = useRef(false);

  /* ── Fetch city-specific time slots when cities change ────────── */
  useEffect(() => {
    if (!source || !destination || source === destination) {
      setDepartureSlots([]);
      setArrivalSlots([]);
      setT1("");
      setT2("");
      return;
    }

    let cancelled = false;
    setTimeSlotsLoading(true);
    autoSearched.current = false; // reset for new city pair

    fetchTimeSlots(source, destination)
      .then((data) => {
        if (cancelled) return;
        setDepartureSlots(data.departure_times);
        setArrivalSlots(data.arrival_times);

        // Pick widest valid window: earliest departure → latest arrival
        const depTime = data.departure_times[0]?.value;
        const arrTime = data.arrival_times[data.arrival_times.length - 1]?.value;

        if (depTime !== undefined) setT1(depTime);
        if (arrTime !== undefined) setT2(arrTime);

        // Auto-search immediately with the widest time window
        if (
          depTime !== undefined &&
          arrTime !== undefined &&
          arrTime > depTime &&
          !autoSearched.current
        ) {
          autoSearched.current = true;
          onSearch(source, destination, depTime, arrTime);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDepartureSlots([]);
          setArrivalSlots([]);
        }
      })
      .finally(() => {
        if (!cancelled) setTimeSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [source, destination]);

  /* ── Sync: when departure changes, snap arrival to first valid slot ── */
  useEffect(() => {
    if (t1 === "" || arrivalSlots.length === 0) return;
    // Arrival must be strictly after departure
    const valid = arrivalSlots.filter((s) => s.value > t1);
    if (valid.length === 0) {
      setT2("");
      return;
    }
    // If current t2 is still valid keep it, otherwise advance to earliest valid
    if (t2 === "" || (t2 as number) <= (t1 as number)) {
      setT2(valid[valid.length - 1].value); // auto-pick latest valid arrival
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t1, arrivalSlots]);

  /* Only show arrival times strictly after the chosen departure */
  const filteredArrivalSlots =
    t1 !== "" ? arrivalSlots.filter((s) => s.value > t1) : arrivalSlots;

  const citiesSelected = source && destination && source !== destination;
  const timeSlotsReady = departureSlots.length > 0 && arrivalSlots.length > 0;
  const arrivalReady   = t1 !== "" && filteredArrivalSlots.length > 0;

  const canSubmit =
    citiesSelected &&
    t1 !== "" &&
    t2 !== "" &&
    !loading &&
    !initialLoading &&
    !timeSlotsLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onSearch(source, destination, t1 as number, t2 as number);
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

      {/* ── Step 1: City Selectors ─────────────────────────────────────── */}
      <p className="text-[10px] text-accent-cyan/60 uppercase tracking-widest font-semibold mb-2">
        Step 1 — Select Cities
      </p>
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

      {/* ── Step 2: Time Constraints (unlocked after city selection) ──── */}
      <p className="text-[10px] text-accent-cyan/60 uppercase tracking-widest font-semibold mb-2">
        Step 2 — Choose Time Window
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label
            htmlFor="departure-time"
            className="block text-sm text-white/50 mb-2 font-medium"
          >
            Earliest Departure
          </label>
          <select
            id="departure-time"
            value={t1}
            onChange={(e) => setT1(Number(e.target.value))}
            className="input-field"
            disabled={!citiesSelected || !timeSlotsReady || timeSlotsLoading}
          >
            <option value="">
              {!citiesSelected
                ? "Select cities first"
                : timeSlotsLoading
                  ? "Loading times…"
                  : "Select departure time"}
            </option>
            {departureSlots.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="arrival-time"
            className="block text-sm text-white/50 mb-2 font-medium"
          >
            Latest Arrival
          </label>
          <select
            id="arrival-time"
            value={t2}
            onChange={(e) => setT2(Number(e.target.value))}
            className="input-field"
            disabled={!citiesSelected || !arrivalReady || timeSlotsLoading}
          >
            <option value="">
              {!citiesSelected
                ? "Select cities first"
                : t1 === ""
                  ? "Select departure first"
                  : timeSlotsLoading
                    ? "Loading times…"
                    : filteredArrivalSlots.length === 0
                      ? "No arrivals after chosen departure"
                      : "Select arrival time"}
            </option>
            {filteredArrivalSlots.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </select>
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
