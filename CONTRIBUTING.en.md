# Contributing

Thank you for contributing to `niuma-ui`. This page covers how to develop, document, and land changes in this repository.

Also read the [Code of Conduct](./CODE_OF_CONDUCT.md).

中文：[CONTRIBUTING.md](./CONTRIBUTING.md). PR descriptions may be Chinese or English.

Do **not** put publish tokens or personal npm accounts in user-facing docs (README, consumers). Release secrets stay on this page.

## Development

```bash
pnpm install
pnpm dev:site     # docs site (public usage): http://127.0.0.1:5181
pnpm dev          # internal test bench: http://127.0.0.1:5180 (not usage docs)
pnpm build        # library → dist/
pnpm test
pnpm test:watch
```

Requires Node.js ≥ 20, pnpm ≥ 9 in this repo, Vue ^3.5. Downstream installs may use npm, pnpm, or yarn.

## Pull requests

1. Open an Issue first for large features or breaking API changes.
2. Keep each PR focused.
3. Add or update tests under `src/__tests__/` when behavior changes.
4. Public usage **must** land on the docs site `site/` (catalog + `demos/{slug}.vue`). `playground/` is internal smoke / visual regression only and must not be treated as usage docs.
5. When public API, tokens, architecture, or install steps change, update:
   - [docs/components.md](./docs/components.md) and [docs/components.en.md](./docs/components.en.md)
   - [docs/consumers.md](./docs/consumers.md) / [docs/consumers.en.md](./docs/consumers.en.md)
   - [README.md](./README.md) / [README.en.md](./README.en.md) if install rules change
   - the `[Unreleased]` section of [CHANGELOG.md](./CHANGELOG.md)
6. Do not bump `package.json` `version` except in a release PR.

### Commit messages

Prefer a short imperative sentence (Chinese or English):

- `feat: add collapse mode to RsXxx`
- `fix: keep RsTable selection after filter`
- `docs: document Tree fieldNames`
- `chore: tighten CI`

Use your own git identity. Do not commit as Cursor or another bot account.

## Release

1. Move `[Unreleased]` notes in [CHANGELOG.md](./CHANGELOG.md) under `## [X.Y.Z] - YYYY-MM-DD`.
2. Set `package.json` `version`.
3. After merge to `main`, create an **annotated** tag (the message appears in `git show vX.Y.Z`):

   ```bash
   git tag -a vX.Y.Z -m "niuma-ui X.Y.Z

   Copy the highlights for this version from CHANGELOG."
   git push origin main
   git push origin vX.Y.Z
   ```

4. GitHub Actions **Publish** runs tests, builds `dist/` via `prepublishOnly`, runs `pnpm publish`, and creates a **GitHub Release** from that CHANGELOG section.
5. If a tag was pushed without Release notes: Actions → Publish → **Run workflow**, set `tag` (for example `v1.3.8`), check `skip_npm`.

The repository needs a Secret named `NPM_TOKEN`.

Create it so CI does not fail with `EOTP`:

1. npm → Access Tokens → **Granular Access Token**
2. Package `niuma-ui`: **Read and write**
3. Enable **Bypass two-factor authentication**
4. Store the token as GitHub Actions Secret `NPM_TOKEN`

Do not store a one-time OTP as the Secret.

## Component rules

The full architecture contract (red lines, public surface, tokens, Vue/CSS/overlay/form/a11y/SSR, checklist):

- English: [docs/components.en.md](./docs/components.en.md)
- 中文: [docs/components.md](./docs/components.md)

| Rule | Meaning |
|------|---------|
| Naming | Public components `Rs*`; internal `*-utils.ts` has no `Rs` prefix |
| Public API | Export only from `src/index.ts`; DOM internals stay private |
| Reka UI | Primitives stay inside this package; hosts and the site must not import `reka-ui` |
| Tokens | `--rs-*` only; no hardcoded brand colors, px, or system font stacks |
| Size / radius | `RsComponentSize` / `RsRadius` + resolve hooks |
| Shape × color | `variant` is shape, `tone` is hue |
| i18n | `useRsI18n`; `zh-CN` and `en-US` as a pair |
| External specs | WHATWG semantics, Vue Style Guide A/B, APG keyboard; Google HTML/CSS is not a contract |
| A11y | Native first, then ARIA; icon buttons need a label; current item `aria-current`; overlay focus trap |
| Docs | Public usage is `site/` only; `playground/` is internal test |
| Tests | Mount smoke + utils edge cases |

### Adding a component

Follow the checklist in [docs/components.en.md §15](./docs/components.en.md): implement → export → locale → tests → **site catalog + demo** → inventory → CHANGELOG. Playground is optional.

### Breaking changes

Props / events / slots / exports / tokens / default-value semantics need a **MAJOR** and a CHANGELOG migration note. An unlisted new export is an architecture break.

## Bugs and requests

Use the GitHub Issue templates. Include Vue / Vite / `niuma-ui` versions and a minimal reproduction.

## Security

See [SECURITY.md](./SECURITY.md). Do not disclose unfixed vulnerabilities in public Issues.

## License

By contributing you agree that your contribution is licensed under [Apache License 2.0](./LICENSE).
