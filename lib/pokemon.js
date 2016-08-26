'use strict';

const EventEmitter = require('events').EventEmitter;
const PokemonGO = require('pokemon-go-node-api');
var account = new PokemonGO.Pokeio();
account.mypokeInitialized = false;

var fs = require('fs');

var testPokemons = JSON.parse(fs.readFileSync(__dirname + '/test.json', 'utf8'));

var queryLocations = [];

var generateSpiral = function(starting_lat, starting_lng) {
  var step_size = 0.0005
  var step_limit = 49
  var coords = [{ latitude: starting_lat, longitude: starting_lng }];
  var steps = 1
  var x = 0
  var y = 0
  var d = 1
  var m = 1
  var rlow = 0.0
  var rhigh = 0.0005
  while (steps < step_limit) {
    while (2 * x * d < m && steps < step_limit) {
      x += d
      steps += 1
      let lat = x * step_size + starting_lat
      let lng = y * step_size + starting_lng
      coords.push( { latitude: lat, longitude: lng } )
    }
    while (2 * y * d < m && steps < step_limit) {
      y += d
      steps += 1
      let lat = x * step_size + starting_lat
      let lng = y * step_size + starting_lng
      coords.push( { latitude: lat, longitude: lng } )
    }
    d = -1 * d
    m += 1
  }
  return coords;
}

var getMapPokemons = function(hb) {
  var pokemons = {};
  for (var i = hb.cells.length - 1; i >= 0; i--) {
    for (var j = hb.cells[i].MapPokemon.length - 1; j >= 0; j--) {
      let mapPokemon = hb.cells[i].MapPokemon[j];
      console.log(mapPokemon)
      pokemons[mapPokemon.EncounterId.toString()] = {
        "pokemon_id": mapPokemon.PokedexTypeId,
        "lat": mapPokemon.Latitude,
        "lng": mapPokemon.Longitude,
        "expiration_time": parseInt(mapPokemon.ExpirationTimeMs.toString())
      }
    }
  }
  return pokemons;
}

var fetchPokemons = function(callback) {
  account.Heartbeat((err,hb)=>{
    if (err) {
      console.log('Heartbeat error');
      callback({});
      return
    }
    if (!hb) {
      account.mypokeInitialized = false;
      callback({});
      return
    }
    var mapPokemons = getMapPokemons(hb);
    callback(mapPokemons);
  });
}

var loginAndFetchPokemons = function(username, password, location, provider, callback) {
  console.log('loginAndFetchPokemons');
  if (!account.mypokeInitialized) {
    console.log('loginAndFetchPokemons, not logined');
    account.init(username, password, location, provider, (err) => {
      if (!err) {
        account.mypokeInitialized = true;
        fetchPokemons((pokemons) => {
          callback(pokemons);
        });
      }
    });
  } else {
    console.log('loginAndFetchPokemons, logined');
    account.SetLocation(location, (err, loc) => {
      fetchPokemons((pokemons) => {
        callback(pokemons);
      });
    });
  }
}

module.exports = function(username, password, provider) {
  var ev = new EventEmitter;
  setInterval(() => {
    let coords = queryLocations.shift();
    if (coords) {
      let location = {
          type: 'coords',
          coords: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            altitude: 18
          }
      };
      console.log(location);
      loginAndFetchPokemons(username, password, location, provider, (pokemons) => {
        console.log('ev.emit.pokemons;');
        ev.emit('pokemons', pokemons);
      });
    }
  }, 5000);
  ev.on('search', (coords) => {
    console.log("Location Updated: " + coords);
    queryLocations = generateSpiral(coords.latitude, coords.longitude);
    // console.log();
  });
  return ev;
}
