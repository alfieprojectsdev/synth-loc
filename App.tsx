import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  NativeModules,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';

const { MockLocationModule } = NativeModules;

function App(): React.JSX.Element {
  const [mockingActive, setMockingActive] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    const requestNotificationPermission = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Warning',
            'Background spoofing requires notification permissions to stay alive.'
          );
        }
      }
    };
    requestNotificationPermission();
  }, []);

  const handleMapMessage = (event: any) => {
    try {
      if (mockingActive) {
        // Technically we can ignore updates if mocking is active, or we just warn
        // We'll just silently ignore setting location while active to match previous logic
        return;
      }
      const { lat, lng } = JSON.parse(event.nativeEvent.data);
      setSelectedLocation({ latitude: lat, longitude: lng });
    } catch (error) {
      console.error('Failed to parse coordinates from map', error);
    }
  };

  const toggleMocking = () => {
    if (mockingActive) {
      MockLocationModule.stopMocking();
      setMockingActive(false);
    } else {
      if (!selectedLocation) {
        Alert.alert('No Location Selected', 'Please tap on the map to drop a pin first.');
        return;
      }
      MockLocationModule.startMocking(selectedLocation.latitude, selectedLocation.longitude);
      setMockingActive(true);
    }
  };

  const defaultLat = 14.6465;
  const defaultLng = 121.0568;
  const initLat = selectedLocation ? selectedLocation.latitude : defaultLat;
  const initLng = selectedLocation ? selectedLocation.longitude : defaultLng;

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
            var map = L.map('map', { zoomControl: false }).setView([${initLat}, ${initLng}], 13);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(map);

            var marker = L.marker([${initLat}, ${initLng}], {draggable: true}).addTo(map);

            function sendLocation(lat, lng) {
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ lat: lat, lng: lng }));
                }
            }

            map.on('click', function(e) {
                marker.setLatLng(e.latlng);
                sendLocation(e.latlng.lat, e.latlng.lng);
            });

            marker.on('dragend', function(e) {
                var position = marker.getLatLng();
                sendLocation(position.lat, position.lng);
            });
        </script>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <WebView
          source={{ html: mapHTML }}
          onMessage={handleMapMessage}
          scrollEnabled={false}
          bounces={false}
          style={styles.map}
        />
      </View>
      <View style={styles.overlay}>
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>
            Status: {mockingActive ? 'Mocking Active' : 'Waiting for Provider selection...'}
          </Text>
          {selectedLocation && (
            <Text style={styles.coordsText}>
              {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.button, mockingActive ? styles.buttonStop : styles.buttonStart]}
          onPress={toggleMocking}
        >
          <Text style={styles.buttonText}>
            {mockingActive ? 'STOP MOCKING' : 'START MOCKING'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  statusBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  coordsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    elevation: 3,
  },
  buttonStart: {
    backgroundColor: '#4CAF50',
  },
  buttonStop: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default App;
