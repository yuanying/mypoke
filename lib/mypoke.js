'use strict';

const EventEmitter = require('events').EventEmitter;
const PokemonGO = require('pokemon-go-node-api');
var fs = require('fs');
var utils = require('./utils');
var savedPokemons = {};

// clean savedPokemons
var cleanupSavedPokemons = function() {
  Object.keys(savedPokemons).forEach(function(key) {
    var pokemon = savedPokemons[key];
    if (Date.now() > pokemon.expiration_time) {
      console.log("delete saved pokemon");
      console.log(pokemon);
      delete savedPokemons[key];
    }
  });
}
// clean savedPokemons
setInterval(cleanupSavedPokemons, 5000);

module.exports = function(username, password, provider) {
  var ev = new EventEmitter;
  var account = false;
  var queryLocations = [];
  var coords = null;

  var getMapPokemons = function(hb) {
    var pokemons = {};
    for (var i = hb.cells.length - 1; i >= 0; i--) {
      for (var j = hb.cells[i].MapPokemon.length - 1; j >= 0; j--) {
        let mapPokemon = hb.cells[i].MapPokemon[j];
        let eid = mapPokemon.EncounterId.toString();
        let pokemon = {
          "pokemon_id": mapPokemon.PokedexTypeId,
          "lat": mapPokemon.Latitude,
          "lng": mapPokemon.Longitude,
          "expiration_time": mapPokemon.ExpirationTimeMs.toNumber()
        }
        pokemons[eid] = pokemon;
        savedPokemons[eid] = pokemon;
      }
    }
    return pokemons;
  }

  var fetchPokemons = function(callback) {
    account.Heartbeat((err,hb)=>{
      if (err) {
        console.log('Heartbeat error');
        account = false;
        callback({});
        return
      }
      if (!hb) {
        account = false;
        callback({});
        return
      }
      var mapPokemons = getMapPokemons(hb);
      callback(mapPokemons);
    });
  }

  var loginAndFetchPokemons = function(username, password, location, provider, callback) {
    if (!account) {
      console.log('loginAndFetchPokemons, not logined');
      account = new PokemonGO.Pokeio();
      account.init(username, password, location, provider, (err) => {
        if (!err) {
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

  setInterval(() => {
    coords = queryLocations.shift();
    if (coords) {
      ev.emit('searching', coords);
      let location = {
          type: 'coords',
          coords: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            altitude: 18
          }
      };
      loginAndFetchPokemons(username, password, location, provider, (pokemons) => {
        console.log('ev.emit.pokemons;');
        ev.emit('pokemons', pokemons);
      });
    } else {
      ev.emit('searching', 'stop');
    }
  }, 5000);

  ev.on('search', (_coords) => {
    if (_coords) {
      if (_coords == 'cache') {
        console.log("Send savedPokemons")
        ev.emit('pokemons', savedPokemons);
      } else {
        console.log("Location Updated: " + _coords);
        ev.emit('searching', _coords);
        queryLocations = utils.generateSpiral(_coords.latitude, _coords.longitude);
      }
    } else {
      queryLocations = [];
      ev.emit('searching', 'stop');
    }
  });

  return ev;
}
