# AdaptiveFlow

Personalized Adaptive Learning Path System with FastAPI + React.

## Features

- **Recommendation Engine** - AI-powered item recommendations based on mastery gaps and engagement
- **Knowledge Graph** - DAG-based topic relationships with prerequisite tracking
- **Learner Modeling** - Mastery calculation, engagement scoring, learning velocity
- **Learning Path** - Personalized step-by-step learning routes
- **Analytics Dashboard** - Real-time metrics, charts, and activity tracking
- **Mobile Responsive** - Works on all device sizes
- **Framer Motion** - Smooth animations and transitions

## Tech Stack

**Backend:**
- Python 3.14
- FastAPI
- Uvicorn

**Frontend:**
- React 19
- Vite
- Framer Motion
- Lucide React Icons
- React Router DOM

## Setup

### Backend

```bash
cd backend
pip install fastapi uvicorn
python -m backend.api
```

Backend runs on `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## API Docs

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
adaptiveflow-learning/
├── backend/
│   ├── api.py                 # FastAPI server
│   ├── models.py              # Data models
│   ├── knowledge_graph.py     # DAG implementation
│   ├── learner_model.py       # Learner state tracking
│   ├── recommendation_engine.py # Multi-factor scoring
│   └── evaluation.py          # Metrics calculation
├── frontend/
│   └── src/
│       ├── App.jsx            # Root with routing
│       ├── api.js             # API service layer
│       └── components/
│           ├── Header.jsx     # Navigation + streak badge
│           ├── Dashboard.jsx  # Main dashboard view
│           ├── StatsGrid.jsx  # Stats cards
│           ├── Recommendations.jsx
│           ├── KnowledgeGraph.jsx
│           ├── WeakAreas.jsx
│           ├── LearningPath.jsx
│           ├── LearningModal.jsx
│           ├── Analytics.jsx
│           ├── PerformanceCharts.jsx
│           ├── Help.jsx
│           ├── Settings.jsx
│           └── Notification.jsx
├── docs/
│   └── LMS_INTEGRATION_PLAN.md
├── main.py
└── .gitignore
```

## Pages

| Route | Page |
|-------|------|
| `/` | Dashboard |
| `/path` | Learning Path |
| `/path/:topicId` | Learning Path with topic |
| `/analytics` | Analytics |
| `/help` | Help Center |
| `/settings` | Settings |

## License

MIT
