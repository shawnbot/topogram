(function(exports) {

  /*
   * d3.cartogram is a d3-friendly implementation of An Algorith to Construct
   * Continuous Area Cartograms:
   *
   * <http://chrisman.scg.ulaval.ca/G360/dougenik.pdf>
   *
   * It requires topojson to decode TopoJSON-encoded topologies:
   *
   * <http://github.com/mbostock/topojson/>
   *
   * Usage:
   *
   * var cartogram = d3.cartogram()
   *  .projection(d3.geo.albersUsa())
   *  .value(function(d) {
   *    return Math.random() * 100;
   *  });
   * d3.json("path/to/topology.json", function(topology) {
   *  var features = cartogram(topology);
   *  d3.select("svg").selectAll("path")
   *    .data(features)
   *    .enter()
   *    .append("path")
   *      .attr("d", cartogram.path);
   * });
   */
  d3.cartogram = function() {

    function carto(topology) {
      // copy it first
      topology = copy(topology);

      // objects are projected into screen coordinates
      var projectGeometry = projector(projection),
          objects = carto.features(topology, false).map(function(feature) {
            var geom = feature.geometry;
            feature.geometry = {
              type: geom.type,
              coordinates: projectGeometry(feature.geometry)
            };
            return feature;
          }),
          values = objects.map(value),
          totalValue = sum(values);

      // no iterations; just return the features
      if (iterations <= 0) {
        return objects;
      }

      // project the arcs into screen space
      var tf = transformer(topology.transform),
          projectedArcs = topology.arcs.map(function(arc) {
            var x = 0, y = 0;
            return arc.map(function(coord) {
              coord[0] = (x += coord[0]);
              coord[1] = (y += coord[1]);
              return projection(tf(coord));
            });
          });

      // path with identity projection
      var path = d3.geo.path()
        .projection(ident);

      // our key function hashes [x, y] coordinates
      var Q = 7;
      function key(coord) {
        return [coord[0].toFixed(Q), coord[1].toFixed(Q)].join(",");
      }

      var i = 0,
          targetSizeError = 1;
      while (i++ < iterations) {
        // console.log("iteration", i);

        /*
         * XXX: HACKS AHOY!
         * Because there's no easy way to convert the projected arcs back into
         * coordinates that topojson understands, we store the deltas for each
         * coordinate in this hash, then update all of the feature geometries
         * individually.
         */
        var deltasByCoord = {};
        projectedArcs.forEach(function(arc) {
          arc.forEach(function(coord) {
            var k = key(coord);
            deltasByCoord[k] = [0, 0];
          });
        });

        var areas = objects.map(path.area),
            totalArea = sum(areas),
            sizeErrors = [],
            meta = objects.map(function(o, j) {
              var area = Math.abs(areas[j]), // XXX: why do we have negative areas?
                  v = +values[j],
                  desired = totalArea * v / totalValue,
                  radius = Math.sqrt(area / Math.PI),
                  mass = Math.sqrt(desired / Math.PI) - radius,
                  sizeError = Math.max(area, desired) / Math.min(area, desired);
              sizeErrors.push(sizeError);
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

        var sizeError = mean(sizeErrors),
            forceReductionFactor = 1 / (1 + sizeError);

        // console.log("meta:", meta);
        // console.log("  total area:", totalArea);
        // console.log("  force reduction factor:", forceReductionFactor, "mean error:", sizeError);

        projectedArcs.forEach(function(arc, j) {
          arc.forEach(function(coord, k) {
            // create an array of vectors: [x, y]
            var vectors = meta.map(function(d) {
              var centroid =  d.centroid,
                  mass =      d.mass,
                  radius =    d.radius,
                  theta =     angle(centroid, coord),
                  dist =      distance(centroid, coord),
                  Fij = (dist > radius)
                    ? mass * radius / dist
                    : mass *
                      (Math.pow(dist, 2) / Math.pow(radius, 2)) *
                      (4 - 3 * dist / radius);
              return [
                Fij * Math.cos(theta),
                Fij * Math.sin(theta)
              ];
            });

            // using Fij and angles, calculate vector sum
            var delta = vectors.reduce(function(a, b) {
              return [
                a[0] + b[0],
                a[1] + b[1]
              ];
            }, [0, 0]);

            delta[0] *= forceReductionFactor;
            delta[1] *= forceReductionFactor;

            var k = key(coord);
            deltasByCoord[k] = delta;

            coord[0] += delta[0];
            coord[1] += delta[1];
          });
        });

        // updateGeom(geometry) applies the delta for each coordinate
        var updateGeom = projector(function(coord) {
          var k = key(coord),
              delta = deltasByCoord[k];
          coord[0] += delta[0];
          coord[1] += delta[1];
        });

        // update the feature coordinates
        objects.forEach(function(o) {
          updateGeom(o.geometry);
        });

        // break if we hit the target size error
        if (sizeError <= targetSizeError) break;
      }

      return objects;
    }

    var iterations = 8,
        projection = d3.geo.albers(),
        properties = function(id) {
          return {};
        },
        value = function(d) {
          return 1;
        };

    // for convenience
    carto.path = d3.geo.path()
      .projection(ident);

    carto.iterations = function(i) {
      if (arguments.length) {
        iterations = i;
        return carto;
      } else {
        return iterations;
      }
    };

    carto.value = function(v) {
      if (arguments.length) {
        value = d3.functor(v);
        return carto;
      } else {
        return value;
      }
    };

    carto.projection = function(p) {
      if (arguments.length) {
        projection = p;
        return carto;
      } else {
        return projection;
      }
    };

    carto.feature = function(topology, geom) {
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

    carto.features = function(topo, dupe) {
      // XXX it shouldn't be necessary to copy the whole structure
      if (dupe) topo = copy(topo);
      return topo.objects[0].geometries.map(function(f) {
        return carto.feature(topo, f);
      });
    };

    carto.properties = function(props) {
      if (arguments.length) {
        properties = d3.functor(props);
        return carto;
      } else {
        return properties;
      }
    };

    return carto;
  };

  var transformer = d3.cartogram.transformer = function(tf) {
    var kx = tf.scale[0],
        ky = tf.scale[1],
        dx = tf.translate[0],
        dy = tf.translate[1];

    function transform(c) {
      return [c[0] * kx + dx, c[1] * ky + dy];
    }

    transform.invert = function(c) {
      return [(c[0] - dx) / kx, (c[1]- dy) / ky];
    };

    return transform;
  };

  function sum(numbers) {
    var sum = 0;
    for (var i = numbers.length - 1; i-- > 0;) {
      sum += numbers[i];
    }
    return sum;
  }

  function mean(numbers) {
    return sum(numbers) / numbers.length;
  }

  function angle(a, b) {
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
  }

  function distance(a, b) {
    var dx = b[0] - a[0],
        dy = b[1] - a[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  function projector(proj) {
    var types = {
      Point: proj,
      LineString: function(coords) {
        return coords.map(proj);
      },
      MultiLineString: function(arcs) {
        return arcs.map(types.LineString);
      },
      Polygon: function(rings) {
        return rings.map(types.LineString);
      },
      MultiPolygon: function(rings) {
        return rings.map(types.Polygon);
      }
    };
    return function(geom) {
      return types[geom.type](geom.coordinates);
    };
  }

  // identity projection
  function ident(c) {
    return c;
  }

  function copy(o) {
    return (o instanceof Array)
      ? o.map(copy)
      : (typeof o === "string" || typeof o === "number")
        ? o
        : copyObject(o);
  }
  
  function copyObject(o) {
    var obj = {};
    for (var k in o) obj[k] = copy(o[k]);
    return obj;
  }

})(this);
