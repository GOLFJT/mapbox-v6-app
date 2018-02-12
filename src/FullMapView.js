import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
} from 'react-native';

import MapboxGL from '@mapbox/react-native-mapbox-gl';
import circle from '@turf/circle'
import truncate from '@turf/truncate'
import distance from '@turf/distance'
import pointsWithinPolygon from '@turf/points-within-polygon'
import { coordAll } from '@turf/meta'
import turf from '@turf/helpers'
import pinIcon from './assets/images/pin.png'

const MAP_ACCESS_TOKEN = 'pk.eyJ1IjoiZWtzcGVra2VyIiwiYSI6ImNqN3pubWtrejRoYWsycW8zcmdjbHNyeGcifQ.gyxXyddP6lX8msJZmiFgHA'

MapboxGL.setAccessToken(MAP_ACCESS_TOKEN);

const MAP_STYLE_URL = 'https://mapgl.mapmagic.co.th/getstyle/mapmagic_th'

const FILTER_ALL = 'All'
const FILTER_BKK = 'BKK'
const FILTER_SPK = 'SPK'
const FILTER_CNX = 'CNX'

const LIMIT = 10
const INTERVAL_TIME = 50

const NEARME_RADIUS = 1 // KM

const SERVICE_LAST_IP = 16

const INITIAL_USER_LOCATION = [100.5018, 13.7563]
const INITIAL_FEATURE_COLLECTION = {
  type: "FeatureCollection",
  features: [],
}

export default class FullMapView extends Component {
  state = {
    allowLocation: false,
    selectedFeature: null,
    queryFeatures: null,
    filter: undefined,
    allpointOpacity: 1,
    snapshotURI: undefined,
    userLocation: INITIAL_USER_LOCATION,  // set initial as BKK
    circleRadius: undefined,
    screenCoords: [],
    visibleFeatures: INITIAL_FEATURE_COLLECTION,
    nearmePoints: INITIAL_FEATURE_COLLECTION,
    selectedFeatureIndex: 0,
  }

  constructor(props) {
    super(props)

    this.onTakeSnapMap = this.onTakeSnapMap.bind(this)
    this.onTakeSnapshot = this.onTakeSnapshot.bind(this)
    this.findNearme = this.findNearme.bind(this)
    this.getVisibleFeaturesInBound = this.getVisibleFeaturesInBound.bind(this)

    this.visibleBounds = []
  }

  componentDidMount() {
    this.tryUpdateUserLocation()
  }

  componentWillUnmount() {
    navigator.geolocation.clearWatch(this.watchId)
  }

  // DOINGG:
  onRegionDidChange = (res) => {
    console.log('onRegionDidChange : ', res)
    this.visibleBounds = res.properties.visibleBounds
    // this.findNearme(this.visibleBounds)
    this.getVisibleFeaturesInBound(this.visibleBounds)
  }

  onDidFinishRenderingMapFully = () => {
    // Find nearme for First Map Rendered
    // this.findNearme(this.visibleBounds)
    this.getVisibleFeaturesInBound(this.visibleBounds)
  }

  tryUpdateUserLocation = () => {
    // request location permission
    navigator.geolocation.requestAuthorization()
    this.watchUserLocation()

  }

