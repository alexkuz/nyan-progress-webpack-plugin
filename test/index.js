var NyanProgressPlugin = require('../index');

var plugin = new NyanProgressPlugin();

var progress = 0;
var finished = false;

function tick() {
  if (progress < 1) {
    plugin.handler(progress, 'progress: ' + progress);
  } else if (!finished) {
    finished = true;
    plugin.handler(1, 'finished');
  }

  if (progress < 2) {
    progress += 0.0000003;
    process.nextTick(tick);
  }
}

tick();
