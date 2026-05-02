# MultiTenant Document Management

FastAPI backend and React frontend for multi-tenant company, unit, document, and audit management.

## Architecture

- Backend API is served from `/api/...`
- Frontend dev server runs on `http://localhost:3000`
- Frontend production build is generated into `frontend/dist`
- If `frontend/dist` exists, FastAPI serves the built frontend and handles SPA route fallback

## Run in Development

1. Install backend dependencies:
```powershell
pip install -r requirements.txt
```
2. Install frontend dependencies:
```powershell
cd frontend
npm install
```
3. Start FastAPI:
```powershell
uvicorn app.main:app --reload
```
4. Start the frontend:
```powershell
cd frontend
npm run dev
```

## Build Frontend for FastAPI

```powershell
cd frontend
npm run build
```

After that, start FastAPI normally and open the backend host. The React app will be served by FastAPI, while API requests stay under `/api`.

## Frontend API Config

The frontend defaults to `VITE_API_BASE_URL=/api`.

If you ever need a different API host, create `frontend/.env` with:

```powershell
VITE_API_BASE_URL=http://localhost:8000/api
```
