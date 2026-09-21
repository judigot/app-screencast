# North-star showcase

The north-star showcase is the reference video used to evaluate new `app-screencast` capabilities.

## Goal

Generate a polished 45-60 second product-demo video that feels intentionally produced while every visible application interaction is performed against the real running application.

The scenario should exercise as many invariants as possible in one coherent workflow.

## Scenario

Demonstrate a booking workflow involving two independent users:

- Customer
- Admin

The customer books an available appointment.

The admin is already signed in in a separate browser context and sees the booking appear.

The admin confirms the booking.

The customer then sees the booking status update to confirmed.

The workflow should prove that two independent users can interact with the same application and observe each other's changes.

## Direction

- Target duration: 45-60 seconds.
- Output: 1920x1080 H.264 MP4.
- Target frame rate: 60 FPS.
- Start directly inside the product.
- Include application audio where meaningful.
- Include voice narration.
- Include synchronized on-screen narration near the bottom of the video.
- Do not show Playwright UI, test tooling, terminals, or implementation details unless technical evidence is intentionally part of the scene.
- Do not add edits that make the product appear to perform behavior it did not actually perform.
- The finished video should look intentionally produced rather than like raw browser automation.

## Scene 1 - Establish the workflow

Show the Customer application viewing available appointment slots.

Narration:

> Booking an appointment takes only a few seconds.

The pointer should already be visible but should not move unnecessarily while the viewer establishes context.

## Scene 2 - Customer creates a booking

The pointer moves smoothly to an available appointment.

Apply a subtle zoom toward the relevant UI.

The Customer selects the appointment and submits the booking.

Use natural but accelerated interaction timing.

Narration:

> The customer chooses an available time and submits the booking.

Hold the resulting state long enough to understand.

## Scene 3 - Reveal the Admin

Transition to side-by-side mode.

- Customer on the left.
- Admin on the right.
- Clearly label both roles.
- Preserve both sessions and application state.

Narration:

> The admin receives the new booking immediately.

If the product supports real-time updates, show the actual real-time behavior rather than simulating it through editing.

## Scene 4 - Admin confirms with technical evidence

Keep both users visible when practical.

The Admin opens or selects the new booking and confirms it.

Narration:

> The admin reviews the request and confirms it.

When technical evidence materially strengthens the proof, temporarily reveal the least intrusive relevant DevTools evidence.

Preferred evidence sequence:

```text
Admin clicks Confirm
        |
        v
Network evidence appears
        |
        v
PATCH /api/bookings/:id -> 200
        |
        v
real-time event reaches Customer
        |
        v
Customer UI changes Pending -> Confirmed
```

Use the real endpoint and transport of the host application. Do not hard-code the example endpoint if the app uses something else.

The technical evidence should be filtered to the specific action being demonstrated.

Never expose authorization headers, cookies, access tokens, secrets, or personal data.

## Scene 5 - Customer receives the result

Keep both panels visible.

The Customer application receives the resulting state change through the product's actual synchronization mechanism.

Narration:

> The customer sees the confirmation without leaving the page.

The visual relationship between the Admin action and Customer update should be obvious.

## Scene 6 - Final state

Either keep both roles side by side or focus on the Customer's confirmed booking, whichever produces the clearest ending.

Narration:

> One booking. Two users. One synchronized workflow.

Hold the successful final state briefly.

Do not navigate away from the result.

## Technical-evidence rules

Use technical evidence only when it proves something important.

Preferred philosophy:

```text
Show the UX
    ->
Reveal the internal evidence
    ->
Show the resulting UX
```

The agent should choose the smallest useful evidence surface:

- no DevTools
- console
- network
- request details
- response details
- WebSocket or real-time event
- combined evidence

Unexpected console errors, unexpected failed requests, or unexpected 4xx/5xx responses should fail the evidence run unless the scenario explicitly expects them.

## Success criteria

The north-star video passes when:

- A viewer can understand the workflow without additional explanation.
- The video does not look like raw Playwright automation.
- No cursor teleportation is visible.
- No unexplained application state changes occur.
- Customer and Admin sessions are genuinely independent.
- Side-by-side presentation clearly communicates cross-user behavior.
- Real application behavior produces the demonstrated results.
- Technical evidence, when used, clearly corresponds to the user action that caused it.
- Narration is synchronized with the corresponding scenes.
- Voice narration is audible and intelligible.
- Captions remain readable and unobtrusive.
- Application audio is preserved where useful.
- No sensitive information appears.
- There is no unnecessary dead time.
- The successful outcome is visually obvious.
- The final MP4 contains both video and audio once audio support is implemented.
- The workflow can be reproduced automatically from a clean starting state.

Any change to cursor movement, zooming, captions, narration, audio, multi-window behavior, technical evidence, scene orchestration, recording, or FFmpeg export should be evaluated against this showcase.
