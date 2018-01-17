import React, { Component } from 'react';
import {
  StyleSheet,
  View
} from 'react-native';

import MapboxGL from '@mapbox/react-native-mapbox-gl';

MapboxGL.setAccessToken('pk.eyJ1IjoiZWtzcGVra2VyIiwiYSI6ImNqN3pubWtrejRoYWsycW8zcmdjbHNyeGcifQ.gyxXyddP6lX8msJZmiFgHA');

export default class FullMapView extends Component {
  render() {
    return (
      <View style={styles.container}>
        <MapboxGL.MapView 
          style={styles.container}
          //styleURL={'http://172.16.16.23:1111/getMapStyle'}
          styleURL={'https://mapgl.mapmagic.co.th/getstyle/mapmagic_th'}
          centerCoordinate={[100.5314, 13.7270]}
          zoomLevel={10}
          logoEnabled={false}
        >
          
        </MapboxGL.MapView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const symbolStyle = MapboxGL.StyleSheet.create({
  company: {
    textField: 'Heloooooo',
    textSize: 16,
    iconImage: 'tn-Comm_Comp-12',
  }
})
