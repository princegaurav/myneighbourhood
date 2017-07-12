/*global google,Promise,$,ko */
var mapManager = (function () {
    "use strict";

    //This is my Map Manager module - it can create and manage multiple google maps
    //When you create a map using it, it will return a map id, and you should use that map id to
    //do various operations on the map

    var Maps = [], //array to store maps
        nextMapId = 0; //Index for creating and storing new maps in Maps array

    //create a new Google Map
    function createMap(mapElement, centerPosition, zoomLevel) {

        if (mapElement === null) {
            console.log("Error: No element provided to attach the map. Map cannot be created");
            return;
        }

        var cPosition = centerPosition || {lat: 22.572645, lng: 88.363892},
            zLevel = zoomLevel || 12,
            map = new google.maps.Map(mapElement, {
                zoom: zLevel,
                center: cPosition
            });

        nextMapId = nextMapId + 1;
        Maps[nextMapId] = map;

        return nextMapId;
    }

    //add marker to a map
    function addMarker(mapId, place) {
        var map = Maps[mapId],
            pos = {},
            title = place.displayname,
            marker;

        pos.lat = place.lat;
        pos.lng = place.lng;

        marker = new google.maps.Marker({
            position: pos,
            map: map,
            title: title
        });

        return marker;
    }

    //set the marker on map
    function setMarkerOnMap(mapId, marker) {

        if (mapId === null) {
            marker.setMap(null);
        } else {
            var map = Maps[mapId];
            marker.setMap(map);
        }
    }

    //return the exposed functions
    return {
        createMap: createMap,
        addMarker: addMarker,
        setMarkerOnMap: setMarkerOnMap
    };

}()); //End Map Manager module

//====================================================================
//Main JS
//====================================================================

