**Architecture Decision Record (ADR)**

**Title:** Integrated Mock Location App with Optimised Map View for Samsung A07
**Status:** Accepted
**Context:** We need to build a minimum functional application to spoof GPS coordinates on a modern, entry-level Samsung Galaxy A07 (featuring a MediaTek processor and limited RAM). In addition to strict modern Android background execution requirements, the app now requires an interactive map interface so users can visually drop a pin to set mock coordinates. The architecture must minimize battery drain, memory footprint, and UI thread blocking.

**Decisions:**
1. **Map UI Selection:** **Use `react-native-maps` utilizing the native Google Maps SDK for Android**. 
2. **Core Native API Selection:** **Use the native `FusedLocationProviderClient` (FLP)** for the actual mocking mechanism, requiring a custom Native Module to bridge the React Native UI with Android's system-level location services.
3. **Background Execution:** **Implement a Foreground Service** with the `location` foreground service type to run the injection loop persistently.
4. **Location Metadata Construction:** **Inject high-precision timing data** into the synthetic `Location` object to satisfy modern Android OS synchronization requirements.

**Rationale:**
*   **Map Performance:** `react-native-maps` bridges directly to Android's native Google Maps SDK, which is deeply integrated and cached by Google Play Services, ensuring high optimization on budget hardware like the A07.
*   **Rejected Map Alternatives:** WebView-based solutions like Leaflet/React-Leaflet were rejected because they consume significantly more RAM and CPU, leading to battery drain and jank on entry-level devices. Mapbox GL was rejected because it adds unnecessary binary weight and requires third-party API keys, which overcomplicates a lightweight tool.
*   **Mocking Reliability:** The Fused Location Provider is the modern standard for abstracting hardware providers, and a foreground service ensures the OS does not terminate the spoofing process.

---

**Technical Specifications for Google Antigravity**

**1. Dependencies & API Setup**
*   Install the `react-native-maps` package to handle the visual map component.
*   Generate a Google Maps API Key via the Google Cloud Console.

**2. AndroidManifest.xml Requirements**
*   **Permissions:** Request `ACCESS_MOCK_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`, `FOREGROUND_SERVICE`, and `FOREGROUND_SERVICE_LOCATION`.
*   **API Key:** Add the Google Maps API key using a `<meta-data>` tag inside the Android manifest.
*   **Service Declaration:** Declare the background service with `android:foregroundServiceType="location"`.

**3. Interactive Map Interface (UI Layer)**
*   Implement a full-screen or prominent interactive map view.
*   Allow the user to **drop a pin** on the map to visually set their desired spoofing coordinates.
*   Extract the Latitude and Longitude from the pin drop and pass these values across the bridge to the Native Module.
*   Include a **"Start/Stop Mocking"** toggle button and a status label (e.g., "Waiting for Mock Provider selection...", "Mocking Active").

**4. Location Mocking Service Implementation (Native Layer)**
*   **Initialization:** Launch a Foreground Service that displays a persistent notification so the OS keeps the process alive.
*   **Enable Mock Mode:** Connect to the `FusedLocationProviderClient` and execute `setMockMode(true)`.
*   **Location Injection Loop:**
    *   Create a new `Location` object using the "flp" provider.
    *   Apply the Latitude and Longitude received from the map interface.
    *   **Crucial Step:** Synchronize the mock update with the system clock by calling `location.setElapsedRealtimeNanos(SystemClock.elapsedRealtimeNanos())` and `location.setTime(System.currentTimeMillis())`.
    *   Broadcast the synthetic location via `FusedLocationProviderClient.setMockLocation(location)` on a fixed loop interval (e.g., 1 second).
*   **Teardown:** Call `setMockMode(false)` upon service termination to clear the fake coordinates from the system cache and restore real GPS functionality.