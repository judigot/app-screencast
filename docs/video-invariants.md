# Video invariants and capability inventory

This document defines the required behavior of `app-screencast` and distinguishes code that exists from behavior that has actually been proven.

## Status model

- **Implemented** — code exists for the capability. This does not by itself prove reliability, portability, synchronization, or visual quality.
- **Verified** — an automated check or retained artifact proves the requirement against a specific source SHA.
- **Planned** — acceptance criteria exist, but support is incomplete.

A capability may be implemented without being verified.

## Capability inventory

| Capability | Status | Source / current limitation |
| --- | --- | --- |
| Custom macOS-style pointer | Implemented | `helpers/evidence-cursor.ts`; no retained regression artifact currently proves all movement invariants. |
| Pointer press feedback | Implemented | `helpers/evidence-cursor.ts` scales the pointer while pressed. |
| Timed bottom window labels | Implemented | `helpers/window-label.ts`; these are role/window labels, not a full narration timeline. |
| Interaction zoom | Implemented | `helpers/evidence-zoom.ts`; synchronization with all cursor paths is not yet verified. |
| Human-like stepped pointer motion | Implemented | `moveTo()` uses stepped linear movement. It starts from viewport center rather than the pointer's actual previous position. |
| Human-like typing delay | Implemented | `typeEvidence()` uses sequential typing delay, but moves directly to the target rather than following the same natural pointer path. |
| Separate browser contexts | Implemented | Multi-window and side-by-side specs create independent Playwright contexts. Session isolation is not yet part of a retained evidence contract. |
| Side-by-side recording | Implemented | `video-demo-side-by-side.spec.ts` + `record-side-by-side.sh`; no measured synchronization invariant exists yet. |
| Segment recording and concat | Implemented | `helpers/evidence-screencast.ts` and multi-window export flow. |
| H.264 / yuv420p / fast-start export | Implemented | Recording scripts use ffmpeg `libx264`, `yuv420p`, and `+faststart`. |
| Configurable export FPS | Implemented | ffmpeg resamples to the requested output FPS. This does **not** establish the capture frame rate. |
| 60 FPS capture | Planned | Current HQ script explicitly upsamples the captured stream to 60 FPS for delivery. |
| Audio in final output | Planned | Current recording scripts use `-an`, so audio is explicitly removed. |
| Voice narration | Planned | No TTS or prerecorded narration pipeline exists yet. |
| Shared narration/actor/technical-event timeline | Planned | Required for deterministic composition and synchronization. |
| Native DevTools capture | Planned | No native DevTools capture implementation exists yet. |
| Rendered console/network telemetry panel | Planned | Must remain distinct from native DevTools and be labeled accurately. |
| Console/network event capture | Planned | Must use actual events associated with the correct actor and scenario. |
| Host adapter | Planned | `SCREENCAST_APP_DIR` exists, but `video-demo.spec.ts` still imports host fixtures/helpers directly from `../app`. |
| Portable clean-runner startup | Verified | `scripts/test-recording-foundation.sh` forces an unavailable NVM path and verifies startup with Node already on `PATH`; Recording Foundation CI passes on merged main. |
| Concurrent run isolation | Verified | Foundation CI launches concurrent invocations with the same inherited batch identity and shared parent directories, then proves distinct run/results/work/artifact paths. |
| Full captured-duration export | Verified | Recording wrappers no longer use fixed `-t 10`; foundation CI exports a 12-second synthetic source, verifies duration with `ffprobe`, and verifies the recognizable final white frames survive past ten seconds. |
| Authoritative timeline-derived duration | Planned | Full captured media is preserved, but a shared scene/narration/actor timeline is not implemented yet. |
| Per-actor persistent pointer position | Planned | Current pointer movement starts from viewport center and cursor remounting can lose conceptual position. |
| Evidence manifest tied to exact source SHA | Planned | No canonical manifest format exists yet. |
| GitHub Actions / cloud canonical recording | Planned | Documented target; no canonical retained cloud recording workflow yet proves it. |
| North-star benchmark | Planned | Defined below and in `north-star-showcase.md`; not yet executed. |

