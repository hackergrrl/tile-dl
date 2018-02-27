# tile-dl

> Download map tiles covering an area from a URL template.

There exist various web services that act as providers for map tile data. This
could be vector tiles or maybe traditional raster image tiles. Usually they
follow a predictable URL structure like
`http://foo-service.com/tiles/{zoom}/{x}/{y}.jpg`. If you know this URL
template, you can use `tile-dl` to download all tiles within an area from this
service and store them locally.

This can be very useful for offline storage of map data for e.g. an area you'll
be traveling to.

## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install --global tile-dl
```

## Usage

```
USAGE: tile-dl -t 'URL' -o 'OUTPUT' --lat LAT --lon LON --radius R --zoom ZOOM

  Recursively downloads tile data (vector, satellite, etc), given a server URL
  template.

  --template|-t: A URL template. Must contain the markers {x}, {y}, and {zoom}.
                 e.g. http://some.mapservice.com/{zoom}/{x}/{y}.jpg

  --output|-o  : The directory output template. For example, '{z}/{y}/{x}.png'
                 will create a directory hierarchy with 'z' at the top, 'y'
                 inside that, and fill each innermost directory with 'z.png'
                 files.

  --lat        : The center latitude to download tiles from.
  --lon        : The center longitude to download tiles from.

  --radius|-r  : The radius, in kilometers, to download around the center
                 latitude and longitude coordinates.

  --zoom|-z    : The zoom level of tiles to be downloaded. Be wary: zoom level
                 N+1 contains 4 times as many tiles as zoom level N.
```

## Example

```
$ tile-dl -t 'http://map-r-us.org/{z}/{y}/{x}.png' --lon=-122.2632601 --lat=37.8027446 --radius 0.1 -z 12 -o {z}/{y}/{x}.png
```

this will download map tiles at zoom level in a 0.1km radius around
approximately `(37.8,122.2)` and write them to a folder in the current directory
called `12/`. You'll have the following file structure:

```
├── 1581
│   ├── 655.png
│   ├── 656.png
│   ├── 657.png
│   └── 658.png
├── 1582
│   ├── 655.png
│   ├── 656.png
│   ├── 657.png
│   └── 658.png
├── 1583
│   ├── 655.png
│   ├── 656.png
│   ├── 657.png
│   └── 658.png
└── 1584
    ├── 655.png
    ├── 656.png
    ├── 657.png
    └── 658.png
```

## License

ISC
