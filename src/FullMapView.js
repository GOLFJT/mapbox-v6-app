import React, { Component } from 'react';
import {
  StyleSheet,
  View
} from 'react-native';

import MapboxGL from '@mapbox/react-native-mapbox-gl';

MapboxGL.setAccessToken('pk.eyJ1IjoiZWtzcGVra2VyIiwiYSI6ImNqN3pubWtrejRoYWsycW8zcmdjbHNyeGcifQ.gyxXyddP6lX8msJZmiFgHA');

export default class FullMapView extends Component {
  onPressMap = (res) => {
    console.log('onPressMap : ', res);
    this._map.queryRenderedFeaturesAtPoint([res.properties.screenPointX, res.properties.screenPointY])
    .then((query) => console.log('query : ', query))
  }

  render() {
    return (
      <View style={styles.container}>
        <MapboxGL.MapView 
          ref={(ref) => this._map = ref}
          style={styles.container}
          styleURL={'http://172.16.16.23:1111/getMapStyle'}
          //styleURL={'https://mapgl.mapmagic.co.th/getstyle/mapmagic_th'}
          //centerCoordinate={[100.5314, 13.7270]}
          centerCoordinate={[100.53137183189392, 13.727066145291033]}
          zoomLevel={10}
          logoEnabled={false}
          onPress={this.onPressMap}
        >
          <MapboxGL.VectorSource
            id={'jobthai'}
            //url={'mapbox://nickitaliano.cj94go8xl18fl2qp92v8bdivv-4kgl9'}
            //url={'http://localhost:1111/tile/{z}/{x}/{y}.pbf'}
          >
            <MapboxGL.SymbolLayer 
              id={'tn-jobthai-company'}
              sourceID={'jobthai'}
              sourceLayerID={'geojsonLayer'}
              style={symbolStyle.company}
              filter={["==", "type", "company"]}
            />
            <MapboxGL.SymbolLayer 
              id={'tn-jobthai-jobs'}
              sourceID={'jobthai'}
              sourceLayerID={'geojsonLayer'}
              style={symbolStyle.company}
              filter={["==", "type", "job"]}
            />
          </MapboxGL.VectorSource>
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
    textField: '{name}',
    textSize: 16,
    textMaxAngle: 38,
    textMaxWidth: 8,
    textLineHeight: 1.1,
    textFont: [
      "Arial Unicode MS Regular"
    ],
    textOffset: [
      0,
      0.65
    ],
    textAnchor: MapboxGL.TextAnchor.Top,
    iconImage: 'tn-Comm_Comp-12',
  }
})
