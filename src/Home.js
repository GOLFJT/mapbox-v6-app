import React, { Component }  from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'

const MODE = {
  MAP: 'Map',
  LIST: 'List',
}

export default class Home extends Component {
  // Navigation Config
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;

    console.log('params : ', params)
    
    return {
      title: params ? params.title : '',
    }
  }

  // Initial State
  state = {
    navTitle: MODE.MAP
  }

  // Lifecycle
  constructor(props) {
    super(props)
    this.setNavTitle()
  }

  setNavTitle = () => {
    const { setParams } = this.props.navigation
    setParams({ title: this.state.navTitle })
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

  render() {
    return(
      <View style={styles.container}>
        <TouchableOpacity style={{width: 50, height: 50, backgroundColor: 'pink'}} onPress={this.toggleHeaderTitle}/>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'coral',
    justifyContent: 'center',
    alignItems: 'center',
  }
})

// Home.navigationOptions = {
//   // title: this.state.navTitle
//   title: this.state.navTitle
// }