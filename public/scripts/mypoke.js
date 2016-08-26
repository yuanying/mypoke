function initialize() {
  var encounterIds = {};
  var latlng = new google.maps.LatLng(35.643757,139.826647);
  var opts = {
    zoom: 18,
    center: latlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  var map = new google.maps.Map(document.getElementById("mypoke"), opts);
  // console.log(map.getCenter().lat());

  var socket = io.connect();
  $('#search').click(function() {
    if(!$('#search').hasClass('disabled')) {
      $('#search').addClass('disabled');
      var center = map.getCenter();
      socket.emit('search', { latitude: center.lat(), longitude: center.lng() });
      setTimeout(function() {
        $('#search').removeClass('disabled');
      }, 30000);
    }
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
  setTimeout(function() {
    socket.emit('search', null);
  }, 1000);

  socket.on('pokemons', function(pokes) {
    $.each(pokes, function(eid, rawPokemon) {
      var pokemon = pokemons[rawPokemon.pokemon_id.toString()];
      pokemon.raw = rawPokemon;
      console.log(eid);
      console.log(pokemon);
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
