# North-star showcase

The north-star showcase is the reference scenario used to evaluate `app-screencast` presentation and evidence quality.

It does not replace the concurrency north-star metric in `video-invariants.md`. The concurrency metric proves the system can produce trustworthy evidence at scale; this showcase proves the quality of each evidence bundle.

## Reference scenario

Use a deterministic booking fixture backed by a real resettable backend.

Actors:

- Customer A
- Customer B
- Admin

All actors use separate browser contexts and deterministic fictional identities.

The scenario must prove:

1. Customer A sees an available slot.
2. Customer A books the slot.
3. The backend persists the booking.
4. Admin sees the booking in a separate session.
5. Admin confirms the booking.
6. Customer A sees the confirmed state through the actual application synchronization mechanism.
7. Reloading Customer A preserves the confirmed state.
8. Customer B attempts to book the now-occupied slot.
9. Customer B receives the expected rejection.
10. The rejected action does not create a duplicate booking.

The host adapter owns deterministic setup, reset, authentication, seed data, and cleanup.

## Profiles

The same scenario must support two presentation profiles.

### PR evidence

- Direct proof.
- Minimal editing.
- Readable assertions and technical details.
- Technical evidence appears when it strengthens an acceptance criterion.
- Machine assertions remain authoritative.

### Showcase

- Uses the same proven workflow and assertions as PR evidence.
- Deliberate pacing and composition.
- Voice narration.
- Bottom narration captions.
- Application audio where meaningful.
- Role-aware layout.
- Technical evidence only when it helps the viewer understand why the state changed.

## Direction

- Target showcase duration: approximately 60-90 seconds for the full positive and negative workflow.
- Output target: 1920x1080 H.264 MP4.
- Delivery FPS may target 60 FPS, but capture FPS must be measured separately and must not be inferred from export resampling.
- Produce canonical recordings in GitHub Actions or on a reproducible cloud machine.
- Start directly inside the product.
- Do not show Playwright tooling, terminals, or implementation details unless they are intentional technical evidence.
- Do not edit the video in a way that implies behavior the application did not perform.
- Final important states remain visible for at least two seconds.

## Timeline

All actor recordings, captions, narration, application audio, console/network events, screenshots, and assertions share one authoritative timeline.

No panel may be independently accelerated in a way that changes apparent event order.

## Scene 1 - Establish availability

Show Customer A and the available booking slot.

Narration:

> Customer A starts with a slot that is available to book.

Keep captions inside the reserved bottom safe area.

## Scene 2 - Customer A books

Customer A selects and submits the booking.

Assert booking creation against the real backend.

Narration:

> Customer A books the available slot.

Hold the resulting state long enough to read.

## Scene 3 - Show Admin before the cross-user action

Bring Admin into side-by-side view before the relevant cross-user state transition.

- Customer A is clearly labeled.
- Admin is clearly labeled.
- Both remain independent sessions.

Assert that the Admin observes the created booking.

Only describe this as "immediate", "real time", or "without refreshing" if the recorded behavior and assertions prove that claim.

## Scene 4 - Admin confirms with conditional technical evidence

Admin confirms the booking.

Narration:

> The admin confirms the booking.

When useful, show the least intrusive technical evidence that proves the action.

Example only:

```text
Admin clicks Confirm
        |
        v
actual request/event captured for Admin
        |
        v
successful persistence
        |
        v
actual synchronization event reaches Customer A
        |
        v
Customer A UI changes to Confirmed
```

Use the host application's actual method, endpoint, response, and transport. Never hard-code narration from assumptions.

Native DevTools and a rendered telemetry panel must be identified as different modes.

## Scene 5 - Customer A receives and persists the result

Show Customer A's confirmed booking.

Assert the expected state.

Reload Customer A.

Assert that the confirmed state persists.

Narration should describe only what the video demonstrates.

## Scene 6 - Negative concurrency/business-rule proof

Bring Customer B into view.

Customer B attempts to book the occupied slot.

Assert the expected rejection.

Assert that no duplicate booking was created.

Narration:

> A second customer cannot take the slot after it has been booked.

If a relevant API rejection is useful evidence, show the sanitized request/response or telemetry associated with Customer B.

## Scene 7 - Final proof

Show the final successful state:

- Customer A: confirmed booking.
- Admin: confirmed booking.
- Customer B: expected rejection.
- Backend assertion: exactly one booking for the slot.

Hold the final state for at least two seconds.

## Narration and audio requirements

- The canonical showcase includes intelligible voice narration.
- A silent audio track does not satisfy this requirement.
- Bottom captions communicate the same meaning as narration without covering relevant controls.
- Persistent role labels remain separate from captions.
- Application audio may be mixed where meaningful.
- Narration and application audio share the authoritative timeline.

## Evidence bundle

Every canonical run produces a bundle containing at least:

- repository;
- PR number when applicable;
- exact source SHA;
- deployment ID or tested environment identifier when applicable;
- scenario name and version;
- toolkit version;
- run ID and attempt number;
- runner/job URL;
- start/end timestamps;
- video;
- relevant screenshots;
- assertion results;
- sanitized technical evidence;
- optional Playwright trace when permitted;
- mapping from acceptance criteria to assertions and useful video timestamps;
- artifact checksums;
- retention policy metadata.

A newer source SHA invalidates readiness based on an older bundle.

## Media validation

The job must validate:

- expected resolution;
- expected container/codec;
- duration matches the authoritative timeline within declared tolerance;
- final scene is complete and includes the minimum two-second hold;
- an audio stream is present when required;
- showcase narration is intelligible through human review;
- no fixed export duration truncates the scenario.

## Failure handling

- Failed attempts remain available as failure diagnostics according to retention policy.
- Failed attempts never become success evidence.
- Unexpected console errors, unexpected failed requests, or unexpected 4xx/5xx responses fail the scenario unless explicitly expected.
- Redaction applies before publication to video, screenshots, traces, payloads, and logs.

## Execution environment

Preferred order:

1. GitHub Actions for deterministic non-interactive recording.
2. A reproducible cloud machine when full desktop, native DevTools, system audio, or other OS-level capture is required.

Local runs are development/debugging only.

## Showcase pass condition

The showcase passes only when all positive and negative assertions pass, persistence after reload is proven, the final evidence bundle matches the exact source SHA, required media validation passes, and human review confirms readability, pacing, role clarity, caption placement, and narration accuracy.
