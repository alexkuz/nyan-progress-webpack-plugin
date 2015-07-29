var NyanProgressPlugin = require('../index');

function loop(progress, onLoop) {
  var finished = onLoop(progress);

  if (!finished) {
    progress += 0.000001;
    process.nextTick(loop.bind(null, progress, onLoop));
  }
}

describe('Nyan Plugin', function() {
  this.timeout(5000);

  it('works with default options', function(done) {
    var plugin = new NyanProgressPlugin();
    plugin.handler(0, 'started');

    loop(0.01, function(progress) {
      if (progress < 1) {
        plugin.handler(progress, 'progress: ' + progress);
      } else {
        plugin.handler(1, 'finished');
        done();
      }

      return progress >= 1;
    });
  });

  it('works with large debounce interval', function(done) {
    var plugin = new NyanProgressPlugin({ debounceInterval: 1000 });
    plugin.handler(0, 'started');

    loop(0.01, function(progress) {
      if (progress < 1) {
        plugin.handler(progress, 'progress: ' + progress);
      } else {
        plugin.handler(1, 'finished');
        done();
      }

      return progress >= 1;
    });
  });

  it('works with small debounce interval', function(done) {
    var plugin = new NyanProgressPlugin({ debounceInterval: 50 });
    plugin.handler(0, 'started');

    loop(0.01, function(progress) {
      if (progress < 1) {
        plugin.handler(progress, 'progress: ' + progress);
      } else {
        plugin.handler(1, 'finished');
        done();
      }

      return progress >= 1;
    });
  });
});
