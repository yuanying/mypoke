function initialize() {
  var socket = io.connect();
  var encounterIds = {};
  var latlng = new google.maps.LatLng(35.643757,139.826647);
  var zoom = 18;
  var client = 'bulbasaur';
  var circles = {
    'bulbasaur': new google.maps.Circle({
      strokeColor: '#00FF00',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#00FF00',
      fillOpacity: 0.35,
      radius: 50
    }),
    'charmander': new google.maps.Circle({
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35,
      radius: 50
    }),
    'squirtle': new google.maps.Circle({
      strokeColor: '#0000FF',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#0000FF',
      fillOpacity: 0.35,
      radius: 50
    }),
  };

  if (localStorage) {
    var lat = parseFloat(localStorage.getItem('lat'));
    var lng = parseFloat(localStorage.getItem('lng'));
    var _zoom = parseInt(localStorage.getItem('zoom'));
    var _client = localStorage.getItem('client');
    if (lat && lng) {
      console.log('latlng');
      latlng = new google.maps.LatLng(lat,lng);
      console.log(latlng);
    }
    if (_zoom) {
      zoom = _zoom;
    }
    if (_client) {
      client = _client;
    }
  }
  var opts = {
    zoom: zoom,
    center: latlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  var map = new google.maps.Map(document.getElementById("mypoke"), opts);
  map.addListener('center_changed', function() {
    //console.log(map.getCenter());
    if(localStorage) {
      var center = map.getCenter();
      localStorage.setItem('lat', center.lat().toString());
      localStorage.setItem('lng', center.lng().toString());
    }
  });
  map.addListener('zoom_changed', function() {
    if(localStorage) {
      localStorage.setItem('zoom', map.getZoom().toString());
    }
  });
  var clientActive = function(active) {
    ['charmander', 'squirtle', 'bulbasaur'].forEach(function(value){
      if (value != active) {
        $('#' + value).removeClass('active');
      }
    });
    $('#' + active).addClass('active');
    client = active;
    localStorage.setItem('client', client);
    socket.emit('client', active);
  };
  clientActive(client);

  $('#search').click(function() {
    if ($('#search').hasClass('blink')) {
      socket.emit('search', null);
    } else {
      var center = map.getCenter();
      socket.emit('search', { latitude: center.lat(), longitude: center.lng() });
    }
  });

  socket.on('searching', function(status) {
    var _client = status['client'];
    console.log('searching: ' + _client);
    var status = status['status'];
    var circle = circles[_client];
    if (client == _client) {
      if (status == 'stop') {
        $('#search').removeClass('blink');
      } else {
        $('#search').addClass('blink');
      }
    }
    if (status == 'stop') {
      circle.setMap(null);
    } else {
      circle.setCenter({lat: status.latitude, lng: status.longitude});
      circle.setMap(map);
    }
  });

  $('#current').click(function() {
    if (navigator.geolocation) {
      $('#current').addClass('active');
      setTimeout(function() {$('#current').removeClass('active');}, 1000);
      navigator.geolocation.getCurrentPosition(
        function(position) {
          latlng = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
          map.setCenter(latlng);
        }
      );
    }
  });
  $('#bulbasaur').click(function() {
    clientActive('charmander');
  });
  $('#charmander').click(function() {
    clientActive('squirtle');
  });
  $('#squirtle').click(function() {
    clientActive('bulbasaur');
  });

  setInterval(function() {
    $.each(encounterIds, function(eid, pokemon) {
      if (Date.now() > pokemon.raw.expiration_time) {
        console.log("pokemon was deleted by cleaner")
        pokemon.marker.setMap(null);
        delete encounterIds[eid];
      }
    });
  }, 5000);

  // fetch first pokemons
  socket.emit('search', 'cache');
  setInterval(function() {
    socket.emit('search', 'cache');
  }, 5000);

  socket.on('pokemons', function(pokes) {
    $.each(pokes, function(eid, rawPokemon) {
      var pokemon = pokemons[rawPokemon.pokemon_id.toString()];
      pokemon.raw = rawPokemon;
      if (!encounterIds[eid]) {
        var latlng = new google.maps.LatLng(rawPokemon.lat ,rawPokemon.lng);
        var image = {
          url : pokemon.img,
          scaledSize : new google.maps.Size(32, 32)
        }
        var mopts = {
          position: latlng,
          map: map,
          icon: image,
          title: pokemon.ja
        };
        var marker = new google.maps.Marker(mopts);
        pokemon.marker = marker;
        var vanishDate = new Date(rawPokemon.expiration_time);
        var content = "Name: " + pokemon.ja + "<br>" + "Vanished: " + vanishDate.toLocaleString();
        var infowindow = new google.maps.InfoWindow({
          content: content
        });
        marker.addListener('click', function() {
          var map = infowindow.getMap();
          if (map !== null && typeof map !== "undefined") {
            infowindow.close();
          } else {
            infowindow.open(map, marker);
          }
        });
        console.log(rawPokemon.expiration_time - Date.now())
        setTimeout(function() {
          marker.setMap(null);
        }, rawPokemon.expiration_time - Date.now());
        encounterIds[eid] = pokemon;
      }
    })
  });

}