## Verified state today

No north-star requirement should be called **Verified** merely because its implementation exists.

The Recording Foundation workflow verifies these foundation behaviors on merged main:

- concurrent invocations with the same inherited batch configuration receive distinct recording identities and distinct run/results/work/artifact directories;
- cleaning one invocation removes only its ownership-marked work child and preserves another invocation plus unrelated files in the caller-supplied parent;
- two concurrent invocations cannot claim the same explicit `EVIDENCE_OUTPUT_PATH`;
- a synthetic export longer than ten seconds retains its ending, with duration checked by `ffprobe` and the recognizable final frame checked from media data;
- Node already on `PATH` works when NVM is unavailable.

These checks do **not** verify the full browser-recording showcase, sound/narration, host adapters, evidence manifests, or the five-job north-star benchmark. Those remain Implemented or Planned according to the capability table.

A requirement becomes Verified only when the repository retains machine-verifiable evidence or a retained artifact tied to the exact source SHA that demonstrates the requirement.

## Invariants

### Run isolation and concurrency

- Every recording run must have a unique run ID.
- Every run must use an isolated working directory, Playwright output directory, temporary directory, final output path, and artifact name.
- Cleanup must delete only files owned by the current run.
- Concurrent jobs must never delete, overwrite, discover, or publish another run's files.
- Fixed home-directory output names must not be used for canonical evidence.
- A successful parallel benchmark must prove real overlap from job timestamps rather than merely dispatching jobs concurrently.

### Interaction and pacing

- App interaction should be human-like but fast.
- Cursor movement should originate from the actor's actual previous pointer position.
- Cursor paths should use natural easing and distance-aware speed.
- Clicking, typing, scrolling, navigation, cursor remounting, and zooming must preserve per-actor pointer continuity.
- Typing speed should be configurable by content length and importance.
- Long or unimportant text may be accelerated while meaningful short values may be visibly typed.
- Scrolling should be smooth, intentional, and stop with the relevant UI clearly visible.
- Avoid unnecessary cursor movement, hovering, scrolling, and idle time.
- Important states must remain visible long enough to understand.
- Important final states must remain visible for at least two seconds.
- Long waits may be shortened only when doing so does not change the apparent event order or product behavior.

### Multi-user and synchronization

- Each user or role must use a separate browser context unless the scenario explicitly proves a single-session behavior.
- Role labels must use meaningful names such as `Customer` and `Admin`, not generic window names.
- Persistent role labels must remain separate from narration captions.
- When one actor's action changes another actor's state, both actors should be visible before the cross-user action when practical.
- No panel may be independently accelerated in a way that changes the apparent order of events.
- Claims such as "immediately", "real time", or "without refreshing" may only be narrated when the recording demonstrates them.
- Synchronization guarantees must be asserted from the application state or transport; simultaneous capture alone is not sufficient.

### Narration, captions, and audio

- Canonical PR evidence and showcase videos must include meaningful audible sound.
- The toolkit must support voice narration, and the canonical showcase must include intelligible voice narration.
- Silent audio tracks do not satisfy the sound requirement.
- Bottom narration captions must occupy a reserved safe area and must not cover relevant controls or evidence.
- Narration captions must remain visually separate from persistent role labels.
- Actor video, narration, captions, application audio, and technical events must share one authoritative timeline.
- Voice narration may come from generated TTS or a prerecorded track.
- Application audio and narration must be mixed rather than stripped.
- Narration volume must remain intelligible over application audio, using ducking or equivalent mixing when necessary.
- Unexpected operating-system sounds, notifications, or unrelated audio must not be published.

### Technical evidence

- Technical evidence is conditional: show it only when it materially proves the requirement.
- Native DevTools capture and a rendered telemetry panel are distinct evidence modes and must be labeled accurately.
- Console and network evidence must come from actual captured events associated with the correct actor.
- The evidence mode may include console, HTTP requests, request/response details, WebSocket frames, SSE events, or a combined view.
- Unexpected console errors must fail the scenario unless explicitly expected.
- Unexpected failed requests or unexpected 4xx/5xx responses must fail the scenario unless explicitly expected.
- Request and response evidence must be filtered to the relevant action.
- Sensitive headers, cookies, authorization values, tokens, secrets, and personal data must never be published.
- Playwright traces may supplement video evidence for action, console, and network inspection, subject to the same redaction rules.
- Technical evidence should follow the causal order: visible user action -> captured technical event -> visible result.

