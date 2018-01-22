import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

import MapboxGL from '@mapbox/react-native-mapbox-gl';
import turf from '@turf/helpers'
import supercluster from 'supercluster'

import PostalData from './data/postal_data.json'

MapboxGL.setAccessToken('pk.eyJ1IjoiZWtzcGVra2VyIiwiYSI6ImNqN3pubWtrejRoYWsycW8zcmdjbHNyeGcifQ.gyxXyddP6lX8msJZmiFgHA');

const CLUSTER_RADIUS = 20
const INITIAL_ZOOM_LEVEL = 5
const WORLD_BOUND = [-180.0000, -90.0000, 180.0000, 90.0000];


export default class FullMapView extends Component {
  state = {
    selectedFeature: null,
    clusterData: null,
  }

  constructor(props) {
    super(props)

    this.currentZoomLevel = -1
  }

  componentDidMount() {
    this.cluster = supercluster({
      radius: CLUSTER_RADIUS
    })

    this.cluster.load(PostalData.features)
  }

  onDidFinishLoadingMap = () => {
    console.log('onDidFinishLoadingMap')
  }

  onRegionDidChange = (location) => {
    console.log('onRegionDidChange : ', location)

    const { zoomLevel } = location.properties

    if (Math.floor(zoomLevel) !== this.currentZoomLevel) {
      this.updateClusters(Math.floor(zoomLevel))
    }
  }

  updateClusters = (zoomLevel) => {
    console.log('UPDATE CLUSTERS')

    this.currentZoomLevel = zoomLevel  // set new current zoom level

    let clusterData = turf.featureCollection(this.cluster.getClusters(WORLD_BOUND, zoomLevel))
    this.setState({
      clusterData
    })
  }

  onPressMap = (res) => {
    this._map.queryRenderedFeaturesAtPoint([res.properties.screenPointX, res.properties.screenPointY], null, ['clusteredPoints', 'singlePoint'])
      .then((query) => {
        console.log('query : ', query.features)
        
        if (query.features.length > 0) {
          let feature = query.features[0]
          const { cluster_id } = feature.properties
          if (cluster_id) {
            const clusterChild = this.cluster.getChildren(cluster_id)
            console.log('clusterChild : ', clusterChild)
          }
        }

      })
  }

  render() {
    return (
      <View style={styles.container}>
        <MapboxGL.MapView
          ref={(ref) => this._map = ref}
          style={styles.container}
          //styleURL={'http://172.16.16.33:1111/getMapStyle'}
          styleURL={'https://mapgl.mapmagic.co.th/getstyle/mapmagic_th'}
          centerCoordinate={[100.5314, 13.7270]}
          zoomLevel={INITIAL_ZOOM_LEVEL}
          logoEnabled={false}
          onPress={this.onPressMap}
          pitchEnabled={false}
          onDidFinishLoadingMap={this.onDidFinishLoadingMap}
          onRegionDidChange={this.onRegionDidChange}
        >
          <MapboxGL.ShapeSource
            id={'postal'}
            shape={this.state.clusterData}
            cluster={true}
            clusterRadius={CLUSTER_RADIUS}
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
