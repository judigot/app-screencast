# app-screencast

Playwright screencast toolkit for polished **web app demo videos**: in-browser capture, optional fake macOS-style pointer, timed on-screen labels, segment concat, and ffmpeg H.264 export.

Built for PR evidence and product demos; host app stays in its own repo.

## Direction

- [Video invariants and capability inventory](docs/video-invariants.md) — distinguishes implemented, verified, and planned behavior and defines the concurrency north-star metric.
- [North-star showcase](docs/north-star-showcase.md) — deterministic multi-user booking scenario used to evaluate evidence and presentation quality.
- [Evidence bundle contract](docs/evidence-bundle.md) — planned manifest and attribution boundary consumed by PR-readiness automation.

Capabilities documented as Planned are targets, not claims about current support.

## Current state

The recording foundation now has automated verification for concurrent run isolation, cleanup ownership, explicit-output collision rejection, Node startup without NVM, and preservation of frames beyond ten seconds.

Remaining limitations:

- 60 FPS export is delivery resampling and does not prove 60 FPS capture.
- Current wrappers strip audio with `-an`; canonical PR evidence and showcase videos therefore do not yet satisfy the sound invariant.
- The host-app example still imports sibling-app fixtures directly and does not yet use a formal host adapter.
- There is not yet a canonical GitHub Actions/cloud evidence workflow or evidence manifest.
- Voice narration, application-audio mixing, and the shared authoritative composition timeline remain planned.

## Requirements

- Node.js 20+
- [ffmpeg](https://ffmpeg.org/) on `PATH`
- Chromium via Playwright (`pnpm test:install`)

## Quick start (pointer demo — no host app)

```bash
pnpm install
pnpm test:install
pnpm record:pointer
```

The wrapper prints the exact output path. By default, every invocation receives a unique run directory under `RUNNER_TEMP`, `TMPDIR`, or `/tmp`, with the final video under that run's `artifacts/` directory.

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
| `SCREENCAST_DIR` | package root | Toolkit/spec root |
| `SCREENCAST_APP_DIR` | — | Host app for configs that support it |
| `SCREENCAST_BATCH_ID` | GitHub run/job identity or local fallback | Optional logical identity shared by a batch of recordings |
| `SCREENCAST_RUN_ID` | atomically generated per invocation | Unique recording identity after initialization; an inherited value is treated as a batch hint for compatibility |
| `SCREENCAST_RUN_ROOT` | `RUNNER_TEMP`, `TMPDIR`, or `/tmp` + `app-screencast-runs` | Parent for unique invocation directories |
| `SCREENCAST_RUN_DIR` | unique child of the run root | Resolved invocation directory; a pre-exported value is treated as a parent, never deleted wholesale |
| `SCREENCAST_RESULTS_DIR` | unique run `test-results` | Playwright output; a pre-exported value is treated as a parent for a unique child |
| `SCREENCAST_WORK_DIR` | unique run `work` | Temporary work owned by one invocation; cleanup removes only the marked owned child |
| `SCREENCAST_OUTPUT_DIR` | unique run `artifacts` | Artifact directory; a pre-exported value is treated as a parent for a unique child |
| `EVIDENCE_OUTPUT_PATH` | run-specific default output | Optional exact output file; an existing or concurrently reserved path is rejected |
| `EVIDENCE_VIDEO_WIDTH` / `HEIGHT` | 1920x1080 | Screencast size |
| `EVIDENCE_RECORD_MS` | 10000 | Recording-duration input used by supported demos |
| `EVIDENCE_CURSOR_SIZE` | 56 | Fake pointer size (px) |
| `EVIDENCE_NATIVE_CURSOR` | 0 | Set `1` to skip fake pointer |

## License

MIT
