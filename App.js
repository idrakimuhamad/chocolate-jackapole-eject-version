import React, { Component } from 'react';
import {
  Platform,
  ActivityIndicator,
  StatusBar,
  View,
  Text,
  StyleSheet,
  ListView,
  ScrollView,
  Image,
  TouchableHighlight,
  Modal,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import getList from './api/getList';

const window = {
  width: Dimensions.get('window').width,
  height: Dimensions.get('window').height,
};

export default class App extends Component {

  // the app default state
  // redux wasn't implemented due to the time constraint
  state = {
    appIsReady: false,
    pageNumber: 1,
    pageSize: 10,
    dataSource: new ListView.DataSource({
      rowHasChanged: this._rowHasChanged.bind(this)
    }),
    lists: [],
    modalVisible: false,
    loadMore: false,
    endOfList: false
  };

  componentWillMount() {
    // load the initial list
    this._getList(true);
  }

  // the function that call the api to load the list by its pagination
  _getList(initialAppLoad = false) {
    const { pageSize, pageNumber, lists } = this.state;
    getList({ size: pageSize, page: pageNumber })
    .then((response) => {

      // if no error
      if (!response.Errors.length) {

        // if the result array actually contained something,
        // we merge it with existing list and create the data source with it
        if (response.Result.length) {
          const tempList = [ ...lists, ...response.Result];
          const dataSource = this.state.dataSource.cloneWithRows(tempList);
          const stateObj = {
            dataSource,
            pageNumber: pageNumber + 1,
            lists: tempList,
            loadMore: false
          };

          // only set this when initial app load
          if (initialAppLoad) stateObj.appIsReady = true;

          this.setState(stateObj);

          console.log('getting list done');
        } else {
          console.log('Reached end of the list');

          // when we reached the end of the list
          this.setState({
            endOfList: true
          });
        }
      } else {
        console.error('Error in retrieving the list', response.Errors[0]);
      }
    });
  }

  // fetch more data when reaching the end of the list
  _loadMore = async () => {
    const { endOfList } = this.state;

    console.log('trigger load more');

    this.setState({ loadMore: true });

    // as long as end of list aren't marked as true,
    // keep loading new data
    if (!endOfList) this._getList();
  }

  // compare between data row to see if the row has changed
  _rowHasChanged(r1, r2) {
    return r1.AlbumName !== r2.AlbumName;
  }

  // render function for each of the row
  _renderRow = (item) => {
    return (
      <TouchableHighlight
        onPress={() => {
          this._renderImageGallery(item.Images)
        }}>
        <View>
          <View
            style={styles.row}>
            <Image
              style={styles.thumb}
              source={{uri: item.AlbumCover}}
            />
            <Text
              style={styles.albumName}>
              {item.AlbumName}
            </Text>
          </View>
        </View>
      </TouchableHighlight>
    );
  }

  // helper to render the separator for each rows
  _renderSeparator(sectionID, rowID, adjacentRowHighlighted) {
    return (
      <View
        key={`${sectionID}-${rowID}`}
        style={{
          height: adjacentRowHighlighted ? 4 : 1,
          backgroundColor: adjacentRowHighlighted ? '#3B5998' : '#CCCCCC',
        }}
      />
    );
  }

  // function that set the images from the selected album as the image gallery
  _renderImageGallery(images) {
    this._setModalState(true);

    this.setState({
      currentImageGallery: images
    });
  }

  // helper that render each of the image from an album in the image gallery
  _renderImageInGallery(image) {
    return (
      <Image
        key={image.ContentURL}
        source={{ uri: image.ContentURL }}
        style={styles.imageGallery}
        resizeMode="contain" />
    );
  }

  // set up the state of the modal
  _setModalState(visible) {
    this.setState({ modalVisible: visible });
  }

  render() {
    const {
      appIsReady,
      lists,
      currentImageGallery,
      loadMore,
      endOfList
    } = this.state;

    // if the app is ready eg. once we finished with our APIs loading,
    // show the whole main page
    // else show the loading screen
    if (appIsReady) {
      return (
        <View
          style={styles.container}>
          <ListView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            onEndReached={this._loadMore}
            onEndReachedThreshold={30}
            dataSource={this.state.dataSource}
            renderRow={this._renderRow}
            renderSeparator={this._renderSeparator}
          />
          {loadMore ?
            <View
              style={styles.loadingIndicator}>
              <View>
                {endOfList ?
                  <Text style={styles.loadingIndicatorText}>You have reached the end of the list</Text>
                  :
                  <View style={styles.loadingIndicatorContainer}>
                    <ActivityIndicator
                      animating={loadMore}
                      style={styles.centering}
                      size="small"
                    />
                    <Text
                      style={styles.loadingIndicatorText}>Loading...</Text>
                    </View>
                }
              </View>
            </View>
            : null}
          <Modal
            animationType={"slide"}
            transparent={false}
            visible={this.state.modalVisible}
            onRequestClose={() => {alert("Modal has been closed.")}}
            >
           <View style={styles.imageGalleryContainer}>
            <View>
              <ScrollView
                contentContainerStyle={styles.imageGalleryVerticalContainer}
                pagingEnabled
                directionalLockEnabled
                horizontal
                >
                {currentImageGallery && currentImageGallery.map((image) => this._renderImageInGallery(image))}
              </ScrollView>
            </View>
            <TouchableHighlight
              style={styles.closeModal}
              onPress={() => {
                this._setModalState(!this.state.modalVisible)
              }}
              activeOpacity={0.5}
              underlayColor="transparent"
              >
              <Icon name="ios-close" size={42} color="rgba(255,255,255, .75)" />
            </TouchableHighlight>
           </View>
          </Modal>
        </View>
      )
    } else {
      return (
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <Image
              style={styles.loadingIcon}
              source={{ uri: 'https://s3.amazonaws.com/exp-brand-assets/ExponentEmptyManifest_192.png' }}
            />
            <ActivityIndicator
              animating={true}
              style={styles.centering}
              size="large"
            />
          </View>
        </View>
      )
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: window.height
  },
  loadingIcon: {
    width: 60,
    height: 60,
    marginBottom: 24
  },
  contentContainer: {
    paddingTop: (Platform.OS === 'ios') ? 20 : 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F6F6F6',
  },
  thumb: {
    width: 64,
    height: 64,
  },
  albumName: {
    flex: 1,
    marginLeft: 20
  },
  imageGalleryContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0, .88)'
  },
  imageGalleryVerticalContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: window.height
  },
  imageGallery: {
    width: window.width,
    height: window.width / 2
  },
  closeModal: {
    position: 'absolute',
    top: 20,
    right: 20
  },
  loadingIndicator: {
    position: 'absolute',
    bottom: 0,
    padding: 20,
    flex: 1,
    backgroundColor: 'rgba(255,255,255, 0.77)',
    width: window.width
  },
  loadingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingIndicatorText: {
    textAlign: 'center'
  },
  centering: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    height: 40
  },
});
