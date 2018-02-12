import React, { Component } from 'react';
import {
  StyleSheet,
  View
} from 'react-native';

// import FullMapView from './src/FullMapView'
import AppWithNavigation from './src/navigation'

export default class App extends Component {
  render() {
    return (
      <View style={styles.container}>
        <AppWithNavigation />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
});
