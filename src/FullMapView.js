import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native';

import MapboxGL from '@mapbox/react-native-mapbox-gl';
import bbox from '@turf/bbox'
import circle from '@turf/circle'
import truncate from '@turf/truncate'
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

const SERVICE_LAST_IP = 23

export default class FullMapView extends Component {
  state = {
    selectedFeature: null,
    filter: undefined,
    allpointOpacity: 1,
    snapshotURI: undefined,
    userLocation: [100.5018, 13.7563],  // set initial as BKK
    circleRadius: undefined,
    screenCoords: [],
  }

  constructor(props) {
    super(props)

    this.onTakeSnapMap = this.onTakeSnapMap.bind(this)
    this.onTakeSnapshot = this.onTakeSnapshot.bind(this)
    // this.findNearme = this.findNearme.bind(this)
  }

  componentDidMount() {
    this.tryUpdateUserLocation()
  }

  componentWillUnmount() {
    navigator.geolocation.clearWatch(this.watchId)
  }

  onRegionDidChange = (res) => {
    console.log('onRegionDidChange : ', res)
    this.findNearme(res.properties.visibleBounds)
  }

  // DOINGG:
  tryUpdateUserLocation = () => {
    // request location permission
    navigator.geolocation.requestAuthorization()
    this.watchUserLocation()

  }

