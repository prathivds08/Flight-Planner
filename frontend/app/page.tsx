"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import SearchForm from "@/components/SearchForm";
import RouteResults from "@/components/RouteResults";
import GraphVisualizer from "@/components/GraphVisualizer";
import { fetchCities, fetchAllFlights, fetchRoute } from "@/lib/api";
import { FlightSegment, RouteResponse } from "@/lib/types";

export interface AllResults {
  cheapest: RouteResponse | null;
  fastest: RouteResponse | null;
  bestValue: RouteResponse | null;
}

export default function Home() {
  const [cities, setCities] = useState<string[]>([]);
  const [allFlights, setAllFlights] = useState<FlightSegment[]>([]);
  const [results, setResults] = useState<AllResults>({
    cheapest: null,
    fastest: null,
    bestValue: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  /* ── Load initial data on mount ─────────────────────────────────── */
  useEffect(() => {
    const init = async () => {
      try {
        const [citiesData, flightsData] = await Promise.all([
          fetchCities(),
          fetchAllFlights(),
        ]);
        setCities(citiesData);
        setAllFlights(flightsData);
      } catch {
        setError(
          "Failed to connect to the backend. Make sure the FastAPI server is running on port 8000."
        );
      } finally {
        setInitialLoading(false);
      }
    };
    init();
  }, []);

  /* ── Handle route search — fetch all 3 strategies in parallel ───── */
  const handleSearch = useCallback(
    async (
      source: string,
      destination: string,
      t1: number,
      t2: number
    ) => {
      setLoading(true);
      setError(null);
      setResults({ cheapest: null, fastest: null, bestValue: null });

      const params = { start_city: source, end_city: destination, t1, t2 };

      try {
        const [cheapest, fastest, bestValue] = await Promise.all([
          fetchRoute("cheapest", params),
          fetchRoute("least-flights-earliest", params),
          fetchRoute("least-flights-cheapest", params),
        ]);
        setResults({ cheapest, fastest, bestValue });
      } catch {
        setError("Failed to find routes. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* Active route for graph highlight — pick first non-empty result */
  const activeRoute =
    results.cheapest?.route ||
    results.fastest?.route ||
    results.bestValue?.route ||
    [];

  const hasResults =
    results.cheapest !== null ||
    results.fastest !== null ||
    results.bestValue !== null;

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* ── Animated Background ─────────────────────────────────────── */}
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent-cyan/[0.06] rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent-purple/[0.06] rounded-full blur-[120px] animate-pulse-slow animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-accent-emerald/[0.03] rounded-full blur-[100px] animate-pulse-slow animation-delay-1000" />
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="relative z-10">
        <Header />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Text */}
          <div className="text-center mb-8 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Find Your{" "}
              <span className="bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">
                Optimal Route
              </span>
            </h2>
            <p className="text-white/35 text-sm max-w-lg mx-auto">
              Powered by custom graph algorithms — Dijkstra&apos;s shortest path
              and BFS with priority optimization
            </p>
          </div>

          {/* Search Form */}
          <div className="max-w-3xl mx-auto mb-8">
            <SearchForm
              cities={cities}
              onSearch={handleSearch}
              loading={loading}
              initialLoading={initialLoading}
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="max-w-3xl mx-auto mb-8 animate-slide-up">
              <div className="bg-red-500/[0.08] border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm text-center backdrop-blur-sm">
                {error}
              </div>
            </div>
          )}

          {/* Results + Graph */}
          {(hasResults || loading || allFlights.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
              <RouteResults results={results} loading={loading} />
              <GraphVisualizer
                allFlights={allFlights}
                route={activeRoute}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-white/[0.04] mt-16 py-6">
          <p className="text-center text-white/20 text-xs">
            Built with FastAPI · Next.js · React Flow · Custom Graph Algorithms
          </p>
        </footer>
      </div>
    </main>
  );
}
