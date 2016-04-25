var transformer = require('./transformer');

module.exports = function(topology, projection) {
  var tf = transformer(topology.transform);
  var x, y, len1, i1, out1;
  var len2 = topology.arcs.length;
  var i2 = 0;
  var projectedArcs = new Array(len2);
  while (i2 < len2) {
    x = 0;
    y = 0;
    len1 = topology.arcs[i2].length;
    i1 = 0;
    out1 = new Array(len1);
    while (i1 < len1) {
      topology.arcs[i2][i1][0] = (x += topology.arcs[i2][i1][0]);
      topology.arcs[i2][i1][1] = (y += topology.arcs[i2][i1][1]);
      out1[i1] = projection(tf(topology.arcs[i2][i1]));
      i1++;
    }
    projectedArcs[i2++] = out1;
  }
  return projectedArcs;
};

