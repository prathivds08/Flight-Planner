"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  type Node,
  type Edge,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  ConnectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FlightSegment } from "@/lib/types";

interface GraphVisualizerProps {
  allFlights: FlightSegment[];
  route: FlightSegment[];
}

/* ── Approximate geographic positions of Indian cities (scaled to canvas) ── */
const CITY_POSITIONS: Record<string, { x: number; y: number }> = {
  Delhi: { x: 430, y: 70 },
  Jaipur: { x: 310, y: 140 },
  Lucknow: { x: 570, y: 110 },
  Ahmedabad: { x: 200, y: 260 },
  Mumbai: { x: 160, y: 410 },
  Pune: { x: 270, y: 460 },
  Goa: { x: 250, y: 570 },
  Bangalore: { x: 360, y: 630 },
  Chennai: { x: 510, y: 610 },
  Hyderabad: { x: 430, y: 470 },
  Kolkata: { x: 710, y: 300 },
};

let _dynamicCounter = 0;
function getCityPosition(city: string): { x: number; y: number } {
  if (CITY_POSITIONS[city]) return CITY_POSITIONS[city];
  // Fallback for unknown cities — arrange in a grid
  _dynamicCounter++;
  return {
    x: 100 + (_dynamicCounter % 5) * 140,
    y: 100 + Math.floor(_dynamicCounter / 5) * 140,
  };
}

export default function GraphVisualizer({
  allFlights,
  route,
}: GraphVisualizerProps) {
  /* Build a set of edge keys that belong to the optimal route */
  const routeEdgeKeys = useMemo(() => {
    const keys = new Set<number>();
    for (const f of route) keys.add(f.flight_no);
    return keys;
  }, [route]);

  /* Cities that are part of the route */
  const routeCities = useMemo(() => {
    const set = new Set<string>();
    for (const f of route) {
      set.add(f.start_city);
      set.add(f.end_city);
    }
    return set;
  }, [route]);

  /* Compute React Flow nodes and edges */
  const { nodes, edges } = useMemo(() => {
    const citySet = new Set<string>();
    for (const f of allFlights) {
      citySet.add(f.start_city);
      citySet.add(f.end_city);
    }

    const nodes: Node[] = Array.from(citySet).map((city) => {
      const pos = getCityPosition(city);
      const isHighlighted = routeCities.has(city);

      return {
        id: city,
        position: pos,
        data: { label: city },
        draggable: true,
        style: {
          background: isHighlighted
            ? "linear-gradient(135deg, #00d4ff, #8b5cf6)"
            : "rgba(255, 255, 255, 0.06)",
          color: "#fff",
          border: isHighlighted
            ? "2px solid rgba(0, 212, 255, 0.6)"
            : "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "50%",
          width: 72,
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          fontWeight: isHighlighted ? "700" : "500",
          boxShadow: isHighlighted
            ? "0 0 24px rgba(0, 212, 255, 0.35)"
            : "0 2px 8px rgba(0, 0, 0, 0.3)",
          transition: "all 0.4s ease",
          letterSpacing: "0.02em",
        },
      };
    });

    const edges: Edge[] = allFlights.map((f) => {
      const isRoute = routeEdgeKeys.has(f.flight_no);

      return {
        id: `edge-${f.flight_no}`,
        source: f.start_city,
        target: f.end_city,
        label: `₹${f.fare}`,
        animated: isRoute,
        style: {
          stroke: isRoute ? "#00d4ff" : "rgba(255, 255, 255, 0.08)",
          strokeWidth: isRoute ? 2.5 : 0.8,
        },
        labelStyle: {
          fill: isRoute ? "#00d4ff" : "rgba(255, 255, 255, 0.22)",
          fontSize: isRoute ? 11 : 8,
          fontWeight: isRoute ? 700 : 400,
        },
        labelBgStyle: {
          fill: isRoute
            ? "rgba(0, 212, 255, 0.08)"
            : "rgba(5, 8, 22, 0.85)",
          strokeWidth: 0,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isRoute ? "#00d4ff" : "rgba(255, 255, 255, 0.15)",
          width: 16,
          height: 16,
        },
        zIndex: isRoute ? 10 : 0,
      };
    });

    return { nodes, edges };
  }, [allFlights, routeEdgeKeys, routeCities]);

  /* ── Empty State ──────────────────────────────────────────────────── */
  if (allFlights.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-8 flex items-center justify-center min-h-[420px]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white/15 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <p className="text-white/25 text-sm">Loading flight network…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="glass-card rounded-3xl overflow-hidden animate-fade-in"
      style={{ height: 520 }}
    >
      {/* Header */}
      <div className="px-6 py-3.5 border-b border-white/[0.05] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <svg
            className="w-4 h-4 text-accent-purple"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          Flight Network
        </h3>
        {route.length > 0 && (
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-accent-cyan/8 border border-accent-cyan/20 text-accent-cyan font-medium">
            Route Highlighted
          </span>
        )}
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        connectionMode={ConnectionMode.Loose}
        style={{ background: "transparent" }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={2}
      >
        <Background color="rgba(255, 255, 255, 0.02)" gap={30} size={1} />
        <Controls
          showInteractive={false}
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            overflow: "hidden",
          }}
        />
        <MiniMap
          style={{
            background: "rgba(5, 8, 22, 0.9)",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
          maskColor="rgba(0, 212, 255, 0.06)"
          nodeColor={(n) =>
            routeCities.has(n.id as string)
              ? "#00d4ff"
              : "rgba(255, 255, 255, 0.15)"
          }
        />
      </ReactFlow>
    </div>
  );
}
