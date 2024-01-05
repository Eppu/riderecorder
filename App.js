import React, { useState, useEffect, useRef } from 'react';
import { Text, Animated, Button } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { StyleSheet, View, AppState } from 'react-native';
import { Marker, MarkerAnimated } from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';
import * as TaskManager from 'expo-task-manager';

const LOCATION_DISTANCE_THRESHOLD = 3; // meters
const LOCATION_TRACKING = 'location-tracking';

export default function App() {
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
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

  // const [mapCoordniates, setMapCoordinates] = useState([
  //   {
  //     latitude: 48.8587741,
  //     longitude: 2.2069771,
  //   },
  //   {
  //     latitude: 48.8323785,
  //     longitude: 2.3361663,
  //   },
  // ]);

  // store the user's locationso we can draw a path on the map
  const [userLocations, setUserLocations] = useState([]);
  const mapRef = useRef(null);

  const center = {
    // calculate the center of the coordinates array
    latitude:
      coordinates.reduce((prev, curr) => prev + curr.latitude, 0) /
      coordinates.length,
    longitude:
      coordinates.reduce((prev, curr) => prev + curr.longitude, 0) /
      coordinates.length,
  };

  const startLocationTracking = async () => {
    await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
      accuracy: Location.Accuracy.Highest,
      distanceInterval: LOCATION_DISTANCE_THRESHOLD,
      showsBackgroundLocationIndicator: true,
    });

    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TRACKING
    );
    console.log('tracking started?', hasStarted);
    hasStarted && setIsTracking(true);
  };

  const stopLocationTracking = async () => {
    await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);

    // Calculate the center point of all the locations and set the map's region
    // So that it displays the path we took
    const center = {
      // calculate the center of the coordinates array
      latitude:
        userLocations.reduce((prev, curr) => prev + curr.latitude, 0) /
        userLocations.length,
      longitude:
        userLocations.reduce((prev, curr) => prev + curr.longitude, 0) /
        userLocations.length,
    };

    // Calculate suitable latitude and longitude daltas for the map's region
    // so that the path we took is visible
    const latDeltas = userLocations.map((location) =>
      Math.abs(center.latitude - location.latitude)
    );
    const longDeltas = userLocations.map((location) =>
      Math.abs(center.longitude - location.longitude)
    );

    // set the map's region to the center of the path we took
    mapRef.current.animateToRegion({
      ...center,
      latitudeDelta: Math.max(...latDeltas) * 2.5,
      longitudeDelta: Math.max(...longDeltas) * 2.5,
    });

    setIsTracking(false);
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();

    return () => {
      Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
    };
  }, []);

  const onRegionChange = (region) => {
    const { latitude, longitude } = region;
    console.log('region changed', region);
  };

  TaskManager.defineTask(LOCATION_TRACKING, async ({ data, error }) => {
    if (error) {
      console.error(error);
      return;
    }
    if (data) {
      const { locations } = data;
      // do something with the locations captured in the background
      setLocation(locations[0]);
      // push the lat and long to userLocations
      const { latitude, longitude } = locations[0].coords;
      // TODO: Figure out a more memory efficient way to store the user's location history
      setUserLocations((prev) => [...prev, { latitude, longitude }]);
    }
  });

  return (
    <View style={styles.container}>
      {/* Display the map and a card on top of it on the bottom edge. */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: center.latitude,
          longitude: center.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        // onRegionChange={onRegionChange}
        // onRegionChangeComplete={onRegionChange}
        region={location ? location.coords : null}
      >
        <Polyline
          coordinates={userLocations}
          strokeColor="#ffb703"
          strokeWidth={6}
        />
        {/* {coordinates.map((coordinate, index) => (
          <Marker
            key={`coordinate_${index}`}
            coordinate={coordinate}
            title={`coordinate_${index}`}
          />
        ))} */}
      </MapView>

      <View style={styles.card}>
        <Text>{JSON.stringify(location)}</Text>
        <Button
          title="Start Tracking"
          onPress={startLocationTracking}
          disabled={isTracking}
        />
        <Button
          title="Stop Tracking"
          onPress={stopLocationTracking}
          disabled={!isTracking}
        />
        <Button title="Clear Map" onPress={() => setUserLocations([])} />
      </View>
      <StatusBar
        hidden={false}
        animated={true}
        hideTransitionAnimation="slide"
        style="dark"
      />
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
