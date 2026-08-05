# Implementation Plan: Live Share (ADR-0002, Phase 2a)

Scopes ADR-0002 (`docs/adr-0002-live-share.md`) into concrete, independently shippable milestones, and records the recommended technology choices for the decisions that ADR left open.

## Milestones

Each milestone is meant to be its own PR, reviewable and testable on its own.

**M1 — Device identity & whitelist storage**
No networking yet. Generate a stable per-install Device ID and keypair on first launch. Build the "approved contacts" UI: add/remove an entry, display name mapped to Device ID.

**M2 — Pairing/enrollment flow**
How two phones actually learn each other's Device ID and public key, so the M1 list has a way to get populated.

**M3 — Encryption layer**
AES-256-GCM encrypt/decrypt of the 14-byte location struct (latitude, longitude, altitude, timestamp + mock-flag bit). Unit-testable independent of any networking or UI.

**M4 — MQTT client + broker wiring**
Connect, publish, subscribe. Enforce the publish/subscribe ACLs from ADR-0002 decision 4 (a device may only publish under its own identity, and only subscribe to updates addressed to itself) on the broker side.

**M5 — `LocationShareService` (sender)**
New foreground service that reads the phone's real GPS (not the mocked one), checks whether `MockLocationService` is currently active to stamp the honest mock-flag per ADR-0002 decision 1, encrypts the payload, and publishes it.

**M6 — Receiver + map relay**
Subscribe to approved contacts' topics, decrypt incoming updates, show them in a list/overlay, and hand off to whatever map app is installed via a Geo URI when the user taps one.

**M7 — Two-device end-to-end test**
Manual pass across two physical/emulated devices: device A shares its real location to device B; A switches on Mock Mode; B sees the flag on A's location flip to simulated.

**Suggested order:** M1 → M3 → M2 → M4 → M5 → M6 → M7. Identity and encryption first since both are testable in isolation with no broker involved; pairing before the broker so M4 has real Device IDs to configure ACLs against.

## Recommended technology choices

| Decision | Recommendation | Why |
|---|---|---|
| **Broker hosting** | Self-hosted Mosquitto on a small VPS you control | Per-device publish/subscribe ACLs (the decision-4 fix) need broker-level config that a free managed tier may not expose. Cheap to start; swap to a managed broker later if needed. **Has real cost/ops implications — confirm before M4, or say if you'd rather use a managed broker (e.g. HiveMQ Cloud) instead.** |
| **Pairing/enrollment (M2)** | QR code — each device displays a QR encoding its Device ID + public key; the other device scans it | Simplest cross-platform UX, no backend directory service needed, keeps M2 self-contained |
| **MQTT client library** | `mqtt` npm package over WebSocket | Pure JS, MQTT5-capable, no new native module — the app is bare React Native (no Expo), so avoiding another native bridge keeps this small |
| **Encryption library** | Start with a pure-JS AES-GCM implementation (e.g. `crypto-js`) | The payload is 14 bytes; performance isn't the bottleneck. Ship the flow first, swap in a native crypto module later only if profiling says so — matches the "keep it light for the A07" reasoning already used in ADR-0001 |
| **Whitelist storage** | `@react-native-async-storage/async-storage` | Small key-value dataset, no need for full SQLite — same reasoning ADR-0001 used to reject Mapbox/WebView on weight grounds |

## Explicitly out of scope for this plan

Per ADR-0002 decision 3: SMS fallback, sensor-fusion cross-checking, and iOS support. Each gets its own future ADR and implementation plan.
