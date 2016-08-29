module.exports = {
  cosArctan: function(dx, dy) {
    var div = dx / dy;
    return (dy > 0)
      ? (1 / Math.sqrt(1 + div * div))
      : (-1 / Math.sqrt(1 + div * div));
  },
  sinArctan: function(dx, dy) {
    var div = dx / dy;
    return (dy > 0)
      ? (div / Math.sqrt(1 + div * div))
      : (-div / Math.sqrt(1 + div * div));
  },
  sum: function(array) {
    return array.reduce(function(sum, item) {return sum + parseInt(item)}, 0)
  }
};
