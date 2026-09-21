# Evidence bundle contract

An evidence bundle is the unit of proof produced by `app-screencast` and consumed by PR-readiness automation.

## Identity

Every bundle must identify:

- repository;
- PR number when applicable;
- exact source SHA;
- deployment/environment identifier when applicable;
- scenario ID and version;
- toolkit version;
- run ID;
- attempt number;
- runner or job URL;
- start and finish timestamps.

Evidence for SHA A must never satisfy readiness for SHA B.

## Required artifacts

A scenario may declare which artifacts are required. The bundle can include:

- final video;
- screenshots;
- assertion report;
- sanitized console/network/real-time event evidence;
- Playwright trace;
- media-validation report;
- human-review result;
- checksums.

## Acceptance-criterion mapping

Every acceptance criterion that requires evidence must map to:

- one or more machine assertions;
- optional technical evidence;
- optional video timestamp or timestamp range.

Video is supporting evidence, not the sole source of truth for nonvisual behavior.

## Publication safety

Redaction must occur before evidence is published.

The redaction boundary includes:

- screenshots;
- video;
- traces;
- request/response bodies;
- headers;
- logs;
- console output.

The bundle must never publish authentication secrets, private cookies, tokens, API keys, or unintended personal data.

## Manifest

The canonical manifest should be machine-readable and versioned.

Illustrative shape:

```json
{
  "schemaVersion": 1,
  "repository": "owner/repo",
  "pullRequest": 123,
  "sourceSha": "0123456789abcdef",
  "scenario": {
    "id": "booking-confirmation",
    "version": 1,
    "profile": "pr-evidence"
  },
  "run": {
    "id": "unique-run-id",
    "attempt": 1,
    "jobUrl": "https://github.com/...",
    "startedAt": "ISO-8601",
    "finishedAt": "ISO-8601"
  },
  "artifacts": [],
  "criteria": [],
  "checksums": {},
  "retention": {}
}
```

The exact schema is planned and should be finalized in the implementation PR that introduces bundle generation.
