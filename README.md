# Multi-Agent Placement Assistant

A full-stack, responsive web application designed to help students prepare for job placements using simulator agents. The system features a centralized **AI Coordinator Orchestrator** that tracks readiness and coordinates mock assessments.

## Tech Stack
* **Frontend**: React.js, Tailwind CSS v4, Lucide Icons, Vite
* **Backend**: FastAPI (Python), SQLite
* **ORM**: SQLAlchemy (standard synchronous)

---

## Folder Structure
```
d:/agent-project/
├── backend/
│   ├── main.py            # FastAPI main server entry
│   ├── database.py        # SQLite SQLAlchemy configuration
│   ├── models.py          # SQLAlchemy models (Resume, DSA, Interviews, Roadmap)
│   ├── schemas.py         # Pydantic schema validation structures
│   ├── crud.py            # DB CRUD handlers and mock preloader
│   └── routers/
│       ├── resume.py      # Resume review endpoint router
│       ├── dsa.py         # DSA training challenges router
│       ├── interview.py   # Mock conversation recruiter router
│       └── coordinator.py # Orchestrator router & chat service
│
└── frontend/
    ├── package.json       # React dependencies and scripts
    ├── vite.config.js     # React + Tailwind v4 + proxy setup
    ├── index.html         # Main app loader with google fonts
    └── src/
        ├── main.jsx       # Mount entrypoint
        ├── App.jsx        # Routing system
        ├── index.css      # Tailwind imports & scrollbar styles
        ├── components/
        │   └── Sidebar.jsx # Responsive sidebar layout drawer
        └── pages/
            ├── Dashboard.jsx        # Readiness score & overview metrics
            ├── ResumeAgent.jsx      # Resume ATS scanner & improvements
            ├── DsaAgent.jsx         # Code editor workspace with hints
            ├── InterviewAgent.jsx   # Live dialogue conversational simulation
            └── CoordinatorAgent.jsx # Central progress roadmaps & advice
```

---

## Getting Started

### 1. Prerequisites
Ensure you have the following installed:
* **Python 3.8+**
* **Node.js 18+**

---

### 2. Running the Backend Server

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   pip install fastapi uvicorn sqlalchemy
   ```

3. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload
   ```
   * The backend API documentation will be available at `http://127.0.0.1:8000/docs`
   * A SQLite database file (`placement_assistant.db`) will be automatically initialized and preloaded with mock problem sets and behavioral interviews.

---

### 3. Running the Frontend React Application

1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   * The React application will start at `http://localhost:5173/`
   * API endpoints called by the frontend (like `/api/...`) are automatically proxied to the backend running on port `8000`.

---

## How It Works

1. **Dashboard**: Loads overall readiness (0-100%) and personalized checklist instructions compiled by the central AI Coordinator.
2. **Resume Agent**: Allows copying/pasting resume text. Submitting runs an ATS-matching analysis that parses experience and adds direct feedback sections.
3. **DSA Agent**: Allows solving challenges across Arrays, Strings, Linked Lists, Trees, and Graphs. Offers a coding console where you can run, submit, and request hints. Completing at least 2 challenges updates your overall checklist!
4. **Interview Agent**: Simulates technical/behavioral chats. The AI asks questions, waits for answers, and when concluded, issues detailed rating score reports.
5. **AI Coordinator**: Aggregates profile status from the databases and helps you with customized tips. You can chat with it to plan your placement targets.
