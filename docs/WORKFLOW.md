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

## Release Summary

| Question                    | Answer                                          |
|-----------------------------|-------------------------------------------------|
| How does the site update?   | Merge to `main` → automatic production deploy   |
| What gates a release?       | Release PR `develop → main` + green CI          |
| Where do secrets live?      | Hosting platform env vars — never in Git or CI  |
| Where is the app tested?    | Locally on `develop`, before release            |
| What does CI check?         | Production build + lint (not behavior)          |
