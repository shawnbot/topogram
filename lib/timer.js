var timers = {};

module.exports = {
  start: function(label) {
    timers[label] = Date.now();
  },
  end: function(label) {
    var elapsed = Date.now() - timers[label];
    console.warn(label, ':', elapsed, 'ms');
  }
};
