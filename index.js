var d3Geo = require('d3-geo')
var d3Array = require('d3-array')
var topojson = require('topojson');
var copy = require('deep-copy');

var projectArcs = require('./lib/projectArcs');
var objectify = require('./lib/objectify');
var math = require('./lib/math');
var utils = require('./lib/utils');
var timer = require('./lib/timer');

module.exports = function() {
  var iterations = 8;
  var debug = false;
  var projection = d3Geo.geoAlbers();
  var properties = function(geom, topology) {
    return geom.properties || {};
  };
  var value = function(d) {
    return 1;
  };

  var path = d3Geo.geoPath()
    .projection(null);

  var topogram = function(topology, geometries) {
    if (debug) timer.start('copy');
    topology = copy(topology);
    if (debug) timer.end('copy');

    if (debug) timer.start('project');
    var projectedArcs = projectArcs(topology, projection);
    if (debug) timer.end('project');

    if (debug) timer.start('objectify');
    var objects = objectify(projectedArcs, {
      type: "GeometryCollection",
      geometries: geometries
    })
    .geometries.map(function(geom) {
      return {
        type: "Feature",
        id: geom.id,
        properties: properties.call(null, geom, topology),
        geometry: geom
      };
    });
    if (debug) timer.end('objectify');

    var values = objects.map(value);
    var totalValue = d3Array.sum(values);

    if (iterations <= 0) {
      return objects;
    }

    var i = 0;
    if (debug) timer.start('iterate');
    while (i++ < iterations) {
      if (debug) timer.start('iteration ' + i);
      var areas = objects.map(path.area);
      var totalArea = d3Array.sum(areas);
      var sizeErrorsTot = 0;
      var sizeErrorsNum = 0;
      var meta = objects.map(function(o, j) {
        // FIXME: why do we have negative areas?
        var area = Math.abs(areas[j]);
        var v = +values[j];
        var desired = totalArea * v / totalValue;
        var radius = Math.sqrt(area / Math.PI);
        var mass = Math.sqrt(desired / Math.PI) - radius;
        sizeError = Math.max(area, desired) / Math.min(area, desired);
        sizeErrorsTot += sizeError;
        sizeErrorsNum++;
        // console.log(o.id, "@", j, "area:", area, "value:", v, "->", desired, radius, mass, sizeError);
        return {
          id:         o.id,
          area:       area,
          centroid:   path.centroid(o),
          value:      v,
          desired:    desired,
          radius:     radius,
          mass:       mass,
          sizeError:  sizeError
        };
      });

      var sizeError = sizeErrorsTot / sizeErrorsNum;
      var forceReductionFactor = 1 / (1 + sizeError);

      // console.log("meta:", meta);
      // console.log("  total area:", totalArea);
      // console.log("  force reduction factor:", forceReductionFactor, "mean error:", sizeError);

      var len2 = projectedArcs.length;
      var i2 = 0;

      while (i2 < len2) {
        var len1 = projectedArcs[i2].length;
        var i1 = 0;
        while (i1 < len1) {
          // create an array of vectors: [x, y]
          var delta = [0,0];
          var len3 = meta.length;
          var i3 = 0;
          while (i3 < len3) {
            var centroid = meta[i3].centroid;
            var mass = meta[i3].mass;
            var radius = meta[i3].radius;
            var rSquared = radius * radius;
            var dx = projectedArcs[i2][i1][0] - centroid[0];
            var dy = projectedArcs[i2][i1][1] - centroid[1];
            var distSquared = dx * dx + dy * dy;
            var dist = Math.sqrt(distSquared);
            var Fij = (dist > radius)
              ? mass * radius / dist
              : mass *
                (distSquared / rSquared) *
                (4 - 3 * dist / radius); // XXX magic numbers!
            delta[0] += (Fij * math.cosArctan(dy, dx));
            delta[1] += (Fij * math.sinArctan(dy, dx));
            i3++;
          }
          projectedArcs[i2][i1][0] += delta[0] * forceReductionFactor;
          projectedArcs[i2][i1][1] += delta[1] * forceReductionFactor;
          i1++;
        }
        i2++;
      }
      if (debug) timer.end('iteration ' + i);

      // break if we hit the target size error
      if (sizeError <= 1) break;
    }
    if (debug) timer.end('iterate');

    return {
      features: objects,
      arcs: projectedArcs
    };
  };

  // expose the path directly, for convenience
  topogram.path = path;

  topogram.iterations = function(i) {
    if (arguments.length) {
      iterations = Number(i) || 0;
      return topogram;
    } else {
      return iterations;
    }
  };

  topogram.value = function(v) {
    if (arguments.length) {
      value = utils.functor(v);
      return topogram;
    } else {
      return value;
    }
  };

  topogram.projection = function(p) {
    if (arguments.length) {
      projection = p;
      return topogram;
    } else {
      return projection;
    }
  };

  topogram.feature = function(topology, geom) {
    return {
      type: "Feature",
      id: geom.id,
      properties: properties.call(null, geom, topology),
      geometry: {
        type: geom.type,
        coordinates: topojson.object(topology, geom).coordinates
      }
    };
  };

  topogram.features = function(topo, geometries) {
    return geometries.map(function(f) {
      return topogram.feature(topo, f);
    });
  };

  topogram.properties = function(props) {
    if (arguments.length) {
      properties = utils.functor(props);
      return topogram;
    } else {
      return properties;
    }
  };

  topogram.debug = function(d) {
    if (arguments.length) {
      debug = !!d;
      return topogram;
    } else {
      return debug;
    }
  };

  return topogram;
};
