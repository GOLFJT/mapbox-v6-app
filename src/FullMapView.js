import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

import MapboxGL from '@mapbox/react-native-mapbox-gl';

import PostalData from './data/postal_data.json'

MapboxGL.setAccessToken('pk.eyJ1IjoiZWtzcGVra2VyIiwiYSI6ImNqN3pubWtrejRoYWsycW8zcmdjbHNyeGcifQ.gyxXyddP6lX8msJZmiFgHA');

export default class FullMapView extends Component {
  state = {
    selectedFeature: null,
  }
  onPressMap = (res) => {
    this._map.queryRenderedFeaturesAtPoint([res.properties.screenPointX, res.properties.screenPointY], null, ['clusteredPoints', 'singlePoint'])
      .then((query) => {
        console.log('query : ', query.features)
        if (query.features.length > 0) {
          const selectedFeature = query.features[0];
          this.setSelectedFeature(selectedFeature)
        } else {
          this.setSelectedFeature(null)
        }

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

  renderAnnotation = () => {
    const { selectedFeature } = this.state
    console.log('selectedFeature : ', selectedFeature)
    if (selectedFeature !== null) {
      const { coordinates } = selectedFeature.geometry;
      const { name } = selectedFeature.properties;
      return (
        <MapboxGL.PointAnnotation
          id={'selected-feature'}
          title={name}
          coordinate={coordinates}
          selected={true}
        >
          <View style={{height:0,}} />
          <MapboxGL.Callout title={name} />
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
          styleURL={'http://172.16.16.23:1111/getMapStyle'}
          //styleURL={'https://mapgl.mapmagic.co.th/getstyle/mapmagic_th'}
          centerCoordinate={[100.5314, 13.7270]}
          //centerCoordinate={[-77.12911152370515, 38.79930767201779]}
          zoomLevel={5}
          logoEnabled={false}
          onPress={this.onPressMap}
          pitchEnabled={false}
        >
          <MapboxGL.ShapeSource
            id={'postal'}
            shape={PostalData}
            cluster={true}
            clusterRadius={20}
          >
            <MapboxGL.CircleLayer 
              id={'clusteredPoints'}
              sourceID={'postal'}
              style={circleStyle.clusteredPoints}
              filter={['has', 'point_count']}
            />
            <MapboxGL.SymbolLayer 
              id={'postal_count'}
              sourceID={'postal'}
              style={symbolStyle.clusterCount}
              filter={['has', 'point_count']}
            />
            <MapboxGL.CircleLayer 
              id={'singlePoint'}
              sourceID={'postal'}
              style={circleStyle.singlePoint}
              filter={['!has', 'point_count']}
            />
          </MapboxGL.ShapeSource>
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

  clusterCount: {
    textField: '{point_count}',
    textSize: 12,
    textAllowOverlap: true,
  }
})

const circleStyle = MapboxGL.StyleSheet.create({
  clusteredPoints: {
    circleColor: MapboxGL.StyleSheet.source([
      [0, '#51bbd6'],  // blue
      [20, '#f1f075'],  // yellow
      [80, '#f28cb1'],  // pink
    ], 'point_count', MapboxGL.InterpolationMode.Exponential),

    circleRadius: MapboxGL.StyleSheet.source([
      [0, 10],
      [20, 15],
      [80, 30],
    ], 'point_count', MapboxGL.InterpolationMode.Exponential),
    
    circleStrokeWidth: 2,
    circleStrokeColor: 'white',
  },

  singlePoint: {
    circleColor: 'green',
    circleOpacity: 0.84,
    circleStrokeWidth: 2,
    circleStrokeColor: 'white',
    circleRadius: 5,
  },
})
