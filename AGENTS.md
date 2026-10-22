# Makerspaces tour

Follow the organization rules in [../.github/AGENTS.md](../.github/AGENTS.md).

- This is an unlisted prototype at `/tour/makerspaces/`; do not add links on the
  campus selector or modify the existing tour pages.
- Edit `content/tour.json` and run `npm run build:scene` to regenerate `scene.json`.
  Edit `content/spaces.json` for directory content. Keep photo sources and credits.
- Only genuine panoramas belong in the scene. Ordinary photographs stay labeled
  as photographs in the directory.
- `npm run deploy` publishes only `makerspaces/` in the sibling tour repository's
  `gh-pages` branch. Never use the whole-tour publisher for this prototype.
- Read `docs/embedding.md` before changing iframe behavior or worker scope.
- Run `npm test` and `npm run build` before publishing. Scratch belongs in `build/`.
