#!/usr/bin/env node
var cartogram = require('../')();

var yargs = require('yargs')
  .usage('$0 [options] [-i] input.json [-o] output.json')
  .describe('i', 'The input TopoJSON (or 1st argument, or stdin)')
  .describe('object', 'The topology object name (topology.objects[name]) to use')
  .describe('o', 'The output TopoJSON (or 2nd argument, or stdout)')
  .describe('I', 'The number of iterations (more takes longer, but produces more accurate shapes')
  .default('I', cartogram.iterations())
  .describe('value', 'The value function, either as a property expression or fat arrow function')
  .alias('v', 'value')
  .describe('properties', 'The properties function, probably as a fat arrow, e.g. "f => {{name: f.properties.name}}"')
  .alias('p', 'properties')
  .alias('h', 'help');

var options = yargs.argv;
if (options.help) {
  return yargs.showHelp();
}

var fs = require('fs');
var input = options.i || options._.shift() || '/dev/stdin';
var output = options.o || options._.shift();

var fof = require('fof');
var topojson = require('topojson');

if (options.value) {
  cartogram.value(fof(options.value));
}

if (options.properties) {
  cartogram.properties(fof(options.properties));
}

fs.readFile(input, {encoding: 'utf8'}, function(error, input) {
  if (error) {
    throw new Error(error);
  }

  var topology = JSON.parse(input);
  var object = options.object || Object.keys(topology.objects)[0];
  var geometries = topology.objects[object].geometries;
  var result = cartogram(topology, geometries);

  var out = JSON.stringify(result);

  if (output) {
    fs.writeFile(output, {encoding: 'utf8'}, result, function(error) {
      if (error) {
        throw new Error(error);
      }
    });
  } else {
    process.stdout.write(out, function() {
      process.exit(0);
    });
  }
});
