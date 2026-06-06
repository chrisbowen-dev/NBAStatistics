# NBAStatistics — Agent Guidelines

This file defines rules that all AI agents must follow when working in this repository.

---

## React Component File Structure

Every React component **must** be in its own dedicated folder. Each component folder **must** contain exactly three files:

1. `ComponentName.tsx` — the component implementation
2. `ComponentName.css` — component-scoped styles
3. `ComponentName.test.tsx` — unit/integration tests for the component

### Required structure

```
src/
  components/
    Button/
      Button.tsx
      Button.css
      Button.test.tsx
    Card/
      Card.tsx
      Card.css
      Card.test.tsx
```

### Rules

- **Never** create a component as a lone `.tsx` file directly inside `components/` or `pages/`. It must live in its own folder.
- The folder name and all three files must use **PascalCase** matching the component name exactly.
- All three files (`tsx`, `css`, `test.tsx`) must be created **together** — do not create a component without its CSS and test file.
- If you are refactoring an existing component that does not follow this structure, migrate it into the correct folder layout before making other changes.
- Page-level components under `pages/` follow the same rule.

### Example: creating a new `Badge` component

```
client/src/components/Badge/
  Badge.tsx
  Badge.css
  Badge.test.tsx
```

---

*More rules will be added here as the project evolves.*
