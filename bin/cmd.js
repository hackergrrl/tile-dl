#!/usr/bin/env node

var minimistAliases = {
  'z': 'zoom',
  't': 'template',
  'r': 'radius',
  'o': 'output'
}
var argv = require('minimist')(process.argv, { alias: minimistAliases })
var fs = require('fs')
var path = require('path')
var readline = require('readline')
var mkdirp = require('mkdirp')
var http = require('http')
var https = require('https')

if (!argv.output || !argv.zoom || !argv.lat || !argv.lon || !argv.radius || !argv.template || !isTemplateValid(argv.template)) {
  printUsageAndExit()
  return
}

// 1. Compute tiles
var bbox = toRect(Number(argv.lat), Number(argv.lon), Number(argv.radius), Number(argv.zoom))
var tiles = tilesInRect(bbox)

// 2. Compute URLs
var mapFn = tileToUrlMapper(argv.template, Number(argv.zoom))
var urlInfo = tiles.map(mapFn)

// 3. Ask user if they really want to do this
var text = 'This will make ' + urlInfo.length + ' HTTP requests. Proceed? [y/N] '
prompt(text, function (err, proceed) {
  if (err) throw err
  if (proceed) {
    onProceed()
  } else {
    console.log('aborted')
    process.exit(1)
  }
})

// 4. Make http requests
function onProceed () {
  var pending = urlInfo.length
  urlInfo.forEach(function (data) {
    // Make output directory
    var outpath = outputPath(argv.output, data.x, data.y, data.z)
    mkdirp.sync(path.dirname(outpath))

    // Download file + write
    console.log('GET', data.x, data.y, data.z, data.url)
    getAndWriteUrl(data.url, outpath, function (err) {
      if (err) throw err
      console.log('GOT', data.x, data.y, data.z)
      if (!--pending) onDownloaded()
    })
  })
}

function onDownloaded () {
  console.log('done')
}

function getAndWriteUrl (url, out, cb) {
  var web = url.startsWith('https') ? https : http
  web.get(url, function (res) {
    if (res.statusCode !== 200) return cb(new Error('status ' + res.statusCode))

    var ws = fs.createWriteStream(out)
    res.on('data', function (data) {
      ws.write(data)
    })
    res.once('end', function () {
      ws.end()
      cb()
    })
  })
}

// String, Number, Number, Number -> String
function outputPath (output, x, y, z) {
  var pathPieces = output
    .replace('{x}', x)
    .replace('{y}', y)
    .replace('{z}', z)
    .split('/')
  return path.join.apply(path, pathPieces)
}

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
    return {
      url: buildUrl(template, pt.x, pt.y, zoom),
      x: pt.x,
      y: pt.y,
      z: zoom
    }
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
    top: latToTile(lat + radius, zoom),
    left: lonToTile(lon - radius, zoom),
    bottom: latToTile(lat - radius, zoom),
    right: lonToTile(lon + radius, zoom)
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

