# app-screencast

Playwright screencast toolkit for polished **web app demo videos**: in-browser capture, optional fake macOS-style pointer, timed on-screen labels, segment concat, and ffmpeg H.264 export.

Built for PR evidence and product demos; host app stays in its own repo.

## Direction

- [Video invariants and capability inventory](docs/video-invariants.md) — distinguishes implemented, verified, and planned behavior and defines the concurrency north-star metric.
- [North-star showcase](docs/north-star-showcase.md) — deterministic multi-user booking scenario used to evaluate evidence and presentation quality.
- [Evidence bundle contract](docs/evidence-bundle.md) — planned manifest and attribution boundary consumed by PR-readiness automation.

Capabilities documented as Planned are targets, not claims about current support.

## Current limitations

- Canonical concurrent-run isolation is not implemented yet; current wrappers share `test-results` and fixed output names.
- Some exports use a fixed ten-second duration.
- 60 FPS export is delivery resampling and does not prove 60 FPS capture.
- Current wrappers strip audio with `-an`.
- The host-app example still imports sibling-app fixtures directly and does not yet use a formal host adapter.
- Shell setup currently assumes NVM exists.
- There is not yet a canonical GitHub Actions/cloud evidence workflow or evidence manifest.

## Requirements

- Node.js 20+
- [ffmpeg](https://ffmpeg.org/) on `PATH`
- Chromium via Playwright (`pnpm test:install`)

## Quick start (pointer demo — no host app)

```bash
pnpm install
pnpm test:install
pnpm record:pointer
# → ~/test-pointer.mp4
```

## Recording against a host app

Host-app recording is still being generalized. Set `SCREENCAST_APP_DIR` for configs that use it, but note that the current example scenario still contains host-specific sibling imports and is not yet the stable adapter contract.

Do not use the previously documented `record-test-video.sh`; that script does not exist in the repository.

## Layout

| Path | Role |
|------|------|
| `helpers/` | Fake cursor, screencast/zoom, video settings, window labels |
| `docs/` | Capability inventory, invariants, evidence contract, and north-star showcase |
| `video-demo-*.spec.ts` | Playwright specs |
| `playwright.*.config.ts` | Per-demo Playwright configs |
| `record-*.sh` | Current record/export wrappers |

## Environment (common)

| Variable | Default | Purpose |
|----------|---------|---------|
| `SCREENCAST_DIR` | package root | Specs & test-results |
| `SCREENCAST_APP_DIR` | — | Host app for configs that support it |
| `EVIDENCE_VIDEO_WIDTH` / `HEIGHT` | 1920x1080 | Screencast size |
| `EVIDENCE_RECORD_MS` | 10000 | Recording-duration input used by supported demos |
| `EVIDENCE_CURSOR_SIZE` | 56 | Fake pointer size (px) |
| `EVIDENCE_NATIVE_CURSOR` | 0 | Set `1` to skip fake pointer |

## License

MIT
