# Contributing to cornbar

Thanks for helping improve cornbar. This guide covers local setup, project layout, and how to submit changes.

## Ways to contribute

- Report bugs or request features in [GitHub Issues](https://github.com/farhadf246/cornbar/issues)
- Fix bugs or add features via pull request
- Improve docs, tests, or Storybook examples
- Share feedback from real-world usage

Before starting larger work, open an issue first so we can align on scope and API shape.

## Local setup

Requirements:

- Node.js 20+ (Node 22+ for release workflow parity)
- npm

```bash
git clone https://github.com/farhadf246/cornbar.git
cd cornbar
npm install
```

## Development commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start Storybook at `http://localhost:6006` |
| `npm test` | Run Vitest test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run check` | TypeScript typecheck |
| `npm run build` | Build `dist/` outputs |
| `npm run build-storybook` | Build static Storybook |

Before opening a PR, run:

```bash
npm test
npm run check
npm run build
```

## Project layout

| Path | What it is |
|---|---|
| `src/core.ts` | Core snackbar manager and public API |
| `src/react-api.ts` | React hooks/helpers |
| `src/provider.tsx` | `CornbarProvider` component |
| `src/react.ts` | `cornbar/react` entry point |
| `src/index.ts` | Main entry (`cornbar` + re-exported React helpers) |
| `src/styles.css` | Source styles (edit this file) |
| `src/styles.generated.ts` | Auto-generated embedded CSS (do not edit manually) |
| `scripts/embed-css.mjs` | Minifies `styles.css` into `styles.generated.ts` |
| `src/core.test.ts` | Unit tests |
| `stories/snackbar.stories.ts` | Storybook playground |

### CSS changes

Edit `src/styles.css` only. The embed script runs automatically before `test`, `check`, and `build`.

If you change styles manually, regenerate once:

```bash
node scripts/embed-css.mjs
```

## Coding guidelines

- Keep changes focused and minimal
- Match existing TypeScript style and naming in nearby code
- Prefer extending existing APIs over large rewrites
- Add or update tests for behavior changes in `src/core.test.ts`
- Update Storybook controls when adding user-facing options
- Update `README.md` when public API or import paths change
- Avoid editing generated files (`src/styles.generated.ts`, `dist/`)

## Pull request process

1. Fork the repository and create a branch from `main`
2. Make your changes with clear commits
3. Ensure `npm test`, `npm run check`, and `npm run build` pass
4. Open a pull request with:
   - what changed and why
   - how you tested it
   - screenshots or Storybook notes for UI changes
5. Address review feedback

### Commit messages

Use short, descriptive messages in imperative mood, for example:

- `Fix custom font-family not applying to action buttons`
- `Add pauseOnHover so toasts stay open while hovered`
- `Expose pauseOnHover in the Storybook playground controls`

## Release notes for maintainers

Releases are automated on version tags (`v*`). Maintainers bump version with `npm version`, push tags, and GitHub Actions publishes to npm and creates a release. Contributors do not need to handle publishing.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
