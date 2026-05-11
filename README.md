# AquaSphere AI

AquaSphere AI is a local-first climate intelligence platform that combines FastAPI, PostgreSQL, LangChain, ChromaDB, Next.js 14, deck.gl, Recharts, and React Three Fiber.

## What changed

- Replaced the old Streamlit client with a new `frontend/` Next.js 14 app
- Rebuilt the FastAPI backend under `server/app`
- Added PostgreSQL models for ocean temperature and agriculture yield
- Added offline-safe NOAA and FAO data pipeline fallbacks
- Added analytics endpoints for correlation, trend detection, and anomaly detection
- Added hybrid RAG plus OpenRouter answering for `/ask`
- Enabled CORS for `http://localhost:3000`

## Project structure

```text
server/
  app/
    api/routes/
    core/
    db/
    schemas/
    services/
  data_pipeline/
frontend/
```

## Environment

Copy `.env.example` to `.env` and fill in the values:

```env
OPENROUTER_API_KEY=your_openrouter_key
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/aquasphere_ai?connect_timeout=5
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

`OPENROUTER_API_KEY` is required. The backend will fail on startup if it is missing.

## Backend setup

```bash
pip install -r server/requirements.txt
uvicorn server.app.main:app --reload
```

Available routes:

- `GET /map-data?year=YYYY`
- `GET /region/{name}?year=YYYY`
- `GET /analytics/{region}?years=10`
- `POST /ask`

Notes:

- PostgreSQL is the only supported database
- The default connection uses a short `connect_timeout=5` so startup errors surface quickly if PostgreSQL is not running
- Tables auto-create on startup
- NOAA and FAO loaders always fall back to bundled mock JSON when offline

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and expects the FastAPI backend at `http://127.0.0.1:8000` unless `NEXT_PUBLIC_API_BASE_URL` is overridden.

## Experience

- Interactive map with crop-yield choropleth styling
- Ocean temperature heat layer
- Click-to-inspect regional analytics
- AI chat with answer, sources, and confidence
- Debounced time slider from 2000 through 2026
- Lazy-loaded 3D ocean atmosphere visuals
