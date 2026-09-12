# AAS

A healthcare platform for hospital services, doctor information, token booking,
health records, medicines, Ayushman services, and hospital availability.

## Project structure

- `src/` - Frontend React application, pages, components, styles, and seed data.
- `public/` - Static frontend assets copied into the Vite build.
- `backend/` - Express demo API and in-memory development data.
- `.github/workflows/` - Continuous deployment configuration for GitHub Pages.

## Run locally

```bash
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and the API runs on
`http://localhost:3001`.

## Production build

```bash
npm run build
```

The production site is deployed to
`https://psingh40677-lang.github.io/AAS/` by GitHub Actions.
