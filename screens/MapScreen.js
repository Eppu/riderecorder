import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MapView, { Polyline } from 'react-native-maps';
import { Marker, MarkerAnimated } from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

const LOCATION_DISTANCE_THRESHOLD = 3; // meters
const LOCATION_TRACKING = 'location-tracking';

import {
  Text,
  Animated,
  Button,
  Pressable,
  StyleSheet,
  View,
  AppState,
} from 'react-native';

export default function MapScreen({ navigation }) {
  const [userLocation, setUserLocation] = useState(null);
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

  // Set up bottom sheet
  // const bottomSheetRef = useRef<BottomSheet>null;
  const bottomSheetRef = useRef(null);

  const snapPoints = useMemo(() => ['10%', '25%', '50%', '95%'], []);

  // callbacks
  const handleSheetChanges = useCallback((index) => {
    console.log('handleSheetChanges', index);
  }, []);
  // const handleSheetChanges = useCallback((index: number) => {
  //   console.log('handleSheetChanges', index);
  // }, []);

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
    console.log('starting location tracking');
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
    console.log('stopping location tracking');
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
      latitudeDelta: Math.max(...latDeltas) * 2.7,
      longitudeDelta: Math.max(...longDeltas) * 2.7,
    });

    setIsTracking(false);

    console.log("Stopped tracking. User's locations: ", userLocations);
    // The average speed of the user's journey
    const averageSpeed =
      userLocations.reduce((prev, curr) => prev + curr.speed, 0) /
      userLocations.length;
    console.log('Average speed: ', averageSpeed);
    console.log(
      'average speed in km/h: ',
      metersPerSecondToKilometersPerHour(averageSpeed)
    );
  };

  useEffect(() => {
    console.log('useEffect called!'),
      (async () => {
        let { status } = await Location.requestBackgroundPermissionsAsync();
        let { status: foregroundStatus } =
          await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }
        if (foregroundStatus !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }
        updateUserLocation();
        goToUserLocation();
      })();

    return () => {
      console.log('unmounting');
      Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
      console.log('location updates stopped');
      TaskManager.unregisterAllTasksAsync();
      console.log('tasks unregistered');
      setIsTracking(false);
      console.log('tracking stopped');
    };
  }, []);

  const onRegionChange = (region) => {
    console.log('region changed', region);
  };

  const updateUserLocation = async () => {
    console.log("Getting user's location...");
    let location = await Location.getCurrentPositionAsync({});
    setLocation(location);
    console.log('User location updated!', location);
  };

  const goToUserLocation = async () => {
    await updateUserLocation();

    mapRef.current.animateCamera({
      center: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      altitude: 2000,
    });
  };

  const metersPerSecondToKilometersPerHour = (metersPerSecond) => {
    return Math.round(metersPerSecond * 3.6);
  };

  TaskManager.defineTask(LOCATION_TRACKING, async ({ data, error }) => {
    if (error) {
      console.error(error);
      return;
    }
    if (data) {
      const { locations } = data;
      // do something with the locations captured in the background
      // setLocation(locations[0]); // Don't think this is actually needed for anything?
      // push the lat and long to userLocations
      const { latitude, longitude, speed } = locations[0].coords;
      // TODO: Implement out a more memory efficient way to store the user's location history
      setUserLocations((prev) => [...prev, { latitude, longitude, speed }]);
    }
  });

  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        {/* Display the map and a card on top of it on the bottom edge. */}
        {location && location?.coords && (
          <MapView
            ref={mapRef}
            style={styles.map}
            showsUserLocation={true}
            followsUserLocation={isTracking ? true : false}
            showsMyLocationButton={true}
            initialRegion={{
              latitude: location ? location.coords.latitude : 48.8587741,
              longitude: location ? location.coords.longitude : 2.2069771,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            mapPadding={{ top: 0, right: 0, bottom: 50, left: 0 }} // for now
            // onRegionChange={onRegionChange}
            // onRegionChangeComplete={onRegionChange}
            // region={location ? location.coords : null}
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
        )}
        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.centerPositionButton}
            title="Center on Me"
            onPress={goToUserLocation}
          >
            <FontAwesome6
              name={'location-arrow'}
              size={24}
              color={'gray'}
              solid
            />
          </Pressable>
        </View>

        <BottomSheet
          snapPoints={snapPoints}
          ref={bottomSheetRef}
          onChange={handleSheetChanges}
        >
          <View>
            {location && location?.coords && (
              <Text>
                Current speed:{' '}
                {metersPerSecondToKilometersPerHour(location.coords.speed)} km/h
              </Text>
            )}
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
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center', // for debugging
  },
  buttonContainer: {
    position: 'absolute',
    top: 70,
    left: 15,
    backgroundColor: 'transparent',
    zIndex: 100,
    display: 'flex',
  },
  centerPositionButton: {
    backgroundColor: 'white',
    width: 50,
    height: 50,
    padding: 10,
    borderRadius: 100,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    zIndex: -1,
  },
});
