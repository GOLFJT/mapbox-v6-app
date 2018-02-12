import React from 'react'
import {
  TouchableOpacity,
  Text,
  Button,
} from 'react-native'
import { StackNavigator } from 'react-navigation'

import FullMapView from '../FullMapView'
import Home from '../Home'

const AppWithNavigation = StackNavigator({
  Home: {
    screen: Home,
  },
})

export default AppWithNavigation