import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

import MapboxGL from '@mapbox/react-native-mapbox-gl';

MapboxGL.setAccessToken('pk.eyJ1IjoiZWtzcGVra2VyIiwiYSI6ImNqN3pubWtrejRoYWsycW8zcmdjbHNyeGcifQ.gyxXyddP6lX8msJZmiFgHA');

export default class FullMapView extends Component {
  state = {
    selectedFeature: null,
    filter: [],
  }
  onPressMap = (res) => {
    this._map.queryRenderedFeaturesAtPoint([res.properties.screenPointX, res.properties.screenPointY], null, ['tn-jobthai-company', 'tn-jobthai-jobs'])
      .then((query) => {
        console.log('query : ', query.features)
        // if (query.features.length > 0) {
        //   const selectedFeature = query.features[0];
        //   this.setSelectedFeature(selectedFeature)
        // } else {
        //   this.setSelectedFeature(null)
        // }

      })
  }

  setSelectedFeature = (selectedFeature) => {
    this.setState({
      selectedFeature
    })
  }

  displayInfoBox = () => {
    const { selectedFeature } = this.state
    console.log('selectedFeature : ', selectedFeature)
    if (selectedFeature !== null) {
      const { coordinates } = selectedFeature.geometry;
      const { name } = selectedFeature.properties;
      return (
        <MapboxGL.PointAnnotation
          id={'selected-feature'}
          coordinate={coordinates}
          anchor={{ x: 0.5, y: 2 }}
        >
          <TouchableOpacity style={styles.infoContainer} >
            <View style={styles.infoBox} >
              <Text>{name}</Text>
            </View>
            <View style={styles.arrowDown} />
          </TouchableOpacity>
        </MapboxGL.PointAnnotation>
      )
    }
    return null
  }

  render() {
    return (
      <View style={styles.container}>
        <MapboxGL.MapView
          ref={(ref) => this._map = ref}
          style={styles.container}
          //styleURL={'http://172.16.16.23:1111/getMapStyle'}
          styleURL={'https://mapgl.mapmagic.co.th/getstyle/mapmagic_th'}
          centerCoordinate={[100.5314, 13.7270]}
          zoomLevel={10}
          logoEnabled={false}
          onPress={this.onPressMap}
        >
          <MapboxGL.VectorSource
            id={'jobthai'}
            url={'http://172.16.16.12:1111/getTileJSON'}
          >
            <MapboxGL.CircleLayer
              id={'all-point'}
              sourceID={'jobthai'}
              sourceLayerID={'geojsonLayer'}
              style={circleStyle.point}
              filter={this.state.filter}
            />
          </MapboxGL.VectorSource>
          {this.displayInfoBox()}
        </MapboxGL.MapView>
      </View>
    );
  }
}

const INFO_BOX_COLOR = 'teal';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  infoContainer: {
    alignItems: 'center',
  },

  infoBox: {
    padding: 10,
    backgroundColor: INFO_BOX_COLOR,
  },

  arrowDown: {
    width: 0,
    height: 0,
    borderRightWidth: 10,
    borderLeftWidth: 10,
    borderTopWidth: 10,
    borderTopColor: INFO_BOX_COLOR,
    borderRightColor: 'transparent',
    borderLeftColor: 'transparent',
  },
})

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
    visibility: 'visible',
  },
})

const circleStyle = MapboxGL.StyleSheet.create({
  point: {
    circleColor: 'lightcoral',
    circleRadius: 8,
    circleStrokeColor: 'white',
    circleStrokeWidth: 2,
  },
});