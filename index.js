'use strict';

const PokeGoSearch = require('./lib/pokemon')(
  process.env.POKE_USERNAME,
  process.env.POKE_PASSWORD,
  process.env.POKE_PROVIDER
);
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  socket.on('search', (coords) => {
    PokeGoSearch.emit('search', coords);
  });
  PokeGoSearch.on('pokemons', (pokemons) => {
    socket.emit('pokemons', pokemons);
  });
});

var port = process.env.PORT || 3000;
server.listen(port, () => {
	console.log("Starting Server, Port: %d, Mode: %s",port,app.settings.env)
});
