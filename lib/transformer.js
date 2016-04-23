module.exports = function transformer(tf) {
  var kx = tf.scale[0];
  var ky = tf.scale[1];
  var dx = tf.translate[0];
  var dy = tf.translate[1];

  var transform = function(c) {
    return [c[0] * kx + dx, c[1] * ky + dy];
  };

  transform.invert = function(c) {
    return [(c[0] - dx) / kx, (c[1]- dy) / ky];
  };

  return transform;
};
