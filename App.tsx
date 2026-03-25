import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  NativeModules,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { MockLocationModule } = NativeModules;

function App(): React.JSX.Element {
  const [mockingActive, setMockingActive] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const handleMapPress = (e: any) => {
    if (mockingActive) {
      Alert.alert('Cannot move pin', 'Please stop mocking before selecting a new location.');
      return;
    }
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
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

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onPress={handleMapPress}
      >
        {selectedLocation && (
          <Marker coordinate={selectedLocation} title="Mock Location" />
        )}
      </MapView>
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
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  statusBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
