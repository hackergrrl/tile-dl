#!/usr/bin/env node

var minimistAliases = { 'z': 'zoom', 't': 'template', 'r': 'radius' }
var argv = require('minimist')(process.argv, { alias: minimistAliases })
var fs = require('fs')
var path = require('path')

if (!argv.zoom || !argv.lat || !argv.lon || !argv.radius || !argv.template ||
  !isTemplateValid(argv.template)) {
  printUsageAndExit()
}

var bbox = toRect(Number(argv.lat), Number(argv.lon), Number(argv.radius))
var tiles = tilesInRect(bbox)

var mapFn = tileToUrlMapper(argv.template, Number(argv.zoom))
var urls = tiles.map(mapFn)

// String, Number -> ({x, y} -> String)
function tileToUrlMapper (template, zoom) {
  return function (pt) {
    return buildUrl(template, pt.x, pt.y, zoom)
  })
}

// String, Number, Number, Number -> String
function buildUrl (template, x, y, z) {
  return template
    .replace('{x}', x)
    .replace('{y}', y)
    .replace('{z}', z)
}

// {top, left, bottom, right} -> [{x, y}}
function tilesInRect (bbox) {
  var res = []
  for (var i = bbox.top; i <= bbox.bottom; i++) {
    for (var j = bbox.left; j <= bbox.right; j++) {
      res.push({ x: j, y: i })
    }
  }
  return res
}

// Number, Number, Number -> {left, right, top, bottom}
function toRect (lat, lon, radius, zoom) {
  return {
    top: lonToTile(lon - radius, zoom),
    left: latToTile(lat - radius, zoom),
    bottom: lonToTile(lon - radius, zoom),
    right: latToTile(lat + radius, zoom)
  }
}

// Number -> Number
function lonToTile (lat, zoom) {
  var n = Math.pow(2, zoom)
  var x = n * ((lon + 180) / 360)
  return x
}

// Number -> Number
function latToTile (lat, zoom) {
  var n = Math.pow(2, zoom)
  var latRadians = lat * (Math.PI / 180)
  var y = n * (1 - (Math.log(Math.tan(latRadians) + Math.sec(latRadians)) / Math.PI)) / 2
  return y
}

// String -> Boolean
function isTemplateValid (template) {
  return /{x}/.test(template) && /{y}/.test(template) && /{z}/.test(template)
}

function printUsageAndExit () {
  fs.createReadStream(path.join(__dirname, 'USAGE'))
    .pipe(process.stdout)
    .once('end', function () { process.exit(1) })
}

