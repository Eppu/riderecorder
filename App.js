import React, { useState, useEffect } from 'react';
import { Text, Animated } from 'react-native';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import { StyleSheet, View } from 'react-native';
import { Marker, MarkerAnimated } from 'react-native-maps';

export default function App() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [coordinates, setCoordinates] = useState([
    {
      latitude: 48.8587741,
      longitude: 2.2069771,
    },
    {
      latitude: 48.8323785,
      longitude: 2.3361663,
    },
  ]);

  const [mapCoordniates, setMapCoordinates] = useState([
    {
      latitude: 48.8587741,
      longitude: 2.2069771,
    },
    {
      latitude: 48.8323785,
      longitude: 2.3361663,
    },
  ]);

  const center = {
    // calculate the center of the coordinates array
    latitude:
      coordinates.reduce((prev, curr) => prev + curr.latitude, 0) /
      coordinates.length,
    longitude:
      coordinates.reduce((prev, curr) => prev + curr.longitude, 0) /
      coordinates.length,
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const onRegionChange = (region) => {
    const { latitude, longitude } = region;
    setMapCoordinates([{ latitude, longitude }]);
  };

  return (
    <View style={styles.container}>
      {/* Display the map and a card on top of it on the bottom edge. */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: center.latitude,
          longitude: center.longitude,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
        onRegionChange={onRegionChange}
      >
        {coordinates.map((coordinate, index) => (
          <Marker
            key={`coordinate_${index}`}
            coordinate={coordinate}
            title={`coordinate_${index}`}
          />
        ))}
      </MapView>

      <View style={styles.card}>
        <Text>Card</Text>
        {/* <Text>{JSON.stringify(location)}</Text> */}
        <Text>{JSON.stringify(mapCoordniates)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center', // for debugging
  },
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 24,
    // for debugging
    // borderWidth: 1,
    // borderColor: 'red',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

// import { StatusBar } from 'expo-status-bar';
// import { StyleSheet, Text, View } from 'react-native';

// export default function App() {
//   return (
//     <View style={styles.container}>
//       <Text>Open up App.js to start working on your app!</Text>
//       <StatusBar style="auto" />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });
