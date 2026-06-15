# Version Control, CI & Deployment Workflow

How code moves from development to the live site, and how the project is organized for
contribution. Companion to [`PROJECT_PLAN.md`](./PROJECT_PLAN.md).

---

## Branch Model

The project uses a two-branch model: `develop` for everyday work, `main` for releases.

```
develop  ──●──●──●──●──●──        ← integration branch; tested locally
            \           \
main  ──●────────────────●──      ← releases only → triggers production deploy
        release        release
```

| Branch    | Purpose                                   | Deploys to    |
|-----------|-------------------------------------------|---------------|
| `develop` | Day-to-day integration. Tested locally.   | Nothing       |
| `main`    | Stable, released code only.               | Render (prod) |

- `develop` is the default branch — routine work happens here or on short feature
  branches that merge into it.
- `main` is protected. It changes only when a release Pull Request from `develop` is
  merged, and every such merge triggers a production deploy.
- There is no separate staging environment; QA happens locally before a release.

---

## Contributing

Contributions are welcome via the standard fork-and-PR flow:

1. **Fork** the repository.
2. Create a branch off `develop` (e.g. `feature/your-change`).
3. Follow the project conventions:
   - Each React component lives in its own folder with a `.tsx`, `.css`, and
     `.test.tsx` file (see `CLAUDE.md`).
   - Tabs for indentation (enforced via `.editorconfig` and ESLint).
4. Make sure `npm run build` and `npm run lint` pass for the affected app(s).
5. Open a Pull Request targeting **`develop`**.

All Pull Requests run CI and require maintainer review before merging.

---

## Continuous Integration

CI focuses on build and lint correctness rather than automated behavioral tests. On
every Pull Request it runs the **real production build** and the **linter**, so code
that fails to compile or build can never reach `main` and break the live site.

This matters because local development uses Vite's dev server and `ts-node`, which are
more forgiving than the production build — CI runs what the deployment platform actually
runs.

| App    | CI steps                                    |
|--------|---------------------------------------------|
| client | install → lint → production build            |
| server | install → TypeScript build                   |

CI never touches MongoDB or any secrets, so there is nothing sensitive exposed in a CI
run. Behavioral correctness (search returns results, pages render, etc.) is verified by
manual QA before each release.

---

## How Deployment Works

```
merge to main  ──▶  GitHub  ──▶  deploy webhook  ──▶  rebuild + redeploy
```

- The hosting platform (Render) watches the `main` branch and auto-deploys each
  connected service on every push.
- **Express web service**: rebuilds and restarts the compiled server.
- **React static site**: rebuilds and republishes the static bundle.
- The Python FastAPI service is **not** deployed — it runs locally for the nightly data
  ingest only (see `PROJECT_PLAN.md`). Production reads entirely from MongoDB Atlas.
- Secrets (such as the database connection string) live only in the hosting platform's
  environment variables — never in the repository or in CI.

If a release ships a bad build, the hosting platform keeps previous deploys and supports
rolling back to a known-good one.

---

## Production Environment Reference

Live URLs and the exact configuration of the deployed services, for quick reference.

### Live URLs

| Resource             | URL                                              |
|----------------------|--------------------------------------------------|
| Live site (frontend) | https://nba-statistics-client.onrender.com       |
| Backend API          | https://nba-statistics-api.onrender.com          |
| API health check     | https://nba-statistics-api.onrender.com/health   |
| Source repository    | https://github.com/chrisbowen-dev/NBAStatistics  |
| Render dashboard     | https://dashboard.render.com                     |
| MongoDB Atlas        | https://cloud.mongodb.com                        |

All backend routes are mounted under `/api` (e.g. `/api/teams`,
`/api/players?name=`), and the frontend calls the backend at `<backend-url>/api`.

### Render Services

Two separate Render services deploy from the `main` branch:

| Service                 | Type        | Root dir | Build command                  | Start / publish              |
|-------------------------|-------------|----------|--------------------------------|------------------------------|
| `nba-statistics-api`    | Web Service | `server` | `npm install && npm run build` | Start: `node dist/server.js` |
| `nba-statistics-client` | Static Site | `client` | `npm install && npm run build` | Publish: `dist`              |

A **Web Service** runs a live Node process (the Express API); a **Static Site** just
serves the compiled React files over a CDN. They communicate over the public internet
via the URLs above — the frontend's API base URL is injected at build time.

> **Free-tier note:** the Web Service spins down after ~15 minutes of inactivity, so the
> first request after idle takes ~30 seconds to cold-start. The static site is always
> instant.

### Required Environment Variables

Set in the Render dashboard per service — never committed to the repository:

| Variable       | Service                 | Purpose                                                              |
|----------------|-------------------------|---------------------------------------------------------------------|
| `MONGODB_URI`  | `nba-statistics-api`    | Atlas connection string — **must include the `/nba_stats` database name** |
| `NODE_ENV`     | `nba-statistics-api`    | `production`                                                         |
| `VITE_API_URL` | `nba-statistics-client` | Backend API base, e.g. `https://nba-statistics-api.onrender.com/api` |

The client also reads `VITE_API_URL` from `client/.env.production` at build time; keep
the Render value and that file in sync.

### MongoDB Atlas Network Access

Atlas blocks all connections except from whitelisted IPs. Render's free tier uses
dynamic outbound IPs that can't be pinned, so Atlas **Network Access** must allow
`0.0.0.0/0` (access from anywhere). This only opens network reachability — the database
is still protected by its user credentials and TLS.

### Deployment Gotchas (learned the hard way)

- **Build tooling must be in `dependencies`, not `devDependencies`.** Render sets
  `NODE_ENV=production`, which makes `npm install` skip `devDependencies`. `typescript`
  and the `@types/*` packages are needed to compile the server, so they belong in
  `dependencies` — otherwise the production build fails with missing-type errors.
- **`MONGODB_URI` must include the database name.** Atlas's default connection string
  ends in `.../?retryWrites=...` with no database, so Mongoose silently connects to the
  empty default `test` database. Insert the name before the `?`:
  `...mongodb.net/nba_stats?retryWrites=...`. Symptom of getting this wrong: the server
  connects fine but every query returns empty.
- **Production serves only from MongoDB.** The Python service isn't deployed, so any data
  not present in Atlas simply won't appear — Express returns an empty result or `404`
  rather than fetching it. Keep Atlas seeded via the nightly ingest.
- **Editing an env var restarts the service.** Updating a variable in Render
  auto-restarts the affected service, which also clears any stale MongoDB connection from
  before a fix.

---

## Release Summary

| Question                    | Answer                                          |
|-----------------------------|-------------------------------------------------|
| How does the site update?   | Merge to `main` → automatic production deploy   |
| What gates a release?       | Release PR `develop → main` + green CI          |
| Where do secrets live?      | Hosting platform env vars — never in Git or CI  |
| Where is the app tested?    | Locally on `develop`, before release            |
| What does CI check?         | Production build + lint (not behavior)          |
