#!/usr/bin/env node

var minimistAliases = { 'z': 'zoom', 't': 'template', 'r': 'radius' }
var argv = require('minimist')(process.argv, { alias: minimistAliases })
var fs = require('fs')
var path = require('path')

if (!argv.zoom || !argv.lat || !argv.lon || !argv.radius || !argv.template ||
  !isTemplateValid(argv.template)) {
  printUsageAndExit()
}

function isTemplateValid (template) {
  return /{x}/.test(template) && /{y}/.test(template) && /{z}/.test(template)
}

function printUsageAndExit () {
  fs.createReadStream(path.join(__dirname, 'USAGE'))
    .pipe(process.stdout)
    .once('end', function () { process.exit(1) })
}

