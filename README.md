# AAS

A healthcare platform for hospital services, doctor information, token booking,
health records, medicines, Ayushman services, and hospital availability.

## Project structure

- `frontend/` - Vite React application for Vercel or GitHub Pages.
- `backend/` - Express API for Render, with its own package manifest.
- `.github/workflows/` - Continuous deployment configuration for GitHub Pages.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

In a second terminal:

```bash
cd backend
npm install
npm start
```

The frontend runs on `http://localhost:5173` and the API runs on
`http://localhost:3001`.

## Production build

```bash
cd frontend
npm run build
```

Deploy `frontend/` as a Vercel project. Deploy `backend/` as a Render Web
Service with build command `npm install` and start command `npm start`.
