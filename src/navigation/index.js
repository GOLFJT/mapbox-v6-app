import React from 'react'
import {
  TouchableOpacity,
  Text,
  Button,
} from 'react-native'
import { StackNavigator } from 'react-navigation'

import FullMapView from '../FullMapView'
import Home from '../Components/screen/Home'

const AppWithNavigation = StackNavigator({
  Home: {
    screen: Home,
  },
})

export default AppWithNavigation