### Host integration

- `app-screencast` must remain independent of any particular host application's source tree.
- Host integration must use an explicit adapter contract for startup, readiness, authentication, deterministic seed/reset, actors, scenarios, and cleanup.
- `SCREENCAST_APP_DIR` may identify the host application, but toolkit-owned scenarios must not import hard-coded sibling paths such as `../app`.
- Host adapters must fail clearly when required capabilities are unavailable.
- The toolkit must be runnable on a clean cloud runner without an undeclared NVM prerequisite.

### Recording duration and export validation

- Export duration must come from the authoritative scene timeline or measured recording duration, not a fixed `-t 10`.
- Export must not cut off the final assertion or its minimum two-second hold.
- Capture FPS and export FPS are separate measurements.
- A 60 FPS export created by resampling must not be described as 60 FPS capture.
- Canonical output validation must check at least resolution, duration, video codec/container expectations, audio presence when required, and completion of the final scene.
- Failed or partial exports must not become success evidence.

### Privacy and redaction

- Redaction applies before publication to video, screenshots, traces, request/response payloads, logs, and diagnostic artifacts.
- Passwords, API keys, access tokens, session secrets, authentication headers, private cookies, and unintended personal information must never appear in published evidence.
- Failed attempts may be retained as failure diagnostics under the configured retention policy, but they must never be labeled or published as success evidence.
- Editing must not imply application behavior that did not occur.

### Recording execution environment

- Canonical evidence must be generated in GitHub Actions or on a reproducible cloud machine.
- GitHub Actions is preferred for deterministic non-interactive evidence generation.
- A reproducible cloud machine is appropriate when the scenario requires persistent desktop UI, native DevTools windows, system audio capture, or other OS-level capabilities impractical on the standard runner.
- Local recording is for development and debugging only and is not canonical evidence.
- Version-controlled configuration must control rendering-sensitive dependencies, including Node.js, Playwright/Chromium, ffmpeg, fonts, display settings, locale, timezone, viewport, and device scale.
- Generated evidence bundles must be retained by the cloud job or GitHub Actions workflow.
- Recording failure must fail the job rather than publishing incomplete evidence.

### Presentation profiles

**PR evidence**

- Optimize for direct proof, readability, reproducibility, and technical attribution.
- Use minimal editing.
- Show technical evidence when it directly maps to an acceptance criterion.
- Decorative browser video must not substitute for machine-verifiable evidence on nonvisual changes.

**Showcase**

- Use the same proven application behavior as PR evidence.
- Add deliberate pacing, composition, captions, voice narration, and audio mixing.
- Never weaken or replace assertions merely to improve presentation.

### Human review

Machine validation is necessary but not sufficient for presentation quality.

A human visual review should check:

- readability;
- pacing;
- narration accuracy;
- caption placement;
- role clarity;
- technical-evidence legibility;
- whether editing changes the apparent causal order.

## North-star metric

**Produce trustworthy PR evidence concurrently without manual recording.**

Initial benchmark target:

- Dispatch five independent recording jobs for five isolated scenarios or fixtures.
- At some point in the benchmark, all five recording jobs are simultaneously in their recording/execution interval.
- All five jobs complete successfully without touching another run's workspace or artifacts.
- Each job produces one valid evidence bundle tied to its exact repository, PR number, source SHA, scenario version, run ID, and attempt number.
- Each evidence bundle passes declared scenario assertions and media validation.
- Each bundle maps every relevant acceptance criterion to a machine assertion and, where useful, a video timestamp.
- Any source-head change invalidates evidence produced for the previous SHA.
- The benchmark requires 5/5 valid bundles; partial success does not pass.

This is a benchmark target, not an observed service-level promise.
