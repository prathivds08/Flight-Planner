# ✈️ Flight Planner — Intelligent Route Optimization

A full-stack web application that finds optimal flight routes between Indian cities using custom graph algorithms. Built with a **Next.js** frontend and a **FastAPI** backend, powered by real-time flight data from the **AirLabs API**.

---

## 🚀 Live Demo

Select any two cities — the app automatically fetches all three optimal routes simultaneously (no manual searching required).

---

## 🧠 How It Works

The system models flights as a **directed weighted graph**:
- **Nodes** → Cities
- **Edges** → Flights (weighted by fare and time)

On every search, **three strategies run in parallel** and results are shown as tabs:

| Strategy | Algorithm | Optimizes For |
|---|---|---|
| 💰 **Cheapest** | Dijkstra / Min-Heap | Lowest total fare |
| ⚡ **Fastest** | BFS + Priority Queue | Fewest flights, earliest arrival |
| 🎯 **Best Value** | BFS + Priority Queue | Fewest flights, then cheapest fare |

---

## 🏗️ Architecture

```
Flight Planner/
├── backend/                    # Python / FastAPI
│   ├── app/
│   │   ├── main.py             # REST API endpoints
│   │   ├── planner.py          # Core graph algorithms (BFS, Dijkstra)
│   │   ├── flight.py           # Flight data model
│   │   ├── live_api.py         # AirLabs real-time API integration
│   │   ├── data_loader.py      # Live API → CSV fallback orchestrator
│   │   ├── models.py           # Pydantic request/response schemas
│   │   └── config.py           # Environment configuration
│   ├── data/
│   │   └── flights.csv         # Fallback mock flight dataset
│   ├── ping_airlabs.py         # API health diagnostic tool
│   ├── pyproject.toml
│   └── requirements.txt
│
└── frontend/                   # Next.js / React / TypeScript
    ├── app/
    │   ├── page.tsx            # Main page — parallel strategy fetching
    │   ├── layout.tsx
    │   └── globals.css         # Design system & animations
    ├── components/
    │   ├── SearchForm.tsx       # City & time selectors with auto-search
    │   ├── RouteResults.tsx     # 3-tab results (Cheapest/Fastest/Best Value)
    │   ├── FlightCard.tsx       # Individual flight segment card
    │   ├── GraphVisualizer.tsx  # Interactive React Flow network graph
    │   └── Header.tsx
    └── lib/
        ├── api.ts              # Typed fetch wrappers
        └── types.ts            # Shared TypeScript types
```

---

## ⚙️ Tech Stack

### Backend
| Tool | Purpose |
|---|---|
| **FastAPI** | REST API framework |
| **Python 3.13** | Core language |
| **httpx** | Async HTTP client for AirLabs |
| **Pydantic** | Request/response validation |
| **Uvicorn** | ASGI server |

### Frontend
| Tool | Purpose |
|---|---|
| **Next.js 15** | React framework (App Router) |
| **TypeScript** | Type safety |
| **React Flow** | Interactive flight network graph |
| **Vanilla CSS** | Custom design system with glassmorphism |

### Data Source
| Mode | Description |
|---|---|
| **Live (AirLabs API)** | Real-time Indian domestic flight schedules from 11 airports |
| **Fallback (CSV)** | 30-flight mock dataset used when API is unavailable |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check + data source status |
| `GET` | `/api/cities` | All available cities |
| `GET` | `/api/flights` | All loaded flights (for graph) |
| `GET` | `/api/time-slots` | Route-aware departure/arrival times |
| `POST` | `/api/routes/cheapest` | Cheapest route (Dijkstra) |
| `POST` | `/api/routes/least-flights-earliest` | Fewest flights, earliest arrival |
| `POST` | `/api/routes/least-flights-cheapest` | Fewest flights, cheapest fare |
| `POST` | `/api/routes/refresh` | Re-fetch live data from AirLabs |

---

## 🛫 Supported Cities (AirLabs Coverage)

Mumbai · Delhi · Bangalore · Chennai · Hyderabad · Pune · Goa · Kolkata · Ahmedabad · Lucknow · Jaipur

---

## 🗂️ Data Structures Implemented (from scratch)

All custom — no standard library collections used for core logic:

- **Adjacency List Graph** — flight network representation
- **Linked List Queue** — O(1) enqueue/dequeue for BFS
- **Min-Heap / Priority Queue** — Dijkstra fare optimization

---

## 🚦 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- An [AirLabs API key](https://airlabs.co) (free tier — 1,000 req/month)

### 1. Clone the Repository

```bash
git clone https://github.com/prathivds08/Flight-Planner.git
cd Flight-Planner
```

### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment (optional but recommended)
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set your AirLabs API key:
# AIRLABS_API_KEY=your-key-here
```

#### Verify your AirLabs API key

```bash
python ping_airlabs.py
```

This runs a full diagnostic — checks key validity, quota remaining, and whether real flight data is returned per airport.

#### Start the backend

```bash
python -m uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔍 How Time Constraints Work

The time-slots endpoint is **route-aware**:

1. When both cities are selected, the backend first runs all three algorithms with the widest possible window.
2. Only the departure/arrival times that appear in **actual valid routes** are surfaced in the dropdowns.
3. This guarantees every selectable time produces at least one result — no "No routes found" dead ends.

---

## 🧪 Diagnostics

```bash
# Check AirLabs API status and data quality
cd backend
python ping_airlabs.py
```

Output includes:
- API key validity and quota usage
- Number of valid flights per airport
- Sample parsed flight times
- Summary of whether live data is usable

---

## 📊 Algorithm Details

### Cheapest Route — Dijkstra on Fares
Uses a **min-heap** keyed on cumulative fare. Explores cheapest paths first. Stops as soon as the destination is dequeued (guaranteed optimal).

### Fastest Route — BFS with Arrival Tracking
Uses a **FIFO queue** (BFS) with pruning: only explores a city again if the new path reaches it with fewer flights or (at the same count) an earlier arrival.

### Best Value — BFS with Fare Tracking
Same structure as Fastest, but tie-breaks on fare instead of arrival time.

**Constraint for all strategies:** Each connecting flight must depart at least **20 minutes** after the previous flight's arrival to allow for connection time.

---

## 🔮 Potential Future Improvements

- Multi-city (stopover) trip planning
- A\* heuristic for faster pathfinding on large graphs
- Airline filtering and seat class selection
- Flight delay prediction via ML
- Vercel + Railway/Render deployment pipeline

---

## 👤 Author

**Prathiv V** — [github.com/prathivds08](https://github.com/prathivds08)
