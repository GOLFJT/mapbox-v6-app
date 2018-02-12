import React from 'react'
import { StackNavigator } from 'react-navigation'

import FullMapView from '../FullMapView'

const AppWithNavigation = StackNavigator({
  Home: {
    screen: FullMapView,
  }
})

export default AppWithNavigation