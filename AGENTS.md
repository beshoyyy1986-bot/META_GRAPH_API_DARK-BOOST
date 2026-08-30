# AGENTS.md

## Project Context

This is a Base44 app repository. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup, environment variables, and publish workflow.

## Base44 References

- CLI overview: https://docs.base44.com/developers/references/cli/get-started/overview.md
- Agent skills: https://docs.base44.com/developers/backend/overview/skills.md

If your agent supports Agent Skills, install or update Base44 skills before Base44-specific work:

```bash
npx skills add base44/skills
```

## Key Files

- `src/`: frontend application source.
- `src/api/base44Client.js`: frontend Base44 SDK client.
- `vite.config.js`: Vite config and Base44 Vite plugin setup.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- This is a frontend-only Vite + React app that talks to the Base44 hosted backend via `@base44/vite-plugin` (proxies `/api` requests).
- The dev environment runs via `docker-compose.base44.yml` — a `node:22-slim` container with the source bind-mounted, running `npx vite --host 0.0.0.0 --port 5173` (host port 3000 → container 5173).
- Dependencies install inside a named volume (`node_modules`) on first boot; subsequent restarts are fast.
- Required env vars for the backend: `VITE_BASE44_APP_ID`, `VITE_BASE44_APP_BASE_URL` (your deployed Base44 app URL). Without these the frontend renders but all `/api` calls fail. Optional: `VITE_BASE44_FUNCTIONS_VERSION`.
- Vite is configured with `server.host: true` and `server.allowedHosts: true` so the preview's external hostname works.
- Verify the app: `curl -sf -H "Host: external-preview.example.com" http://localhost:3000/` should return the HTML page.

- Use `base44 dev` as the default local development command when you need the local Base44 backend. It can run the backend and frontend together.
- When docs or code mention the frontend being started automatically, that usually means the Base44 project config includes `site.serveCommand`, for example `"serveCommand": "npm run dev"` in `base44/config.jsonc`.
- Use `npm run dev` only for frontend-only work against the hosted Base44 backend.
- Prefer the existing Base44 CLI workflow over adding new npm scripts for Base44-specific tasks.
- Reuse the existing SDK client and Vite plugin patterns before adding new Base44 integration paths.
- Run the relevant checks from `package.json` before finishing code changes.
