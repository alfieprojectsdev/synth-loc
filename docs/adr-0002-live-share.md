**Architecture Decision Record (ADR)**

**Title:** SynthLoc Live Share — Sender/Receiver Roles with Honest Mock Flagging
**Status:** Proposed
**Builds on:** ADR-0001 (`adr-specs.md`) — the existing `MockLocationService` mocking core is unchanged by this ADR.

**Context:** ADR-0001 shipped a single-device app that injects synthetic coordinates into the phone's own location system so the phone itself appears to be somewhere it isn't. A separate design proposal asked for a very different capability on top of that: letting a device send its location to a chosen list of other people, and letting it receive locations from them. An earlier review of that proposal raised a concern that an app which fakes its own location and an app that vouches for locations being real can't coexist without contradicting itself. This ADR resolves that: instead of forbidding the two features from running together, every location the app ever sends out is honestly labeled as real or mocked, and that label can't be switched off by the user. The receiving side decides how to treat a labeled-as-mocked update (for example, showing it with a "simulated" badge). That removes the need to block the two features from running at the same time.

**Decisions:**

1. **Add a "Live Share" feature alongside the existing mocking feature, with every outgoing location honestly labeled.** Live Share is the new capability: broadcasting your location to people you've approved, and viewing locations they've broadcast to you. Every location it sends out carries a true/false flag saying whether that location came from the phone's real GPS or from the app's own mocking feature. The app sets this flag itself, automatically, based on whether the mocking service is currently running — the user cannot turn it off or claim a mocked location is real. Because the label is always honest, there's no need to prevent someone from running the mocking feature and Live Share at the same time; recipients are simply told the truth about what they're looking at.

2. **A device can send and receive at the same time.** Broadcasting your own location and watching others' locations are independent and can both be on at once — there's no conflict between them, since both work from the same honestly-labeled data.

3. **This ADR only covers a first slice of the original proposal, in plain terms:**
   - **How location updates travel:** updates go over the internet in near-real-time using a lightweight messaging system built for this kind of frequent, small update (the same category of technology used for chat apps and IoT sensors). We'll use its "deliver at least once" reliability setting, so a brief loss of signal (like a tunnel) doesn't silently drop your update — worst case, someone receives the same update twice, which is harmless for a location.
   - **Who can see your location:** enforced by the messaging server itself, not just the app. The server only forwards your updates to people you've approved, and — importantly — it also checks that an update claiming to be from you actually came from your device, not someone pretending to be you. (This second check is new in this ADR; see decision 4.)
   - **Privacy:** every location update is encrypted on your phone before it's sent, so even whoever runs the messaging server can't read your coordinates. Only the people you've approved can decrypt it.
   - **Viewing a received location:** when you tap on someone's shared location, the app hands the coordinates off to whatever map app you already have installed (Google Maps, OsmAnd, etc.) using a standard link, rather than building its own map-rendering for other people's pins.
   - **Explicitly not in this slice**, each held for its own future ADR:
     - Falling back to a plain text message when there's no internet — held off until we've worked out whether the app can honestly qualify for the text-messaging permission Android and iOS require for that, given the app also markets itself as a location-mocking tool (flagged as a real risk in the earlier design-doc review).
     - Cross-checking a phone's motion sensors against its GPS to catch someone using a *different* spoofing tool that doesn't self-report — the honest flag in decision 1 already covers our own mocking feature; this would be for a more paranoid trust model and isn't needed yet.
     - An iPhone version — there is currently no location code on iOS at all in this repo, so that would be a full build, not an extension, and deserves its own ADR.

4. **The server must check identity in both directions, not just one.** The original proposal only checked who's *allowed to see* your updates (your approved list). It didn't say anything about checking who's *allowed to send* updates claiming to be you. Without that second check, anyone could pretend to be you and broadcast fake locations to your contacts under your name. This ADR requires the server to verify identity both when a device asks to watch someone's location and when a device tries to publish one, so a device can only ever publish as itself.

5. **Android only, for this phase.** This adds one new background service alongside the existing mocking one, with no new Android permissions beyond what location tracking already needs — nothing SMS-related is requested in this phase, since that's explicitly deferred per decision 3.

**Rationale:**
- Keeps the working, already-tested mocking feature completely untouched — nothing about this ADR risks regressing it.
- Honest, always-on labeling is a simpler and more robust fix for the "fake vs. real" conflict than trying to police which features can run together — it also matches how the original design proposal intended the flag to work in the first place.
- Splitting the original proposal into small, separately-approved slices means each piece (this one, the text-message fallback, sensor cross-checking, iOS) gets its own explicit go/no-go instead of inheriting scope from one large document.
- Closing the send-side identity gap now, before any code is written, avoids shipping a whitelist feature that doesn't actually stop impersonation.

---

**Technical Specifications for this phase**

**1. New components (alongside the existing `MockLocationService`)**
*   `LocationShareService` — a new foreground service that reads the phone's *real* GPS (not the mocked one) and publishes it to the messaging server.
*   A client library for the messaging protocol and a library for on-device encryption, added as new app dependencies.
*   A small local list (stored on-device) of who you've approved to see your location, and who you're allowed to watch.

**2. Honest-flag logic**
*   Before publishing, `LocationShareService` checks whether `MockLocationService` is currently active.
*   If it is, the outgoing message's "is this real?" flag is forced to false. This check happens in code, not as a user-facing toggle.

**3. Server-side (messaging system) configuration**
*   A device may only listen for updates addressed to itself.
*   A device may only publish updates under its own identity — this is the fix from decision 4, and needs to be configured on the server, not assumed to happen automatically.

**4. AndroidManifest.xml additions**
*   Declare `LocationShareService` as a second foreground service (location type), separate from the existing mocking service.
*   No SMS-related permissions in this phase.

**5. Explicitly out of scope for this phase**
*   SMS fallback, sensor-fusion cross-checking, and iOS support — each deferred to its own future ADR per decision 3.
