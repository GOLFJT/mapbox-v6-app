import React, { Component } from 'react'
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native'

import MapboxGL from '@mapbox/react-native-mapbox-gl';

const MAP_ACCESS_TOKEN = 'pk.eyJ1IjoiZWtzcGVra2VyIiwiYSI6ImNqN3pubWtrejRoYWsycW8zcmdjbHNyeGcifQ.gyxXyddP6lX8msJZmiFgHA'

MapboxGL.setAccessToken(MAP_ACCESS_TOKEN);

export default class MapView extends Component {

  componentDidMount() {
    this.tryUpdateUserLocation()
  }

  tryUpdateUserLocation = () => {
    // request location permission
    navigator.geolocation.requestAuthorization()
    this.watchUserLocation()
  }

  watchUserLocation = () => {
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { coords } = position
        this.props.onUserLocationChange(coords, undefined)
      },
      (error) => {
        console.log('watchUserLocation error : ', error)
        this.props.onUserLocationChange({}, error)
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000, distanceFilter: 10 },
    );
  }


  // DOING:
  render() {
    return(
      <View style={styles.container}>
        <View style={styles.mapContainer}>
          <MapboxGL.MapView
            {...this.props}
            style={styles.mapContainer}
          >

          </MapboxGL.MapView>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  mapContainer: {
    flex: 1,
  },
})