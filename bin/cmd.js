#!/usr/bin/env node

var minimistAliases = { 'z': 'zoom', 't': 'template', 'r': 'radius' }
var argv = require('minimist')(process.argv, { alias: minimistAliases })
var fs = require('fs')
var path = require('path')
var readline = require('readline')

if (!argv.zoom || !argv.lat || !argv.lon || !argv.radius || !argv.template ||
  !isTemplateValid(argv.template)) {
  printUsageAndExit()
}

var bbox = toRect(Number(argv.lat), Number(argv.lon), Number(argv.radius), Number(argv.zoom))
var tiles = tilesInRect(bbox)

var mapFn = tileToUrlMapper(argv.template, Number(argv.zoom))
var urls = tiles.map(mapFn)

var text = 'This will make ' + urls.length + ' HTTP requests. Proceed? [y/N] '
prompt(text, function (err, proceed) {
  if (err) throw err
  if (proceed) {
    console.log('TODO: download')
  } else {
    console.log('aborted')
    process.exit(1)
  }
})

function prompt (text, cb) {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question(text, function (answer) {
    rl.close()
    if (answer === 'y' || answer === 'yes') cb(null, true)
    else cb(null, false)
  });
}

// String, Number -> ({x, y} -> String)
function tileToUrlMapper (template, zoom) {
  return function (pt) {
    return buildUrl(template, pt.x, pt.y, zoom)
  }
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
    left: latToTile(lat + radius, zoom),
    bottom: lonToTile(lon + radius, zoom),
    right: latToTile(lat - radius, zoom)
  }
}

// Number -> Number
function lonToTile (lon, zoom) {
  var n = Math.pow(2, zoom)
  var x = n * ((lon + 180) / 360)
  return Math.floor(x)
}

// Number -> Number
function latToTile (lat, zoom) {
  var n = Math.pow(2, zoom)
  var latRadians = lat * (Math.PI / 180)
  var y = n * (1 - (Math.log(Math.tan(latRadians) + sec(latRadians)) / Math.PI)) / 2
  return Math.floor(y)
}

// Number -> Number
function sec (rad) {
  return 1 / Math.cos(rad)
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

