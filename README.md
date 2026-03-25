# SynthLoc - Android GPS Mocking App

SynthLoc is a lightweight, optimized React Native application designed to persistently mock GPS coordinates, specifically tailored for entry-level devices like the Samsung Galaxy A07. It uses a modern Native Android Foreground Service to interface with the `FusedLocationProviderClient` for battery-efficient and reliable background tracking.

## Architecture Highlights
*   **Map UI:** Utilizes `react-native-webview` with **Leaflet.js** and **OpenStreetMap** for a fully free, keyless mapping solution.
*   **Mocking Engine:** A custom Android Foreground Service (`MockLocationService`) that prevents the OS from killing the location spoofing loop.
*   **System Synchronization:** Injects high-precision timing (`setElapsedRealtimeNanos()`) into synthetic `Location` objects to ensure compatibility with modern Android OS anti-spoofing requirements.

## Prerequisites & Setup (Linux / ADB Environment)

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/alfieprojectsdev/synth-loc.git
    cd synth-loc
    ```

2.  **Install Node Dependencies:**
    ```bash
    npm install
    ```

4.  **Device Configuration (Samsung A07 / Android Devices):**
    *   Enable Developer Options on your device.
    *   Navigate to **Developer Options** -> **Select mock location app**.
    *   Select **SynthLoc**.

5.  **Build and Deploy:**
    Connect your device via ADB and run:
    ```bash
    npm run android
    ```

## Usage
1.  Open the app on your Android device.
2.  Tap anywhere on the map to drop a pin at the desired mock location.
3.  Tap **START MOCKING**.
4.  A persistent notification will appear indicating the background service is active. Your system GPS is now mocked.
5.  To stop or change the location, tap **STOP MOCKING**.

## Technical Specs Summary (ADR-0001)
*   React Native `0.74.x`
*   Target OS: Android (Samsung Galaxy A07, MediaTek processors)
*   Foreground Service Type: `location`
*   Location Provider: `flp` (Fused Location Provider)
