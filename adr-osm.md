Pivoting to a completely free, keyless OpenStreetMap (OSM) solution is a smart move if you want to keep the app lightweight in terms of configuration and entirely independent of Google's billing ecosystem.

To do this, we will use a **WebView** to render a lightweight HTML file running **Leaflet.js** (the industry standard for open-source web maps). 

**A quick note on your Samsung A07:** As mentioned in the ADR, running a WebView uses slightly more RAM than a native map. However, because we are writing an incredibly minimal, highly optimized Leaflet implementation with zero heavy plugins, it will run smoothly on the A07's hardware.

Here is how to swap out the Google Maps implementation for a free OpenStreetMap version.

---

### **Step 1: Swap Your Dependencies**

First, we need to remove `react-native-maps` and install `react-native-webview` instead.

Run this in your terminal:
```bash
npm uninstall react-native-maps
npm install react-native-webview
```

### **Step 2: Rewrite `App.tsx` with Leaflet and WebView**

We are going to inject a tiny, self-contained HTML string directly into the WebView. This HTML will load the map, listen for your taps, move the pin, and quietly pass the coordinates back to your React Native Java module.

Replace your `App.tsx` (or `App.js`) entirely with this code:

```javascript
import React, { useState } from 'react';
import { SafeAreaView, View, Text, Button, NativeModules, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';

const { MockLocation } = NativeModules;

const App = () => {
  const [pinLocation, setPinLocation] = useState({
    latitude: 14.6465, // Defaulting to Quezon City
    longitude: 121.0568,
  });

  // This HTML string builds our map using Leaflet.js and OpenStreetMap tiles
  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            body { padding: 0; margin: 0; background-color: #f0f0f0; }
            #map { height: 100vh; width: 100vw; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            // Initialize map
            var map = L.map('map', { zoomControl: false }).setView([${pinLocation.latitude}, ${pinLocation.longitude}], 13);
            
            // Load free OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(map);

            // Add a draggable marker
            var marker = L.marker([${pinLocation.latitude}, ${pinLocation.longitude}], {draggable: true}).addTo(map);

            // Function to send data back to React Native
            function sendLocation(lat, lng) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ lat: lat, lng: lng }));
            }

            // Update on map tap
            map.on('click', function(e) {
                marker.setLatLng(e.latlng);
                sendLocation(e.latlng.lat, e.latlng.lng);
            });

            // Update on marker drag end
            marker.on('dragend', function(e) {
                var position = marker.getLatLng();
                sendLocation(position.lat, position.lng);
            });
        </script>
    </body>
    </html>
  `;

  // Listen for messages coming from the WebView's JavaScript
  const handleMapMessage = (event) => {
    try {
      const { lat, lng } = JSON.parse(event.nativeEvent.data);
      setPinLocation({ latitude: lat, longitude: lng });
    } catch (error) {
      console.error("Failed to parse coordinates from map", error);
    }
  };

  const handleSetLocation = () => {
    // Fire the native Java module we built in Step 3 of the original guide
    MockLocation.setMockLocation(pinLocation.latitude, pinLocation.longitude);
    Alert.alert(
      "Location Spoofed", 
      `Coordinates pushed to OS:\nLat: ${pinLocation.latitude.toFixed(5)}\nLng: ${pinLocation.longitude.toFixed(5)}`
    );
  };

  const handleStop = () => {
    MockLocation.stopMocking();
    Alert.alert("Stopped", "Mock location disabled.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Tap or Drag Pin to Spoof Location</Text>
      
      <View style={styles.mapContainer}>
        <WebView
          source={{ html: mapHTML }}
          onMessage={handleMapMessage}
          scrollEnabled={false}
          bounces={false}
          style={styles.map}
        />
      </View>

      <View style={styles.controls}>
        <Text style={styles.coordsText}>
          Target: {pinLocation.latitude.toFixed(5)}, {pinLocation.longitude.toFixed(5)}
        </Text>
        <View style={styles.buttonRow}>
          <Button title="Set Location" onPress={handleSetLocation} />
          <Button title="Stop Spoofing" color="red" onPress={handleStop} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginVertical: 10, color: '#333' },
  mapContainer: { flex: 1, marginHorizontal: 10, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#ccc' },
  map: { width: '100%', height: '100%' },
  controls: { padding: 20, backgroundColor: '#f8f9fa', borderTopWidth: 1, borderColor: '#eee' },
  coordsText: { textAlign: 'center', marginBottom: 15, fontSize: 15, color: '#444', fontFamily: 'monospace' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around' }
});

export default App;
```

### **Step 3: Clean and Rebuild**

Because you added a new native module (`react-native-webview`), you need to run a fresh build so Android can link the new dependencies.

1. Ensure your Samsung A07 is connected and USB debugging is enabled.
2. Run:
```bash
npm run android
```
