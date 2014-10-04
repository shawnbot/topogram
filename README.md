# d3-cartogram

This is a JavaScript implementation of [an algoritm to construct continuous area cartograms](http://lambert.nico.free.fr/tp/biblio/Dougeniketal1985.pdf), by James A. Dougenik, Nicholas R. Chrisman and Duane R. Niemeyer, ©1985 by the Association of American Geographers. It relies heavily on [d3](http://github.com/mbostock/d3) for rendering and [TopoJSON](http://github.com/mbostock/topojson) both for writing and reading topological JSON geodata.

The [included example](https://github.com/shawnbot/d3-cartogram/blob/master/index.html) combines TopoJSON-encoded and boundaries of the United States from [Natural Earth](http://www.naturalearthdata.com/downloads/110m-cultural-vectors/) with [2011 US Census population estimates](http://www.census.gov/popest/data/state/totals/2011/) to size each state proportionally.
