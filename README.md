# 🌊 AquaSphere AI

**Climate Intelligence & Ocean Analytics Platform**

*Geospatial visualization · Environmental analytics · Retrieval-Augmented AI*

🌐 **Live Demo:** [aquasphere-intelligence.vercel.app/login](https://aquasphere-intelligence-delta.vercel.app/login)

---

## 📌 Overview

**AquaSphere AI** is a full-stack climate intelligence platform that transforms raw environmental and agricultural data into interactive, explainable, and visually immersive insights — powered by a hybrid RAG pipeline and geospatial rendering engine.

Unlike tutorial-level dashboards, AquaSphere AI uses a layered architecture with separate frontend, backend, analytics, database, and AI service layers.

The system combines:

- 🌊 Ocean temperature analytics
- 🌾 Agricultural yield intelligence
- 🧠 Hybrid RAG + LLM question answering
- 📊 Climate trend detection
- 🗺️ Interactive global mapping
- 🌐 3D environmental visualization

---

## ✨ Features

### 🌍 Interactive Climate Dashboard
- Real-time styled geospatial visualization
- Crop-yield choropleth layers
- Ocean temperature heatmaps
- Region-based exploration

### 🤖 AI Climate Assistant
- Hybrid RAG pipeline using LangChain + ChromaDB
- OpenRouter-powered intelligent responses
- Confidence scoring and source-backed answers

### 📈 Advanced Analytics
- Trend detection & correlation analysis
- Environmental anomaly detection
- Historical climate exploration

### 🌊 3D Ocean Visualization
- React Three Fiber powered visuals
- Atmospheric rendering
- Lazy-loaded immersive scenes

### ⚡ High-Performance Frontend
- Next.js 14 App Router
- deck.gl visualization engine
- SWR data fetching
- Dynamic analytics rendering

---

## 🏗️ Architecture

```
AquaSphere AI
│
├── frontend/                 → Next.js 14 client
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── hooks/
│
├── server/
│   ├── app/
│   │   ├── api/routes/
│   │   ├── core/
│   │   ├── db/
│   │   ├── schemas/
│   │   └── services/
│   │
│   └── data_pipeline/
│
└── AI + Analytics Layer
```

---

## 🧠 AI Workflow

```
User Query
    ↓
FastAPI Backend
    ↓
LangChain Retrieval
    ↓
ChromaDB Context Search
    ↓
OpenRouter LLM Response
    ↓
Confidence + Sources Returned
```

---

## 🛠️ Tech Stack

**Frontend**
- Next.js 14, TypeScript, Tailwind CSS
- deck.gl, React Three Fiber
- Recharts, React Leaflet

**Backend**
- FastAPI, PostgreSQL, SQLAlchemy
- LangChain, ChromaDB

**AI & Data**
- OpenRouter API
- Hybrid RAG pipeline
- NOAA climate datasets
- FAO agriculture datasets

---

## ⚙️ Environment Setup

Create a `.env` file in the project root:

```env
OPENROUTER_API_KEY=your_openrouter_key
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/aquasphere_ai?connect_timeout=5
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

---

## 🖥️ Local Development

### Backend

```bash
pip install -r server/requirements.txt
uvicorn server.app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/map-data?year=YYYY` | Climate map data |
| GET | `/region/{name}?year=YYYY` | Region analytics |
| GET | `/analytics/{region}?years=10` | Trend analytics |
| POST | `/ask` | AI climate assistant |

---

## 🌐 Deployment

| Service | Platform |
|---------|----------|
| Frontend | Vercel |
| Backend | Render |

---

## 🔥 Highlights

- ✅ Full-stack AI architecture
- ✅ Advanced geospatial rendering
- ✅ Production deployment
- ✅ Modular FastAPI backend
- ✅ Interactive 3D visualization
- ✅ Hybrid RAG implementation
- ✅ AI-powered environmental analytics

---

## 📊 Key Capabilities

- Climate intelligence visualization
- Agriculture trend forecasting
- Ocean heat analytics
- Environmental anomaly detection
- Retrieval-Augmented Generation (RAG)
- Interactive geospatial analytics
- AI-assisted environmental insights

---

## 👩‍💻 Author

**Shravya Palegarthuli**  
GitHub: [github.com/shravya-9723](https://github.com/shravya-9723)

---

## 📄 License

This project is intended for educational, research, and portfolio purposes.

---

> AquaSphere AI aims to bridge environmental intelligence and accessible AI systems by transforming raw climate and agriculture data into interactive, explainable, and visually immersive insights.
