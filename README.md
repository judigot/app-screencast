# app-screencast

Playwright screencast toolkit for polished **web app demo videos**: in-browser capture, optional fake macOS-style pointer, timed on-screen labels, segment concat, and ffmpeg H.264 export.

Built for PR evidence and product demos; host app stays in its own repo.

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

## Recording against your app

Set **`SCREENCAST_APP_DIR`** to the app root (where `pnpm dev` and Playwright e2e setup live):

```bash
export SCREENCAST_APP_DIR=/path/to/your-app
bash record-test-video.sh   # example: login flow demo → ~/test-video.mp4
```

Legacy env names **`EVIDENCE_APP_DIR`** / **`EVIDENCE_DIR`** still work (used by mcw-app).

### MyCarWash example

Clone this repo next to `mcw-app`, or set:

```bash
export SCREENCAST_APP_DIR=/path/to/mcw-app/app
bash record-inactive-washer-video.sh
```

## Layout

| Path | Role |
|------|------|
| `helpers/` | Fake cursor, screencast/zoom, video settings, window labels |
| `video-demo-*.spec.ts` | Playwright specs (pointer demos + optional app flows) |
| `playwright.*.config.ts` | Per-demo Playwright configs |
| `record-*.sh` | Record → webm → ffmpeg → `~/…mp4` |

## Environment (common)

| Variable | Default | Purpose |
|----------|---------|---------|
| `SCREENCAST_DIR` | package root | Specs & test-results |
| `SCREENCAST_APP_DIR` | — | Host app for `webServer` demos |
| `EVIDENCE_VIDEO_WIDTH` / `HEIGHT` | 1920×1080 | Screencast size |
| `EVIDENCE_RECORD_MS` | 10000 | Minimum record duration |
| `EVIDENCE_CURSOR_SIZE` | 56 | Fake pointer size (px) |
| `EVIDENCE_NATIVE_CURSOR` | 0 | Set `1` to skip fake pointer |

## License

MIT
