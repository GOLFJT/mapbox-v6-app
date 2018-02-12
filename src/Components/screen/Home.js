import React, { Component }  from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native'

import MapView from '../MapView'

const MODE = {
  MAP: 'Map',
  LIST: 'List',
}

const MAP_STYLE_URL = 'https://mapgl.mapmagic.co.th/getstyle/mapmagic_th'

export default class Home extends Component {
  // Navigation Config
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;

    console.log('params : ', params)
    
    return {
      title: params ? params.title : '',
      headerRight: params ? params.headerRight : '',
    }
  }

  // Initial State
  state = {
    navTitle: MODE.MAP,
    userLocation: undefined,
  }

  // Lifecycle
  constructor(props) {
    super(props)
    this.setNavTitle()
  }

  setNavTitle = () => {
    const { setParams } = this.props.navigation
    const { navTitle } = this.state

    setParams({ 
      title: navTitle, 
      headerRight: navTitle === MODE.MAP ? this.headerButton(MODE.LIST) : this.headerButton(MODE.MAP)
    })
  }

  headerButton = (title) => {
    return(
      <TouchableOpacity onPress={this.toggleHeaderTitle}>
        <Text>{title}</Text>
      </TouchableOpacity>
    )
  }

  toggleHeaderTitle = () => {
    const { navTitle } = this.state
    let title = navTitle
    
    switch(navTitle) {
      case MODE.MAP:
        title = MODE.LIST
        break
      case MODE.LIST:
        title = MODE.MAP
        break
      default:
        title = MODE.MAP   
    }

    console.log('toggleHeaderTitle : ', title)

    this.setState({
      navTitle: title,
    }, () => {
      this.setNavTitle()
    })
  }

  // DOINGG:
  onUserLocationChange = (res, err) => {
    console.log('== onUserLocationChange == : ', res)
    this.setState({
      userLocation: [res.longitude, res.latitude],
    })
  }

  // DOING:
  render() {
    const { userLocation } = this.state
    return(
      <View style={styles.container}>
        <MapView
          styleURL={MAP_STYLE_URL}
          zoomLevel={12}
          logoEnabled={false}
          centerCoordinate={userLocation}
          showUserLocation={true}
          onUserLocationChange={this.onUserLocationChange}
          onVisibleFeaturesChange={(visibleFeatures) => console.log('visibleFeatures : ', visibleFeatures)}
          userLocation={userLocation}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'coral',
    // justifyContent: 'center',
    // alignItems: 'center',
  }
})

// Home.navigationOptions = {
//   // title: this.state.navTitle
//   title: this.state.navTitle
// }