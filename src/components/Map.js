import React from 'react';
import '../css/map.css';
import sushi from '../img/sushi.svg';
import new_sushi from '../img/new_sushi.svg';
import here from '../img/here.svg';
import importedMapStyle from './mapstyle.json'
import {Header, Modal, Symbol} from './Elements.js';
import {NewPlaceForm} from './Forms.js';

class Map extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      APIKey: 'AIzaSyCmX-3F5SG5M8xs3OLWjyIjEZrDHt-9bo0',
      displayModal: false,
      newPlacePosition: undefined
    };
    this.newMarker = this.newMarker.bind(this);
    this.generateMarkers = this.generateMarkers.bind(this);
    this.showInfoWindow = this.showInfoWindow.bind(this);
    this.closeInfoWindow = this.closeInfoWindow.bind(this);
    this.initMap = this.initMap.bind(this);

    window.initMap = this.initMap;
    // empty map reference
    this.map = undefined;
    // Visitor's position marker
    this.myMarker = undefined;
    // new place marker
    this.newPlaceMarker = undefined;
    // markers array
    this.markers = [];
    // Info window for markers
    this.infoWindow = undefined;
  }

  componentDidMount () {
    // Load and inject Google JavaScript API with Google Places library
    // into index.html and when done run the callback function initMap()
    this.loadJS("https://maps.googleapis.com/maps/api/js?key=" + this.state.APIKey + "&callback=initMap&libraries=places");
  };

  componentWillReceiveProps (nextProps) {
    let refreshMarkers = true;
    // Check if new props.list differs from current props.list and decide to refresh markers
    if (nextProps.list.length === this.props.list.length) {
      refreshMarkers = nextProps.list.some((place, i) => place.place_id !== this.props.list[i].place_id);
    } else this.props.updateFilteredList(this.filterListInMapBounds(nextProps.list));

    // Create and display markers if Content.state.list updates
    if (refreshMarkers) {
      this.generateMarkers(nextProps.list, this.map, this.infoWindow);
    }

    // Center map on newly selected currentPlace
    if (nextProps.currentPlace) if (this.props.currentPlace !== nextProps.currentPlace) {
      this.map.panTo(nextProps.currentPlace.location);
      this.showPlaceInfo(nextProps.currentPlace);
    }
  }


  // Inject src script into index.html
  loadJS (src) {
    let ref = window.document.getElementsByTagName("script")[0];
    let script = window.document.createElement("script");
    script.src = src;
    script.async = true;
    ref.parentNode.insertBefore(script, ref);
  }

  // Hide Modal with form Add New Place
  hideModal = () => {
    this.setState({
      displayModal: false
    })
  }

  // Display Modal with form Add New Place
  showModal = () => {
    this.setState({
      displayModal: true
    })
  }

  // Hides marker
  hideMarker = (marker) => {
    marker.setVisible(false);
  }

  // Show marker on map
  showMarker = (marker) => {
    marker.setVisible(true);
  }

  // Set new place position
  setNewPlacePosition = (val) => {
    this.setState({
      newPlacePosition: val
    })
  }

  // Define clickable content fo Info Window
  placeInfoWindowContent (place, handler) {
    // Set content for info window
    const contentInfo = document.createElement('div');
    contentInfo.innerHTML = `<div class="infoName">${place.name}</div>
    <div class="stars">Rating: ${place.rating}</div>`;

    // Add listener to display place Info onClick
    contentInfo.addEventListener('click', handler);

    return contentInfo;
  }

  // Shows info window with event click listener displaying place info
  showInfoWindow (content, position) {
    // Update content of infoWindow
    this.infoWindow.setContent(content);
    // Display infoWindow
    this.infoWindow.setPosition(position);
    this.infoWindow.setOptions({pixelOffset: {width:0, height:-30}});
    this.infoWindow.open(this.map);
  }

  // Close info window
  closeInfoWindow () {
    if (this.infoWindow) this.infoWindow.close();
  }

  // Show window and marker on new place click
  showPlaceInfo (place) {
    // set position for click event
    const position = place.location;

    // Create and show info window
    this.showInfoWindow (this.placeInfoWindowContent(place, () => this.props.handlePlaces(place)), position);
  }

  newMarker (map, parameters, ...eventHandlingObjects) {
    // prevent "no google object" error from create-react-app parser
    const google = window.google;

    // Create marker from props.list
    const newMarker = new google.maps.Marker(parameters);

    // Add handlers if specified
    if (eventHandlingObjects) eventHandlingObjects.map((object) =>
      newMarker.addListener(object.event, object.handler));

    return newMarker
  }

  // Initializes visitors position marker
  setMyMarker = (position) => {
    // set marker parameters
    const markerParameters = {
      position: position,
      title: 'You are here',
      background: 'red',
      map: this.map,
      icon: {
        url: here,
        scaledSize: {
          width: 32,
          height: 32
        }
      }
    };
    // create and show marker for visitor's position
    this.myMarker = this.newMarker (this.map, markerParameters);
  }

  // Initializes new place marker
  setNewPlaceMarker = (position) => {
    // set marker parameters
    const markerParameters = {
      position: position,
      title: 'Add new place',
      icon: {
        url: new_sushi,
        scaledSize: {
          width: 50,
          height: 50
        }
      },
      map: this.map
    };
    // create and show marker for new place attempt
    this.newPlaceMarker = this.newMarker (this.map, markerParameters);
  }

  updateNewPlaceMarker = (position) => {
    this.newPlaceMarker.setPosition(position);
  }

  // Handle new place modal window with input fields
  newPlaceModal = (position) => {
    this.setNewPlacePosition(position);
    this.showModal();
  }

  // Put new place data into places list
  addNewPlace = (name, address, rating) => {
    this.hideModal();
    const place = {
      location: this.state.newPlacePosition,
      name: name,
      place_id: name + (Math.random() * 1000000),
      address: address,
      rating: rating,
      reviews: []
    }
    this.props.handlePlaces(place);
  }

  setNewPalceCursor = () => {
    this.map.setOptions({draggableCursor: 'crossHair'});
  }

  resetNewPlaceCoursor = () => {
    this.map.setOptions({draggableCursor: ''});
  }

  removeGoogleListener = (eventListener) => {
    // prevent "no google object" error from create-react-app parser
    const google = window.google;
    if (eventListener) google.maps.event.removeListener(eventListener);
  }

  resetNewPlaceAction = () => {
    this.hideMarker(this.newPlaceMarker);
    this.closeInfoWindow();
    this.resetNewPlaceCoursor();
  }

  // Set content for new place info window
  newPlaceinfoWindowContent (position) {
    // Define content of info window
    const content = document.createElement('div');
    // set content link and listener on click
    content.innerHTML = '<a href="#">Add new place</a> <br />lat: ' + Math.floor(position.lat * 10000)/10000 + '<br />lng: ' + Math.floor(position.lng * 10000)/10000;
    content.addEventListener('click', (e) => {
      e.preventDefault();
      // On click hide infoWindow and marker
      this.closeInfoWindow();
      this.hideMarker(this.newPlaceMarker);
      // Handle input for new place
      this.newPlaceModal(position);
    });

    return content;
  }

  // Show window and marker on new place click
  showNewPlaceInfo (e) {
    // set position for click event
    const position = {lat: e.latLng.lat(), lng: e.latLng.lng()};

    // Show newPlaceMarker inn new position
    this.updateNewPlaceMarker(position);
    this.showMarker(this.newPlaceMarker);

    // Create and show info window
    this.showInfoWindow (this.newPlaceinfoWindowContent(position), position);
    // Add listener to remove new place marker while info window closes
    const closeClick = this.infoWindow.addListener('closeclick', (e) => {
      this.resetNewPlaceAction();
      this.removeGoogleListener(closeClick)
    });
  }

  // Add global listeners for Listing item to reset new place action on click
  hideNewPlaceLiEvents = () => {
    let list = document.getElementById('list').getElementsByTagName('li');
    for (var i = 0; i < list.length; i++) {
      list[i].addEventListener('click', this.resetNewPlaceAction);
    }
  }

  // Create and add markers to map
  generateMarkers (places, map, infoWindow) {
    if (!map) return console.log('Google maps hasn\'t intialize yet, be patient... Thank You!');
    // Initialize and purge marker array
    this.markers.map((marker) => marker.setMap(null));
    this.markers = [];
    // Create markers
    places.map((place) => {
      // Set parameters for Google Marker
      const markerParameters = {
        position: place.location,
        title: place.name,
        icon: {
          url: sushi,
          scaledSize: {
            width: 50,
            height: 50
          }
        },
        map: map
      };
      // Set handler for place (display apropriate restaurant)
      const placeHandler = (e) => this.props.handlePlaces(place);
      // Set event handlers for marker
      const eventHandlingObjects = [
        // Single click displays current infoWindow
        {
          event: 'click',
          handler: (e) => {
            // Show info window
            this.showInfoWindow(this.placeInfoWindowContent(place, placeHandler), markerParameters.position);
            // Hide new place marker
            this.hideMarker(this.newPlaceMarker);
          }
        },
        // Double click displays place details
        {
          event: 'dblclick',
          handler: placeHandler
        }
      ];

      // Create marker from props.list
      const newMarker = this.newMarker(map, markerParameters, ...eventHandlingObjects);

      // Remember place to which marker refers
      newMarker.place = place;

      this.markers.push(newMarker);
      return true;
    });
  }

  // Position map on visitor location
  geolocationMap = (map) => {
    // Use visitor geolocation if browser suppoerts it
    if (navigator.geolocation) {
      const result = navigator.geolocation.getCurrentPosition((position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        map.panTo(pos);

        this.setMyMarker (pos);
        this.setNewPlaceMarker (pos);
        this.hideMarker(this.newPlaceMarker);

        return pos;
      });
      return result;
    }
    return undefined;
  }

  // Check if given coordinates fits in map getBounds
  filterListInMapBounds = (list) => {
    let googleMapBounds;
    if (this.map) googleMapBounds = this.map.getBounds();
    if (googleMapBounds) {
      let inMapBoundList = [];
      list.map((place) => {
        if (googleMapBounds.contains(place.location)) inMapBoundList.push(place);
        return undefined;
      });
      return inMapBoundList;
    } else {
      return this.props.list;
    }
  }

  // Named function for bounds_changed listener
  updateFilteredListInMapBounds = () => {
   this.props.updateFilteredList(this.filterListInMapBounds(this.props.list));
  }


  // Get search results for sushi in nearby location
  sushiSearch = (map) => {
    // prevent "no google object" error from create-react-app parser
    const google = window.google;

    // Search Google Places by given parameters and call to callback function storePLaces()

    const searchRequest = {
      bounds: map.getBounds(),
      name: 'sushi',
      type: 'restaurant'
    }

    let service = new google.maps.places.PlacesService(map);
    let myList = service.nearbySearch(searchRequest, (response) => {
      const list = response.map((el) => {
        const place = {
          location: {
            lat: el.geometry.location.lat(),
            lng: el.geometry.location.lng()
          },
          name: el.name,
          place_id: el.place_id,
          rating: el.rating,
          address: el.vicinity
        }
        return place;
      });
      this.props.handlePlaces(list);
      return myList;
    });
  }

  // Initialize Google Map,
  // Style Google Map,
  // Pass this.map reference to parent component
  // Generate refreshMarkers
  // Center map on current position
  initMap () {
    // prevent "no google object" error from create-react-app parser
    const google = window.google;

    const mapParameters = {
      zoomControl: true,
      streetViewControl: false,
      scaleControl: true,
      mapTypeControl: false,
      center: {
        lat: 52.2351118,
        lng: 21.0352136
      },
      zoom: 14,
      mapTypeControlOptions: {
        mapTypeIds: ['roadmap', 'darkMap']
        }
    }

    // Initialize google map in HTML element with ref='map'
    this.map = new google.maps.Map(this.refs.map, mapParameters);

    // Style Map
    const newMapStyle = new google.maps.StyledMapType(importedMapStyle);
    this.map.mapTypes.set('darkMap', newMapStyle);
    this.map.setMapTypeId('darkMap');

    // Center map and show user
    this.geolocationMap(this.map);

    // Create infoWindow with initial value of first place on the list
    this.infoWindow = new google.maps.InfoWindow();


    // Create markers
    this.generateMarkers(this.props.list, this.map, this.infoWindow);

    //Update parent component Content state.map reference
    this.props.updateMap(this.map);

    // Add listner for zooming and panning to update filtered places list visible on map
    google.maps.event.addListener(this.map, 'bounds_changed', this.updateFilteredListInMapBounds);
  }

  render () {
    let modalNewPlace = null;
    let addNewPlaceSymbol = null;
    let refreshSymbol = null;

    if (!this.props.displayPlace && this.map) {
      addNewPlaceSymbol = <Symbol className="plus" id="plus" handler={() => {
        // Set coursor to crosshair
        this.setNewPalceCursor();
        // Add listner for adding new restaurant on click on the map
        let newPlaceClickListener = this.map.addListener('click', (e) => {
          // Remove listner for adding new restaurant on click on the map
          this.showNewPlaceInfo(e);
          // Reset coursor
          this.resetNewPlaceCoursor();
          // remove click listener on map
          newPlaceClickListener.remove();
          // set listeners for list items to rmeove
          this.hideNewPlaceLiEvents();
        });
      }}
      alt="Add new sushi restaurant" />;
      refreshSymbol = <Symbol className="refresh" id="refresh" handler={() => {
        // Search nearby and update places list
        this.sushiSearch(this.map);
      }}
      alt="Google search in this area" />;
    }
    else
      addNewPlaceSymbol = null;

    if (this.state.displayModal) modalNewPlace = (
      <Modal className='modal' handlerClose={this.hideModal} display={this.state.displayModal}>
        <NewPlaceForm id='newPlace' handler={this.addNewPlace} />
      </Modal>)
    else
      modalNewPlace = null;

    return (
      <div className={this.props.className}>
        <Header className="header">
          <h1>Sushi <br />Spotter</h1>
          {refreshSymbol}
          {addNewPlaceSymbol}
        </Header>
        <div id="map" ref="map">
          Loading Google Map...
        </div>
        {modalNewPlace}
      </div>
    );
  };
}

export default Map;
