'use strict';

var clients = {};
clients['bulbasaur'] = require('./lib/mypoke')(
  process.env.POKE_USERNAME,
  process.env.POKE_PASSWORD,
  process.env.POKE_PROVIDER
);
clients['charmander'] = require('./lib/mypoke')(
  process.env.POKE_2_USERNAME,
  process.env.POKE_2_PASSWORD,
  process.env.POKE_2_PROVIDER
);
clients['squirtle'] = require('./lib/mypoke')(
  process.env.POKE_3_USERNAME,
  process.env.POKE_3_PASSWORD,
  process.env.POKE_3_PROVIDER
);
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  let client = null;
  socket.on('client', (_client) => {
    console.log('client is changed');
    console.log(_client);
    client = clients[_client];
  });
  socket.on('search', (coords) => {
    if (client) {
      client.emit('search', coords);
    }
  });
  socket.on('stop', (stop) => {
    if (client) {
      client.emit('stop', stop);
    }
  });
  for (var key in clients) {
    if (clients.hasOwnProperty(key)) {
      let _key = key;
      let _client = clients[key];
      let sendPokemons = function(pokemons) {
        socket.emit('pokemons', pokemons);
      };
      let sendStatus = function(status) {
        socket.emit('searching', { client: _key, status: status});
      };
      _client.on('pokemons', sendPokemons);
      _client.on('searching', sendStatus);
      socket.on('disconnect', function () {
        console.log('disconnected');
        _client.removeListener('pokemons', sendPokemons);
        _client.removeListener('searching', sendStatus);
      });
    }
  }
});

var port = process.env.PORT || 3000;
server.listen(port, () => {
	console.log("Starting Server, Port: %d, Mode: %s",port,app.settings.env)
});