  watchUserLocation = () => {
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        // this.setState({
        //   latitude: position.coords.latitude,
        //   longitude: position.coords.longitude,
        //   error: null,
        // });
        const { coords } = position
        this.setState({
          userLocation: [coords.longitude, coords.latitude],
          allowLocation: true,
        }, () => {
          // this.createCircleRadius()
        })
      },
      (error) => {
        console.log('watchUserLocation error : ', error)
        this.setState({
          userLocation: INITIAL_USER_LOCATION,
          allowLocation: false,
        })
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000, distanceFilter: 10 },
    );
  }

  updateUserLocation = (callback = () => {}) => {
    navigator.geolocation.getCurrentPosition((position) => {
      const { coords } = position
      this.setState({
        userLocation: [coords.longitude, coords.latitude],
        allowLocation: true,
      }, callback)
    }, (err) => {
      console.log('getPositionError : ', err)
      this.setState({
        allowLocation: false,
      })
      
    })
  }
  
  // DOINGG:
  // getVisibleFeaturesInBound = (visibleBound) => {
  async getVisibleFeaturesInBound (visibleBound) {
    console.log('|=== getVisibleFeaturesInBound ===| visibleBound : ', visibleBound)
    const featureCollection = turf.featureCollection([
      turf.point(visibleBound[0]),
      turf.point(visibleBound[1])
    ])

    const truncateFeature = truncate(featureCollection)
    const coords = coordAll(truncateFeature)
    const screenCoordsNE = await this.getPointInView(coords[0])
    const screenCoordsSW = await this.getPointInView(coords[1])
    const boundingBox = this.getBoundingBox([screenCoordsNE, screenCoordsSW])

    console.log('boundingBox : ', boundingBox)

    this._map.queryRenderedFeaturesInRect(boundingBox, null, ['all-point'])
    .then((result) => {
      console.log('|=== getVisibleFeaturesInBound ===| queryRenderedFeaturesInRect : ', result)
      // this.setState({
      //   visibleFeatures: result,
      // })

      if (result.features.length > 0) {
        this.calculateNearMeDistance(result)
      }

    })
  }

  // DOINGG:
  calculateNearMeDistance = (visibleFeatures) => {
    const { userLocation } = this.state
    const userLocationPoint = turf.point(userLocation)

    visibleFeatures.features.forEach((point) => {
      const featurePoint = turf.point(point.geometry.coordinates)
      point.properties.distance = distance(userLocationPoint, featurePoint)
    })

    // this.setState({
    //   visibleFeatures
    // }, () => {
    //   this.sortFeaturesFromDistance()
    // })

    this.sortFeaturesFromDistance(visibleFeatures)
  }

  // DOINGG:
  // sortFeaturesFromDistance = () => {
  sortFeaturesFromDistance = (visibleFeatures) => {
    // const { visibleFeatures } = this.state

    const sortVisibleFeatures = {
      type: 'FeatureCollection',
      features: [...visibleFeatures.features]
    }

    sortVisibleFeatures.features.sort((a, b) => {
      if (a.properties.distance > b.properties.distance) {
        return 1;
      }
      if (a.properties.distance < b.properties.distance) {
        return -1;
      }
      // a must be equal to b
      return 0;
    })

    this.setState({
      visibleFeatures: sortVisibleFeatures,
    }, () => console.log('visibleFeatures : ', this.state.visibleFeatures))

  }

  onPressMap = (res) => {
    // console.log('|=== onPress ===| res : ', res)
    const { queryFeatures, selectedFeatureIndex } = this.state
    // this._map.queryRenderedFeaturesAtPoint([res.properties.screenPointX, res.properties.screenPointY], null, ['all-point', 'filtered-point'])
    this._map.queryRenderedFeaturesAtPoint([res.properties.screenPointX, res.properties.screenPointY], null, ['visible-points-layer'])
      .then((query) => {
        console.log('query : ', query.features)

        let indexFeatures = -1
        let selectedFeature = null

        if (query.features.length > 0) {
          // check is get same result
          if (JSON.stringify(query) === JSON.stringify(queryFeatures)) {
            console.log('|=== onPressMap ===| Get same result')
            const nextIndex = selectedFeatureIndex + 1
            indexFeatures = (nextIndex + 1 > query.features.length) ? 0 : nextIndex
          } else {
            console.log('|=== onPressMap ===| Get new result')
            indexFeatures = 0
          }
          
          selectedFeature = query.features[indexFeatures];

        } else {
          indexFeatures = 0
          selectedFeature = null
        }

        this.setState({
          queryFeatures: query,
          selectedFeatureIndex: indexFeatures,
          selectedFeature: selectedFeature
        })
      })
  }

  async getPointInView(coords) {
    const pointInView = await this._map.getPointInView(coords)
    return pointInView
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

    if (this.state.filter && (this.state.allpointOpacity === 1)) {
      this.animatePointFadeOut(callback)
    } else if (!this.state.filter && (this.state.allpointOpacity === 0)) {
      this.animatePointFadeIn(callback)
    }

  }

  animatePointFadeIn = (callback) => {
    let i = 0

    this.fadeInInterval = setInterval(() => {
      if (i === LIMIT) {
        clearInterval(this.fadeInInterval)
      }
      callback(i / 10)
      i++
    }, INTERVAL_TIME)
  }

  animatePointFadeOut = (callback) => {
    let i = LIMIT

    this.fadeOutInterval = setInterval(() => {
      if (i === 0) {
        clearInterval(this.fadeOutInterval)
      }
      callback(i / 10)
      i--
    }, INTERVAL_TIME)
  }

  renderFilterButton = (options) => {
    let { text, left } = options
    return (
      <TouchableOpacity style={[styles.filterButton, { left }]} onPress={() => this.onPressFilterButton(text)} >
        <Text>{text}</Text>
      </TouchableOpacity>
    )
  }

  createCircleRadius = () => {
    const { userLocation } = this.state
    const circleRadius = circle(userLocation, NEARME_RADIUS, { properties: { id: 'nearme-polygon' } })
    this.setState({
      circleRadius
    })
  }

  // DOING:
  async findNearme(bounds) {
    const featureCollection = turf.featureCollection([
      turf.point(bounds[0]),
      turf.point(bounds[1])
    ])

    const truncateFeature = truncate(featureCollection)
    const coords = coordAll(truncateFeature)
    const screenCoordsNE = await this.getPointInView(coords[0])
    const screenCoordsSW = await this.getPointInView(coords[1])
    const boundingBox = this.getBoundingBox([screenCoordsNE, screenCoordsSW])

    this._map.queryRenderedFeaturesInRect(boundingBox, null, ['all-point', 'filtered-point'])
    .then((result) => {
      // Set visibleFeatures state
      this.setState({
        visibleFeatures: result,
      })

      // Find pointsWithinPolygon : visibleFeatures 
      if (result.features.length > 0) {
        const nearmePoints = pointsWithinPolygon(result, this.state.circleRadius)
        this.setState({
          nearmePoints,
        })
      } else {
        this.setState({
          nearmePoints: INITIAL_FEATURE_COLLECTION,
        })
      }
    })

  }

  getBoundingBox = (screenCoords) => {
    const maxX = Math.max(screenCoords[0][0], screenCoords[1][0]);
    const minX = Math.min(screenCoords[0][0], screenCoords[1][0]);
    const maxY = Math.max(screenCoords[0][1], screenCoords[1][1]);
    const minY = Math.min(screenCoords[0][1], screenCoords[1][1]);
    return [maxY, maxX, minY, minX];
  }

  renderNearmePoints = () => {
    const { nearmePoints } = this.state
    if (nearmePoints.features.length > 0) {
      return (
        <MapboxGL.ShapeSource id={'nearme-points'} shape={nearmePoints}>
          <MapboxGL.CircleLayer id={'nearme-points-layer'} sourceID={'nearme-points'} style={circleStyle.nearmePoints} />
        </MapboxGL.ShapeSource>
      )
    } 
    return null
  }

  renderUserCurrentLocationRadius = () => {
    const { circleRadius } = this.state
    if (circleRadius) {
      return (
        <MapboxGL.ShapeSource id={'nearme-radius'} shape={circleRadius}>
          <MapboxGL.FillLayer id={'nearme-layer'} sourceID={'nearme-radius'} style={fillStyle.radius} />
        </MapboxGL.ShapeSource>
      )
    }
    return null
  }

  // DOINGG:
  renderVisibleFeatures = () => {
    const { visibleFeatures } = this.state

    if (visibleFeatures.features.length > 0) {
      return (
        <MapboxGL.ShapeSource id={'visible-points'} shape={visibleFeatures}>
          <MapboxGL.CircleLayer id={'visible-points-layer'} sourceID={'visible-points'} style={circleStyle.nearmePoints} />
        </MapboxGL.ShapeSource>
      )
    } 

    return null
  }

  renderSnapshotImage = () => {
    const { snapshotURI } = this.state
    const onLayout = (layout) => {
      const {x, y, width, height} = layout
    }

    return (
      <View style={{ flex: 1, backgroundColor: 'rosybrown', alignItems: 'center', justifyContent: 'center' }} onLayout={(event) => { onLayout(event.nativeEvent.layout)}} >
        {
          snapshotURI &&
          <View>
            <Image source={{ uri: snapshotURI }} style={{ width: 200, height: 200 }} />
            <Image source={pinIcon} style={{ width: 20, height: 30, position: 'absolute', top: 70, left: 90, resizeMode: 'contain' }} />
          </View>

        }
      </View>
    )
  }

  async onTakeSnapshot() {
    // onTakeSnapshot () {
    const { selectedFeature } = this.state

    if (selectedFeature) {
      const { coordinates } = selectedFeature.geometry
      const uri = await MapboxGL.snapshotManager.takeSnap({
        centerCoordinate: coordinates,
        width: 200,
        height: 200,
        zoomLevel: 15,
        // pitch: 30,
        // heading: 20,
        styleURL: MAP_STYLE_URL,
        // styleURL: MAP_STYLE_URL,
        // writeToDisk: true, // creates a temp file
      })

      // const uri = await MapboxGL.snapshotManager.takeSnap({
      //   bounds: [[100.6601460314522, 13.875034454766947], [100.402653968545, 13.578538331624344]],
      //   width: 200,
      //   height: 200,
      //   styleURL: MAP_STYLE_URL,
      // });

      this.setSnapshotURI(uri)
      // const newURI = `https://api.mapbox.com/v4/mapbox.light/pin-l-suitcase+ff2f92(${coordinates[0]},${coordinates[1]})/${coordinates[0]},${coordinates[1]},15/200x200.png?access_token=${MAP_ACCESS_TOKEN}`
      // console.log('newURI : ', newURI)
      // this.setSnapshotURI(newURI)
    }
  }

  async onTakeSnapMap() {
    const uri = await this._map.takeSnap(false);
    this.setSnapshotURI(uri)
  }

  setSnapshotURI = (uri) => {
    this.setState({
      snapshotURI: uri,
    })
  }

  // DOINGG:
  renderUserCurrentLocation = () => {

    const onPress = () => {
      this.updateUserLocation(() => {
        this._map.moveTo(this.state.userLocation)
      })
    }

    return(
      <TouchableOpacity style={styles.userLocation} onPress={onPress}>
        {
          !this.state.allowLocation &&
          <Text style={styles.undefineLocation} >?</Text>
        }
      </TouchableOpacity>
    )
  }

  // DOINGG:
  renderFeaturesList = () => {
    const { features } = this.state.visibleFeatures
    console.log('renderFeaturesList visibleFeatures : ', this.state.visibleFeatures)
    console.log('renderFeaturesList features : ', features)

    const listHeader = () => {
      return(
        <View style={styles.listFeatureHeader}>
          <Text>{features.length} Visible Features</Text>
        </View>
      )
    }

    const rowItem = (item, index) => {
      return(
        <View style={styles.listFeatureRow}>
          <Text style={styles.listFeatureItem}>{index+1}.</Text>
          <Text style={styles.listFeatureItem}>{item.properties.zip}, {item.properties.district}</Text>
          <Text style={styles.listFeatureItem}>Distance: {item.properties.distance.toFixed(2)}km</Text>
        </View>
      )
    }

    return(
      <View style={styles.listContainer}>
        {
          features.length > 0 &&
          <FlatList
            data={features}
            renderItem={({item, index}) => rowItem(item, index)}
            keyExtractor={(item, index) => index}
            ListHeaderComponent={listHeader}
          />
        }
        {
          features.length === 0 &&
          <Text>No Visible Feature</Text>
        }
        
      </View>
    )
  }

  // DOING:
  render() {
    const { allpointOpacity, filter, selectedFeature, userLocation, circleRadius } = this.state

    return (
      <View style={styles.container}>
        <View style={styles.mapContainer}>
          <MapboxGL.MapView
            ref={(ref) => this._map = ref}
            style={styles.mapContainer}
            showUserLocation={true}
            //userTrackingMode={MapboxGL.UserTrackingModes.Follow}
            //styleURL={'http://172.16.16.23:1111/getMapStyle'}
            styleURL={MAP_STYLE_URL}
            //centerCoordinate={[100.5314, 13.7270]}
            centerCoordinate={userLocation}
            zoomLevel={12}
            logoEnabled={false}
            onPress={this.onPressMap}
            onUserTrackingModeChange={(response) => console.log('onUserTrackingModeChange : ', response)}
            onRegionDidChange={this.onRegionDidChange}
            onDidFinishRenderingMapFully={this.onDidFinishRenderingMapFully}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            {/* {this.renderUserCurrentLocationRadius()} */}
            <MapboxGL.VectorSource
              id={'jobthai'}
              //url={'http://172.16.16.23:1111/getTileJSON'}
              url={`http://172.16.16.${SERVICE_LAST_IP}:1111/getTileJSON`}
            >
              <MapboxGL.CircleLayer
                id={'all-point'}
                sourceID={'jobthai'}
                sourceLayerID={'geojsonLayer'}
                //aboveLayerID={aboveNearMeLayer}
                style={[circleStyle.point, { circleOpacity: allpointOpacity, circleStrokeOpacity: allpointOpacity }]}
              />
              {
                filter &&
                (
                  <MapboxGL.CircleLayer
                    id={'filtered-point'}
                    sourceID={'jobthai'}
                    sourceLayerID={'geojsonLayer'}
                    //aboveLayerID={aboveNearMeLayer}
                    style={[circleStyle.filteredPoint]}
                    filter={filter}
                  />
                )
              }
            </MapboxGL.VectorSource>
            {
              selectedFeature &&
              <MapboxGL.ShapeSource
                id={'selected-source'}
                shape={selectedFeature}
              >
                <MapboxGL.CircleLayer
                  id={'selected-point'}
                  sourceID={'selected-source'}
                  //aboveLayerID={aboveNearMeLayer}
                  style={[circleStyle.selectedPoint]}
                />
              </MapboxGL.ShapeSource>
            }

            {/* {this.renderNearmePoints()} */}

            {this.renderVisibleFeatures()}

          </MapboxGL.MapView>
          {/* {this.renderFilterButton({ text: FILTER_ALL, left: 20 })}
          {this.renderFilterButton({ text: FILTER_BKK, left: 80 })}
          {this.renderFilterButton({ text: FILTER_SPK, left: 140 })}
          {this.renderFilterButton({ text: FILTER_CNX, left: 200 })} */}
          { this.renderUserCurrentLocation() }
        </View>
        {/* {this.renderSnapshotImage()} */}
        {this.renderFeaturesList()}
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

  listContainer: {
    flex: 1,
    backgroundColor: 'whitesmoke'
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
  },

  userLocation: {
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: 'lightblue', 
    position: 'absolute', 
    right: 10, 
    bottom: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },

  undefineLocation: {
    fontSize: 20,
  },

  listFeatureRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'black',
    flexDirection: 'row',
    padding: 10,
  },

  listFeatureHeader: {
    backgroundColor: 'coral',
    padding: 10,
  },

  listFeatureItem: {
    marginRight: 5,
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

const CIRCLE_POINT_BASE = {
  circleRadius: 8,
  circleStrokeWidth: 2,
}

const circleStyle = MapboxGL.StyleSheet.create({
  point: {
    ...CIRCLE_POINT_BASE,
    circleColor: 'lightcoral',
    circleStrokeColor: 'white',
  },

  filteredPoint: {
    ...CIRCLE_POINT_BASE,
    circleColor: 'teal',
    circleStrokeColor: 'white',
  },

  selectedPoint: {
    ...CIRCLE_POINT_BASE,
    circleColor: 'lightseagreen',
    circleStrokeColor: 'white',
    circleRadius: 12,
  },

  nearmePoints: {
    ...CIRCLE_POINT_BASE,
    circleColor: 'crimson',
    circleStrokeColor: 'white',
  },
});

const fillStyle = MapboxGL.StyleSheet.create({
  radius: {
    fillColor: 'lightblue',
    fillOpacity: 0.5
  }
})