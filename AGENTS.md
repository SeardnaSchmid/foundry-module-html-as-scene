Rules: Read files first. Write complete solution. Test once. No over-engineering.
If the request or the existing design looks wrong, stop and say so before writing code.

This is **html-as-scene**, a standalone Foundry VTT module repo: vanilla ESM in
`scripts/`, Handlebars in `templates/`, plain CSS in `styles/`. No bundler, no
linter, no framework. Tooling in `tools/` is plain Node with no dependencies, so
CI needs no install step.

## Layout

`scripts/module.mjs` only wires hooks; behaviour lives in its neighbours
(`overlay`, `scene-config`, `settings`, `socket`, `api`). Every magic string —
flags, settings keys, socket types, DOM ids — belongs in `scripts/constants.mjs`
and nowhere else.

## Before you commit

- `npm run check` — the manifest must not point at files that do not exist.
- Keep `README.md` honest about what is implemented; this module is young
  enough that the README is the only design document.
- A user-visible change gets a line in `CHANGELOG.md` under `[Unreleased]`.

## Release

`npm run release` (release-it) bumps `module.json`, writes the changelog, and
pushes a `v*` tag. The tag triggers `.github/workflows/release.yml`, which
rewrites the manifest URLs and publishes `module.json` + `module.zip`. Never
hand-edit the version in `module.json`.
