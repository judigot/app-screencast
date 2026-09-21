# Video invariants

These invariants define the expected behavior of videos produced by `app-screencast`.

They are split into two groups:

- **Currently implemented** — behavior already supported by the repository.
- **Future implementation** — required direction for upcoming work and the north-star showcase.

## Currently implemented

- App interaction should be human-like but fast.
- Mouse movement should be smooth instead of jumping instantly between elements.
- Typing should simulate human typing with a controlled per-character delay.
- Clicks should include a short visual press state so interactions are easy to follow.
- The pointer should remain visible during app interaction.
- The pointer should use the custom macOS-style pointer instead of the browser's native cursor by default.
- The pointer should remain correctly positioned while zooming.
- Important interactions should automatically zoom toward the active UI area.
- Zoom should reset after an interaction or recording segment.
- The screencast should hide Playwright's own action indicators.
- Recording should begin after the relevant page is ready instead of showing unnecessary blank browser startup time.
- Individual workflow sections may be recorded as separate segments and concatenated into one final video.
- The final video should be exported as H.264 MP4.
- The final MP4 should use yuv420p for broad playback compatibility.
- The final MP4 should use fast-start metadata for web playback.
- Recording resolution and quality should be configurable.
- High-quality recording should support configurable FPS, CRF, and FFmpeg preset.
- If the demo requires multiple independent users or sessions, each user should use a separate browser context.
- Multiple browser contexts should preserve their own application state while switching between them.
- The active user or browser context should be identifiable with an on-screen label.
- Browser-context labels should appear near the bottom of the screen.
- Browser-context labels should automatically disappear after a short period.
- Two browser contexts should be able to run and record simultaneously.
- Two browser contexts should be able to be composed side by side into one video.
- Side-by-side recordings should keep both browser panels synchronized for the intended demo duration.
- The host application should remain in its own repository and `app-screencast` should operate as an external screencast toolkit.
- The application directory should be configurable through `SCREENCAST_APP_DIR`.
- Demo-specific Playwright configuration should remain separate from the host application's normal Playwright configuration.
- Screencast behavior should be configurable through environment variables rather than requiring source changes.
- Recording flows should be deterministic enough to run as automated Playwright scenarios.
- The recording should fail when expected UI elements or application states are missing instead of silently producing misleading evidence.

## Future implementation

### Interaction and pacing

- App interaction should remain human-like but faster than normal manual use.
- Cursor paths should use natural easing rather than only linear interpolation.
- Cursor movement should originate from its actual previous position.
- Cursor movement speed should vary naturally with travel distance.
- Typing speed should be configurable by content length and importance.
- Long or unimportant text should be entered quickly while short meaningful values may be visibly typed.
- Scrolling should be smooth, intentional, and stop with the target UI clearly visible.
- The agent should avoid unnecessary hovering, scrolling, mouse movement, and idle time.
- Important UI state changes should remain visible long enough for the viewer to understand the result.
- Long loading periods should be shortened, cut, or accelerated when the wait itself is not relevant.
- Meaningful loading, progress, optimistic updates, and real-time transitions should remain visible when they demonstrate product behavior.

### Multi-user and layout

- If the demo requires multiple user types, such as admin and standard user, the agent should use split screen or two browser windows side by side when simultaneous visibility improves understanding.
- Role-based demos should identify users explicitly, for example `Admin`, `Customer`, `Owner`, or `Staff`, instead of generic window names.
- Role labels should remain visually consistent throughout the demo.
- Each actor should have its own browser context, authentication state, and deterministic demo data.
- For interactions between users, the triggering action and the resulting state change should be visible together whenever practical.
- Real-time workflows should prefer simultaneous presentation over repeated context switching when side-by-side is clearer.
- The agent should automatically choose between single-window, sequential multi-window, and side-by-side presentation based on the workflow.

### Narration and audio

- Videos should support sound.
- Videos must support voice narration.
- On-screen narration should appear near the bottom of the screen.
- On-screen narration should be separate from browser-context or role labels.
- Narration should explain intent and outcome rather than trivial pointer movement.
- Narration should be synchronized with the action being shown.
- Voice narration and on-screen narration should follow the same scene timeline.
- Voice narration should support generated text-to-speech.
- Voice narration should also support a prerecorded narration track.
- Application audio and voice narration should be mixed into the final MP4 instead of being stripped during export.
- Application audio, narration, and optional interaction sounds should have independently configurable volume levels.
- Voice narration should remain clear over application audio through ducking or equivalent volume control.
- Unexpected operating-system sounds, notifications, or unrelated audio should not appear in the final recording.

