var reverse = function(array, n) {
  var t;
  var j = array.length;
  var i = j - n;
  while (i < --j) {
    t = array[i], array[i++] = array[j], array[j] = t;
  }
}
module.exports = function objectify(arcs, o) {
  function arc(i, points) {
    if (points.length) {
      points.pop();
    }
    for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length; k < n; ++k) {
      points.push(a[k]);
    }
    if (i < 0) {
      reverse(points, n);
    }
  }

  function line(arcs) {
    var points = [];
    for (var i = 0, n = arcs.length; i < n; ++i) {
      arc(arcs[i], points);
    }
    return points;
  }

  function polygon(arcs) {
    return arcs.map(line);
  }

  function geometry(o) {
    o = Object.create(o);
    o.coordinates = geometryType[o.type](o.arcs);
    return o;
  }
  var geometryType = {
    LineString: line,
    MultiLineString: polygon,
    Polygon: polygon,
    MultiPolygon: function(arcs) {
      return arcs.map(polygon);
    }
  };

  return o.type === 'GeometryCollection'
    ? (o = Object.create(o), o.geometries = o.geometries.map(geometry), o)
    : geometry(o);
}

