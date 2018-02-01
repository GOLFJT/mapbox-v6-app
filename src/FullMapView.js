import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Images,
  TouchableOpacity,
} from 'react-native';

import MapboxGL from '@mapbox/react-native-mapbox-gl';

MapboxGL.setAccessToken('pk.eyJ1IjoiZWtzcGVra2VyIiwiYSI6ImNqN3pubWtrejRoYWsycW8zcmdjbHNyeGcifQ.gyxXyddP6lX8msJZmiFgHA');

const FILTER_ALL = 'All'
const FILTER_BKK = 'BKK'
const FILTER_SPK = 'SPK'
const FILTER_CNX = 'CNX'

const LIMIT = 10
const INTERVAL_TIME = 50

export default class FullMapView extends Component {
  state = {
    selectedFeature: null,
    filter: undefined,
    allpointOpacity: 1,
    snapshotURI: undefined,
  }
  onPressMap = (res) => {
    this._map.queryRenderedFeaturesAtPoint([res.properties.screenPointX, res.properties.screenPointY], null, ['all-point', 'filtered-point'])
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

  onPressFilterButton = (filter) => {
    const callback = () => {
      this.animatePoint()
    }

    if (filter === FILTER_ALL) {
      this.setState({
        filter: undefined
      }, callback)
    } else {
      let province = ""
      switch (filter) {
        case FILTER_BKK:
          province = 'กรุงเทพมหานคร'
          break
        case FILTER_SPK:
          province = 'สมุทรปราการ'
          break
        case FILTER_CNX:
          province = 'เชียงใหม่'
          break
      }

      this.setState({
        filter: ["==", "province", province]
      }, callback)
    }
  }

  animatePoint = () => {
    
    const callback = (opacity) => this.setState({
      allpointOpacity: opacity
    })

    if(this.state.filter && (this.state.allpointOpacity === 1)) {
      this.animatePointFadeOut(callback)
    } else if(!this.state.filter && (this.state.allpointOpacity === 0)) {
      this.animatePointFadeIn(callback)
    }

  }

  animatePointFadeIn = (callback) => {
    let i = 0

    this.fadeInInterval = setInterval(() => {
      if (i === LIMIT) {
        clearInterval(this.fadeInInterval)
      }
      callback(i/10)
      i++
    }, INTERVAL_TIME)
  }

  animatePointFadeOut = (callback) => {
    let i = LIMIT

    this.fadeOutInterval = setInterval(() => {
      if (i === 0) {
        clearInterval(this.fadeOutInterval)
      }
      callback(i/10)
      i--
    }, INTERVAL_TIME)
  }

  renderFilterButton = (options) => {
    let { text, left } = options
    return(
      <TouchableOpacity style={[styles.filterButton, {left}]} onPress={() => this.onPressFilterButton(text)} >
        <Text>{text}</Text>
      </TouchableOpacity>
    )
  }

  // DOING:
  renderSnapshotImage = () => {
    const { snapshotURI } = this.state
    return(
      <View style={{ flex:1, backgroundColor: 'whitesmoke' }}>
        {
          snapshotURI &&
          <Image source={{ uri: snapshotURI }} style={{ width: 200, height: 200 }} />
        }
      </View>
    )
  }

  render() {
    const { allpointOpacity } = this.state
    return (
      <View style={styles.container}>
        <MapboxGL.MapView
          ref={(ref) => this._map = ref}
          style={styles.mapContainer}
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
              style={[circleStyle.point, { circleOpacity: allpointOpacity, circleStrokeOpacity: allpointOpacity}]}
            />
            {
              this.state.filter &&
              (
                <MapboxGL.CircleLayer
                  id={'filtered-point'}
                  sourceID={'jobthai'}
                  sourceLayerID={'geojsonLayer'}
                  style={[circleStyle.filteredPoint]}
                  filter={this.state.filter}
                />
              )
            }
          </MapboxGL.VectorSource>
          {this.displayInfoBox()}
        </MapboxGL.MapView>
        {this.renderFilterButton({ text: FILTER_ALL, left: 20})}
        {this.renderFilterButton({ text: FILTER_BKK, left: 80})}
        {this.renderFilterButton({ text: FILTER_SPK, left: 140})}
        {this.renderFilterButton({ text: FILTER_CNX, left: 200})}
        {this.renderSnapshotImage()}
      </View>
    );
  }
}

const INFO_BOX_COLOR = 'teal';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  mapContainer: {
    flex: 2,
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

  filterButton: {
    position: 'absolute',
    top: 20,
    backgroundColor: 'steelblue',
    borderColor: 'whitesmoke',
    borderWidth: 1,
    borderRadius: 10,
    width: 50,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  }
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

  filteredPoint: {
    circleColor: 'teal',
    circleRadius: 8,
    circleStrokeColor: 'white',
    circleStrokeWidth: 2,
  }
});