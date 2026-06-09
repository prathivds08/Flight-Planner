import { FlightSegment } from "@/lib/types";

interface FlightCardProps {
  flight: FlightSegment;
  index: number;
  isLast: boolean;
}

export default function FlightCard({ flight, index, isLast }: FlightCardProps) {
  return (
    <div className="relative">
      {/* Connector line between cards */}
      {!isLast && (
        <div className="absolute left-8 top-full w-0.5 h-4 bg-gradient-to-b from-accent-cyan/30 to-accent-purple/30 z-0" />
      )}

      <div
        className="flight-card group"
        style={{ animationDelay: `${index * 120}ms` }}
      >
        {/* Step badge */}
        <div className="absolute -left-3 -top-3 w-7 h-7 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-accent-cyan/25 z-10">
          {index + 1}
        </div>

        {/* Main content */}
        <div className="flex items-center justify-between">
          {/* Departure */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">
              {flight.start_city}
            </p>
            <p className="text-xs text-white/35 mt-0.5">
              Depart: t={flight.departure_time}
            </p>
          </div>

          {/* Flight path indicator */}
          <div className="flex-1 flex items-center justify-center px-3">
            <div className="flex items-center gap-1 w-full">
              <div className="w-2 h-2 rounded-full bg-accent-cyan shrink-0" />
              <div className="flex-1 h-px bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-purple relative">
                <svg
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 text-accent-cyan group-hover:text-accent-purple transition-colors duration-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
              </div>
              <div className="w-2 h-2 rounded-full bg-accent-purple shrink-0" />
            </div>
          </div>

          {/* Arrival */}
          <div className="flex-1 min-w-0 text-right">
            <p className="text-base font-bold text-white truncate">
              {flight.end_city}
            </p>
            <p className="text-xs text-white/35 mt-0.5">
              Arrive: t={flight.arrival_time}
            </p>
          </div>
        </div>

        {/* Bottom metadata row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
          <span className="text-xs text-white/25">
            Flight #{flight.flight_no}
          </span>
          {flight.airline && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.04] text-white/45 border border-white/[0.06]">
              {flight.airline}
            </span>
          )}
          <span className="text-sm font-semibold text-accent-emerald">
            ₹{flight.fare.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Spacer for connector */}
      {!isLast && <div className="h-4" />}
    </div>
  );
}
