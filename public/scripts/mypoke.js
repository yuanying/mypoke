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

  socket.on('pokemons', function(pokes) {
    $.each(pokes, function(eid, rawPokemon) {
      var pokemon = pokemons[rawPokemon.pokemon_id.toString()];
      console.log(eid);
      console.log(rawPokemon);
      console.log(pokemon);
      if (!encounterIds[eid]) {
        encounterIds[eid] = true;
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
        var vanishDate = new Date(rawPokemon.expiration_time);
        var content = "Name: " + pokemon.ja + "<br>" + "Vanished: " + vanishDate.toLocaleString();
        var infowindow = new google.maps.InfoWindow({
          content: content
        });
        marker.addListener('click', function() {
          infowindow.open(map, marker);
        });
        console.log(rawPokemon.expiration_time - Date.now())
        setTimeout(function() {
          marker.setMap(null);
        }, rawPokemon.expiration_time - Date.now());
      }
    })
  });

}