(function () {
    "use strict";

    var myMap, infowindow;

    //Get details from Wikipedia API when a search string is passed to it
    //Returns a Promise object representing result from Wikipedia
    function getWikiData(searchFor) {

        var wikipediaAPILink = "https://en.wikipedia.org/w/api.php?format=json" +
                "&action=query&prop=extracts&exintro=&explaintext=" +
                "&titles=";

        wikipediaAPILink = wikipediaAPILink + encodeURI(searchFor);

        /* Cross Origin Resource Sharing implemented */
        return Promise.resolve($.ajax({
            url: wikipediaAPILink,
            type: "POST",
            crossDomain: true,
            dataType: "jsonp",
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Content-Type", "text/plain");
                xhr.setRequestHeader("Access-Control-Request-Headers", "X-Requested-With");
                xhr.withCredentials = true;
            }
        }));

    }

    //Creates content for and displays the infowindow, when a marker on the map is clicked.
    function setInfoWindow() {
        /*jshint validthis:true */
        //This funtion will always be called using bind call, hence this would be properly set

        var me, infoHead, infoImgSrc, infoBrief, searchFor, imgsrc, wikiData, stopAnimation, stopAnimationFn;

        me = this;

        //Zoom the map and center on marker
        me.marker.get("map").setCenter(me.marker.getPosition());

        //Animate marker start
        me.marker.setAnimation(google.maps.Animation.BOUNCE);
        me.marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');

        stopAnimation = function () {
            me.marker.setAnimation(null);
            me.marker.setIcon();
        };

        stopAnimationFn = stopAnimation.bind(me);

        //stop animation after 5 sec
        setTimeout(stopAnimationFn, 5000);

        //set content for info window
        infoHead = me.displayname;
        searchFor = me.name;

        //generate name for image file of the place
        imgsrc = this.displayname.replace(/[^a-z\d]+/gi, "").toLowerCase();
        infoImgSrc = "img/" + imgsrc + ".jpg";

        //Call Wikipedia API to get result, returns a Promise
        wikiData = getWikiData(searchFor);

        //get data Promise
        wikiData.then(function (data) {

            var infoWiki, pages, page, contentString;

            infoWiki = '';

            pages = data.query.pages;

            for (page in pages) {
                if (pages.hasOwnProperty(page)) {
                    infoWiki = infoWiki + pages[page].extract;
                    break;
                }
            }

            infoBrief = infoWiki;

            //Content string for the info window
            contentString = '<div class="infodata">' +
                '<img class="info-img" src="' + infoImgSrc + '" />' +
                '<h2 class="info-head">' + infoHead + '</h2>' +
                '<p class="info-source">Source: Wikipedia</p>' +
                '<p class="info-brief">' + infoBrief + '</p>' +
                '</div>';

            //Display info window, and close any previous infowindow
            infowindow.close();

            infowindow.setContent(contentString);

            infowindow.open(me.marker.get("map"), me.marker);

        })
        .catch(function (error) {

            console.log("Request Failed for Wikipedia: " + error);
            alert("Error in processing: " + error);

            infoBrief = "Unable to get data from Wikipedia >>> Request Failed";

            var contentString = '<div class="infodata">' +
                '<img class="info-img" src="' + infoImgSrc + '" />' +
                '<h2 class="info-head">' + infoHead + '</h2>' +
                '<p class="info-source">Source: Wikipedia</p>' +
                '<p class="info-brief">' + infoBrief + '</p>' +
                '</div>';

            //Display info window, and close any previous infowindow
            infowindow.close();

            infowindow.setContent(contentString);

            infowindow.open(me.marker.get("map"), me.marker);
        });

    }

    //Location constructor function
    function Location (name, display, lat, lng, type, mark) {
        this.name = name;
        this.displayname = display;
        this.lat = lat;
        this.lng = lng;
        this.type = type;
        this.marker = mark;
        this.amIVisible = ko.observable(1);
    }

    //Knockout ViewModel constructor
    function AppViewModel() {
        var self = this, placesData;

        self.places = ko.observableArray([]);
        self.dropdownOptions = ko.observableArray(["All", "Architecture", "Park", "Shrine"]);
        self.selectedDDValue = ko.observable('');
        self.inputSearchFilter = ko.observable('');

        self.filteredPlaces = ko.computed(function () {
            var filter1 = self.selectedDDValue(),
                filter2 = self.inputSearchFilter(),
                filteredData = [];

            /* Filter based on Drop down value */
            if (!filter1 || filter1 === "All") {
                self.places().forEach(function (i) {
                    mapManager.setMarkerOnMap(myMap, i.marker);
                });
                filteredData = self.places();
            } else {
                filteredData = ko.utils.arrayFilter(self.places(), function (i) {
                    if (i.type === filter1) {
                        mapManager.setMarkerOnMap(myMap, i.marker);
                    } else {
                        mapManager.setMarkerOnMap(null, i.marker);
                    }

                    return i.type === filter1;
                });
            }

            /* Filter based on Search Bar value */
            if (!filter2 || filter2 === "") {
                filteredData.forEach(function (i) {
                    mapManager.setMarkerOnMap(myMap, i.marker);
                });
                return filteredData;
            } else {
                return ko.utils.arrayFilter(filteredData, function (i) {
                    if (i.displayname.search(filter2) >= 0) {
                        mapManager.setMarkerOnMap(myMap, i.marker);
                    } else {
                        mapManager.setMarkerOnMap(null, i.marker);
                    }

                    return (i.displayname.search(filter2) >= 0);
                });
            }
        });

        placesData = $.getJSON("places.json");

        //get data
        placesData.done(function (data) {

            data.places.forEach(function (item) {

                var locationMarker, locationData;

                locationMarker = mapManager.addMarker(myMap, item);
                locationData = new Location(item.name,
                        item.displayname,
                        item.lat,
                        item.lng,
                        item.type,
                        locationMarker
                       );

                locationMarker.addListener('click', setInfoWindow.bind(locationData));

                self.places.push(locationData);
            });
        })
        .fail(function (jqxhr, textStatus, error) {
            var err = textStatus + ", " + error;
            console.log("Request Failed: " + err);
            alert("Unable to json file containing places of interest.");
        });

        //click on places buttons - animate markers ans show info window
        self.showMarker = function () {

            setInfoWindow.call(this);
        };

    }

    //Initialize Google Maps
    function initMap() {
        //Add Kolkata as my Neighbourhood on the map
        var kolkata = {lat: 22.572645,
                       lng: 88.363892,
                       displayname: "Kolkata - My Neighbourhood",
                       name: "Kolkata"},
            mainMarker;

        myMap = mapManager.createMap(document.getElementById("map"), kolkata);
        mainMarker = mapManager.addMarker(myMap, kolkata);

        mainMarker.addListener("click", setInfoWindow.bind(kolkata));

        mainMarker.setIcon("http://maps.google.com/mapfiles/ms/icons/green-dot.png");
        kolkata.marker = mainMarker;

        infowindow = new google.maps.InfoWindow();
        infowindow.addListener('closeclick', function() {
            mainMarker.get("map").panTo(mainMarker.getPosition());
        });

        // Activates knockout.js
        ko.applyBindings(new AppViewModel());
    }

    // This function is called when Google map fails to load
    function errorLoadingMap() {
        console.log("Error in loading Google Maps !!!");
        alert("Error in loading Google maps");
    }

    //expose global functions
    window.initMap = initMap;
    window.errorLoadingMap = errorLoadingMap;

}()); //IIFE end
