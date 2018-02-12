import React, { Component } from 'react'
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native'

import MapboxGL from '@mapbox/react-native-mapbox-gl'
import turf from '@turf/helpers'
import distance from '@turf/distance'
import truncate from '@turf/truncate'
import { coordAll } from '@turf/meta'

const MAP_ACCESS_TOKEN = 'pk.eyJ1IjoiZWtzcGVra2VyIiwiYSI6ImNqN3pubWtrejRoYWsycW8zcmdjbHNyeGcifQ.gyxXyddP6lX8msJZmiFgHA'

MapboxGL.setAccessToken(MAP_ACCESS_TOKEN);

const INITIAL_FEATURE_COLLECTION = {
  type: "FeatureCollection",
  features: [],
}

export default class MapView extends Component {

  // Life cycle
  constructor(props) {
    super(props)

    this.getVisibleFeaturesInBound = this.getVisibleFeaturesInBound.bind(this)
  }

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

  // DOINGG:
  onRegionDidChange = (res) => {
    this.visibleBounds = res.properties.visibleBounds
    this.getVisibleFeaturesInBound(this.visibleBounds)
  }

  onDidFinishRenderingMapFully = () => {
    this.getVisibleFeaturesInBound(this.visibleBounds)
  }

  // DOINGG:
  async getVisibleFeaturesInBound (visibleBound) {
    const featureCollection = turf.featureCollection([
      turf.point(visibleBound[0]),
      turf.point(visibleBound[1])
    ])
  
    const truncateFeature = truncate(featureCollection)
    const coords = coordAll(truncateFeature)
    const screenCoordsNE = await this.getPointInView(coords[0])
    const screenCoordsSW = await this.getPointInView(coords[1])
    const boundingBox = this.getBoundingBox([screenCoordsNE, screenCoordsSW])
  
    this._map.queryRenderedFeaturesInRect(boundingBox, null, ['all-point'])
    .then((result) => {
      if (result.features.length > 0) {
        this.calculateNearMeDistance(result)
      } else {
        this.props.onVisibleFeaturesChange(INITIAL_FEATURE_COLLECTION)
      }

    })
  }

  async getPointInView(coords) {
    const pointInView = await this._map.getPointInView(coords)
    return pointInView
  }

  getBoundingBox = (screenCoords) => {
    const maxX = Math.max(screenCoords[0][0], screenCoords[1][0]);
    const minX = Math.min(screenCoords[0][0], screenCoords[1][0]);
    const maxY = Math.max(screenCoords[0][1], screenCoords[1][1]);
    const minY = Math.min(screenCoords[0][1], screenCoords[1][1]);
    return [maxY, maxX, minY, minX];
  }

  // DOINGG:
  calculateNearMeDistance = (visibleFeatures) => {
    const { userLocation } = this.props
    const userLocationPoint = turf.point(userLocation)

    visibleFeatures.features.forEach((point) => {
      const featurePoint = turf.point(point.geometry.coordinates)
      point.properties.distance = distance(userLocationPoint, featurePoint)
    })

    this.sortFeaturesFromDistance(visibleFeatures)
  }

  // DOINGG:
  sortFeaturesFromDistance = (visibleFeatures) => {
    let sortVisibleFeatures = {
      type: 'FeatureCollection',
      features: [...visibleFeatures.features]
    }
  
    sortVisibleFeatures.features.sort((a, b) => {
      if (a.properties.distance > b.properties.distance) {
        return 1
      }
      if (a.properties.distance < b.properties.distance) {
        return -1
      }
      // a must be equal to b
      return 0
    })
  
    // Remove duplicate point
    sortVisibleFeatures.features = sortVisibleFeatures.features.filter((point, index, self) =>
      index === self.findIndex((current) => (
        current.properties.zip === point.properties.zip && current.properties.district === point.properties.district && current.properties.distance === point.properties.distance
      ))
    )

    this.props.onVisibleFeaturesChange(sortVisibleFeatures)
  }

  // DOING:
  render() {
    return(
      <View style={styles.container}>
        <View style={styles.mapContainer}>
          <MapboxGL.MapView
            {...this.props}
            ref={(ref) => this._map = ref}
            style={styles.mapContainer}
            onRegionDidChange={this.onRegionDidChange}
            onDidFinishRenderingMapFully={this.onDidFinishRenderingMapFully}
          >
            <MapboxGL.VectorSource
              id={'jobthai'}
              //url={'http://172.16.16.23:1111/getTileJSON'}
              url={`http://172.16.16.16:1111/getTileJSON`}
            >
              <MapboxGL.CircleLayer
                id={'all-point'}
                sourceID={'jobthai'}
                sourceLayerID={'geojsonLayer'}
                //aboveLayerID={aboveNearMeLayer}
                style={circleStyles.point}
              />
            </MapboxGL.VectorSource>
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

// LAYER STYLE
const CIRCLE_POINT_BASE = {
  circleRadius: 8,
  circleStrokeWidth: 2,
}
const circleStyles = MapboxGL.StyleSheet.create({
  point: {
    ...CIRCLE_POINT_BASE,
    circleColor: 'lightcoral',
    circleStrokeColor: 'white',
  },
})