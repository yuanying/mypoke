#!/usr/bin/env ruby -wKU

require 'json'

pokemons = JSON.parse(open(File.dirname(__FILE__) + '/pokemons.json').read)
pokemons_ja = JSON.parse(open(File.dirname(__FILE__) + '/pokemons_ja.json').read)

pokemons_ja = pokemons_ja.map do |poke|
  [poke['en'], poke['ja']]
end.to_h

pokemons = pokemons['pokemon'].map do |poke|
  poke['ja'] = pokemons_ja[poke['name']]
  [poke['id'], poke]
end.to_h.to_json

puts "var pokemons = #{pokemons}"
