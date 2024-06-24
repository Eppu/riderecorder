import React from 'react';
import { Text, Button } from 'react-native';

const Homescreen = ({ navigation }) => {
  return (
    <>
      <Text>Welcome to the Homescreen!</Text>
      <Button
        title="Go to About"
        onPress={() => navigation.navigate('About')}
      />
    </>
  );
};

export default Homescreen;