  // DOINGG:
  watchUserLocation = () => {
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        // this.setState({
        //   latitude: position.coords.latitude,
        //   longitude: position.coords.longitude,
        //   error: null,
        // });
        console.log('watchUserLocation : ', position)
        const { coords } = position
        this.setState({
          userLocation: [coords.longitude, coords.latitude]
        }, () => {
          this.createCircleRadius()
        })
      },
      (error) => {
        console.log('watchUserLocation error : ', error)
        this.setState({
          userLocation: undefined
        })
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000, distanceFilter: 10 },
    );
  }

  // DOINGG:
  updateUserLocation = () => {
    navigator.geolocation.getCurrentPosition((position) => {
      console.log('getPositionSuccess : ', position)
      const { coords } = position
      this.setState({
        userLocation: [coords.longitude, coords.latitude]
      })
    }, (err) => {
      console.log('getPositionError : ', err)
    })
  }

  onPressMap = (res) => {
    this._map.queryRenderedFeaturesAtPoint([res.properties.screenPointX, res.properties.screenPointY], null, ['all-point', 'filtered-point'])
      .then((query) => {
        console.log('query : ', query.features)
        if (query.features.length > 0) {
          const selectedFeature = query.features[0];
          this.setSelectedFeature(selectedFeature)
        } else {
          this.setSelectedFeature(null)
          this.setSnapshotURI(null)
        }

        // this.onTakeSnapMap()
        this.onTakeSnapshot()

      })

    // const { screenPointX, screenPointY } = res.properties
    // const screenCoords = Object.assign([], this.state.screenCoords);
    // screenCoords.push([screenPointX, screenPointY]);

    console.log('|=== onPress ===| res : ', res)


    // console.log('|=== onPress ===| screenCoords : ', screenCoords)

    // this.getPointInView(res.geometry.coordinates)

    // if (screenCoords.length === 2) {
    //   // const featureCollection = await this._map.queryRenderedFeaturesInRect(
    //   //   this.getBoundingBox(screenCoords),
    //   //   null,
    //   //   ['nycFill']
    //   // );

    //   const bboxxx = this.getBoundingBox(screenCoords)
    //   console.log('|=== onPress ===| bboxxx : ', bboxxx)

    //   this._map.queryRenderedFeaturesInRect(bboxxx, null, ['all-point', 'filtered-point'])
    //   .then((result) => {
    //     console.log('|=== onPress ===| queryRenderedFeaturesInRect : ', result)
    //   })

    //   this.setState({
    //     screenCoords: [],
    //   });
    // } else {
    //   this.setState({ screenCoords: screenCoords });
    // }
  }

  async getPointInView(coords) {
    const pointInView = await this._map.getPointInView(coords)

    console.log('pointInView : ', pointInView)

    return pointInView
  }

  setSelectedFeature = (selectedFeature) => {
    this.setState({
      selectedFeature
    })
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

  // DOINGG:
  createCircleRadius = () => {
    const { userLocation } = this.state
    const circleRadius = circle(userLocation, NEARME_RADIUS, { properties: { id: 'nearme-polygon' } })
    console.log('circleRadius : ', circleRadius)
    this.setState({
      circleRadius
    })
  }

  // DOINGGG:
  // findNearme = (bounds) => {
  async findNearme(bounds) {
    console.log('|=== findNearme ===| bounds : ', bounds)

    // let coordsNE = undefined
    // let coordsSW = undefined
    // this.getPointInView(bounds[0]).then((point) => coordsNE = point)
    // this.getPointInView(bounds[1]).then((point) => coordsSW = point)

    // const coordsNE = await this.getPointInView(bounds[0])
    // const coordsSW = await this.getPointInView(bounds[1])

    // console.log('|=== findNearme ===| coordsNE : ', (coordsNE))
    // console.log('|=== findNearme ===| coordsSW : ', (coordsSW))

    // const pointNE = (turf.point(bounds[0]))
    // const pointSW = (turf.point(bounds[1]))

    // console.log('|=== findNearme ===| pointNE : ', (pointNE.geometry.coordinates))
    // console.log('|=== findNearme ===| pointSW : ', (pointSW.geometry.coordinates))

    const featureCollection = turf.featureCollection([
      turf.point(bounds[0]),
      turf.point(bounds[1])
    ])

    console.log('|=== findNearme ===| featureCollection : ', featureCollection)

    const truncateFeature = truncate(featureCollection)

    console.log('|=== findNearme ===| truncateFeature : ', truncateFeature)

    const coords = coordAll(truncateFeature)

    console.log('|=== findNearme ===| coords : ', coords)

    const screenCoordsNE = await this.getPointInView(coords[0])
    const screenCoordsSW = await this.getPointInView(coords[1])

    // console.log(`|=== findNearme ===| screenCoordsNE : ${screenCoordsNE}\nscreenCoordsSW : ${screenCoordsSW}`)
    console.log('|=== findNearme ===| screenCoordsNE : ', screenCoordsNE, '\nscreenCoordsSW : ', screenCoordsSW)

    const boundingBox = this.getBoundingBox([screenCoordsNE, screenCoordsSW])
    console.log('|=== findNearme ===| boundingBox : ', boundingBox)

    this._map.queryRenderedFeaturesInRect(boundingBox, null, ['all-point', 'filtered-point'])
    .then((result) => console.log('|=== findNearme ===| queryRenderedFeaturesInRect : ', result))

    // const boundingBox = this.getBoundingBox([pointNE.geometry.coordinates, pointSW.geometry.coordinates])
    // const boundingBox = [pointSW.geometry.coordinates[1], pointSW.geometry.coordinates[0], pointNE.geometry.coordinates[1], pointNE.geometry.coordinates[0]]
    // const boundingBox = [736, 413.99, 1.30, 5.18]


    // const featureCollection = turf.featureCollection([
    //   turf.point(bounds[0]),
    //   turf.point(bounds[1])
    // ])

    // const bboxx = bbox(featureCollection)
    // console.log('|=== findNearme ===| bboxx : ', bboxx)

    // DOING:
    // const boundingBox = bbox(turf.featureCollection([pointNE, pointSW]))

    // console.log('|=== findNearme ===| boundingBox : ', (boundingBox))

    // this._map.queryRenderedFeaturesInRect(boundingBox)
    // .then((result) => console.log('|=== findNearme ===| queryRenderedFeaturesInRect : ', result))

  }

  getBoundingBox = (screenCoords) => {
    const maxX = Math.max(screenCoords[0][0], screenCoords[1][0]);
    const minX = Math.min(screenCoords[0][0], screenCoords[1][0]);
    const maxY = Math.max(screenCoords[0][1], screenCoords[1][1]);
    const minY = Math.min(screenCoords[0][1], screenCoords[1][1]);
    return [maxY, maxX, minY, minX];
  }

  // DOINGG:
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

  // DOING:
  renderSnapshotImage = () => {
    const { snapshotURI } = this.state
    return (
      <View style={{ flex: 1, backgroundColor: 'rosybrown', alignItems: 'center', justifyContent: 'center' }}>
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

  // DOING:
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

    console.log('selected Feature : ', selectedFeature)



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

  render() {
    const { allpointOpacity, filter, selectedFeature, userLocation, circleRadius } = this.state

    return (
      <View style={styles.container}>
        <MapboxGL.MapView
          ref={(ref) => this._map = ref}
          style={styles.mapContainer}
          showUserLocation={true}
          //userTrackingMode={MapboxGL.UserTrackingModes.Follow}
          //styleURL={'http://172.16.16.23:1111/getMapStyle'}
          styleURL={MAP_STYLE_URL}
          //centerCoordinate={[100.5314, 13.7270]}
          centerCoordinate={userLocation}
          zoomLevel={13}
          logoEnabled={false}
          onPress={this.onPressMap}
          onUserTrackingModeChange={(response) => console.log('onUserTrackingModeChange : ', response)}
          onRegionDidChange={this.onRegionDidChange}
        >
          {this.renderUserCurrentLocationRadius()}
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

        </MapboxGL.MapView>
        {this.renderFilterButton({ text: FILTER_ALL, left: 20 })}
        {this.renderFilterButton({ text: FILTER_BKK, left: 80 })}
        {this.renderFilterButton({ text: FILTER_SPK, left: 140 })}
        {this.renderFilterButton({ text: FILTER_CNX, left: 200 })}
        {/* {this.renderSnapshotImage()} */}
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
    circleRadius: 15,
  },
});

const fillStyle = MapboxGL.StyleSheet.create({
  radius: {
    fillColor: 'lightblue',
    fillOpacity: 0.5
  }
})