### Scene orchestration

- Demo scenarios should support reusable named actors.
- Demo scenarios should support declarative steps describing actor, action, expected result, narration, and preferred layout.
- Recording orchestration should automatically place narration, role labels, cursor behavior, zoom, and timing from the scenario definition.
- The toolkit should support explicit scene boundaries.
- Each scene should have a clear starting state, action, and observable result.
- Scene transitions should preserve enough context that the viewer understands how the application reached the next state.
- The final frame of an important scene should remain visible briefly before transitioning.
- Failed recording attempts should never be included in the final output.
- The toolkit should verify expected application state before and after each important recorded action.

### Technical evidence

- The screencast should be able to show browser DevTools when technical evidence materially strengthens the demonstration.
- DevTools should only be shown when relevant to the task.
- The agent should choose between product-only, console evidence, network evidence, or combined evidence based on the scenario.
- DevTools should never be shown merely because they are available.
- Product UX should remain the primary focus unless the purpose of the video is specifically technical verification.
- The browser console should be available as an evidence panel.
- Console evidence should be used to prove meaningful runtime behavior such as emitted events, state transitions, warnings, errors, or diagnostic output.
- Console output should be filtered to messages relevant to the demonstrated feature.
- Unexpected console errors should fail the evidence run unless explicitly expected by the scenario.
- Expected errors should be clearly identified as intentional behavior.
- Important console output should remain visible long enough to read.
- The Network tab should be available as an evidence panel.
- Network evidence should be used to prove meaningful HTTP, API, WebSocket, SSE, or other network behavior.
- Network evidence should focus on requests relevant to the demonstrated action.
- The agent should be able to filter requests by endpoint, method, resource type, or search term.
- Important requests should show HTTP method, endpoint, status code, and timing when relevant.
- Request and response payloads should be inspectable when they provide useful evidence.
- Sensitive request headers, cookies, authorization values, tokens, and personal data must never be visible.
- Sensitive request or response fields should be automatically redacted before appearing in the recording.
- Unexpected 4xx or 5xx responses should fail the evidence run unless explicitly expected by the scenario.
- WebSocket and real-time traffic should be inspectable when demonstrating real-time features.
- A real-time demo should be able to prove that the receiving client changed because of an actual network event rather than editing.
- Technical evidence should be synchronized with the visible user action that caused it.
- The video should make the causal relationship clear: user action -> technical event -> visible result.
- DevTools may be shown beside the application in split-screen mode.
- The application should remain large enough to understand while DevTools is visible.
- DevTools should be collapsed or removed once the relevant evidence has been shown.
- Multi-user demonstrations should associate technical evidence with the correct browser context.
- Customer and Admin sessions should not share console or network evidence accidentally.
- Scene-level configuration should support no DevTools, console, network, request details, response details, real-time events, or combined technical evidence.
- The agent should automatically select the least intrusive evidence mode that adequately proves the behavior.
- PR evidence and debugging demonstrations should prefer stronger technical evidence when useful.

### Privacy and trust

- Sensitive values such as passwords, API keys, tokens, personal information, and authentication secrets must never appear in the final recording.
- The toolkit should support automatic masking or redaction of configured sensitive elements.
- Browser chrome, developer tools, terminals, and unrelated applications should remain outside the recording unless intentionally required by the demo.
- Notifications and unrelated UI should not appear in the recording.
- Editing must not imply application behavior that did not actually occur.

### Output quality and reproducibility

- The recording viewport, browser zoom, and device scale should remain consistent throughout a scene.
- Text and interactive elements should remain legible at the final exported resolution.
- Desktop, tablet, and mobile demos should use deliberate viewport presets.
- The toolkit should support portrait and landscape output when required by the target platform.
- The toolkit should support reusable output presets for PR evidence, product demos, documentation, and social-media previews.
- PR evidence videos should prioritize proof and reproducibility over cinematic presentation.
- Product demo videos should prioritize clarity, pacing, narration, and visual polish.
- Every generated video should be reproducible from an explicit scenario or script.
- The toolkit should retain enough metadata to identify the scenario, app, viewport, actors, and recording configuration used to produce the video.
- The final video should contain no unnecessary dead time at the beginning or end.
- The final output should prioritize clarity and information density over decorative effects.
