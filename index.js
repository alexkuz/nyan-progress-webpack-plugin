var clor = require('clor');
var webpack = require('webpack');

var shift = 0;
var hasProgress = false;

function prepareNyan(nyan, colorMap, mapColors) {
  return nyan.map(function(row, idx) {
    return row.split('').reduce(function (arr, chr, j) {
      var color = colorMap[idx][j];
      var last = arr[arr.length - 1];
      if (last && last.colorCode === color) {
        last.text += chr;
        return arr;
      } else {
        return arr.concat({
          colorCode: color,
          color: mapColors[color] || function(l) { return l; },
          text: chr
        });
      }
    }, []);
  });
}

var nyanProgress = prepareNyan([
  ' ,--------,     ',
  ' │▗▝ ▞ ▝ ˄---˄  ',
  '~│ ▞  ▞ ❬.◕‿‿◕.❭',
  ' `w-w---- w w   '
], [
  ' ggggggggggg    ',
  ' gMMMMMMMggggg  ',
  'ggMMMMMMgwwwwwwg',
  ' gggggggggggg   '
], {
  g: function(l) { return l; },
  M: function(l) { return l.bold.magenta.inverse; },
  w: function(l) { return l.bold; },
});

var nyanSuccess = prepareNyan([
  ' ,--------,      ,------.',
  ' │▗▝ ▞ ▝ ˄---˄  / Nyan! |',
  '~│ ▞  ▞ ❬.◕‿‿◕.❭--------’',
  ' `w-w---- w w            '
], [
  ' ggggggggggg     wwwwwwww',
  ' gMMMMMMMggggg  wwwwwwwww',
  'ggMMMMMMgwwwwwwgwwwwwwwww',
  ' gggggggggggg            '
], {
  g: function(l) { return l; },
  M: function(l) { return l.bold.magenta.inverse; },
  w: function(l) { return l.bold; },
});

var rainbow = [
  [
    function(l) { return l.red; },
    function(l) { return function(c) { return l(' '); } }
  ],
  [
    function(l) { return l.bgRed.yellow; },
    function(l) { return l.bold.red.bgRed; }
  ],
  [
    function(l) { return l.bgYellow.green; },
    function(l) { return l.bold.yellow.bgYellow; }
  ],
  [
    function(l) { return l.bgGreen.blue; },
    function(l) { return l.bold.green.bgGreen; }
  ],
  [
    function(l) { return l.inverse.blue; },
    function(l) { return l.bold.blue.bgBlue; }
  ]
];

function drawRainbow(line, colors, width, step) {
  var wave = '\u2584\u2591';
  return Array.apply(null, Array(width)).reduce(function(l, val, idx) {
    return ((idx + step) % 8) < 4 ?
      colors[0](l)(wave[0]) :
      colors[1](l)(wave[1]);
  }, line);
}

function drawNyan(nyan, line, idx) {
  return nyan[idx].reduce(function(l, obj) {
    return obj.color(l)(obj.text);
  }, line);
}

function onProgress(progress, message) {
  var step = shift++;
  var progressWidth = Math.ceil(progress * 50);

  if (hasProgress)
    console.log(clor.cursorUp(rainbow.length + 2).string); // eslint-disable-line no-console
  hasProgress = true;
  for (var i = 0; i < rainbow.length; i++) {
    var line = drawRainbow(clor.eraseLine, rainbow[i], progressWidth, step);
    var nyanLine = i + ((step % 8 < 4) ? -1 : 0);
    if (nyanLine < 4 && nyanLine >= 0) {
      line = drawNyan(progress === 1 ? nyanSuccess : nyanProgress, line, nyanLine);
    }

    console.log(line.string); // eslint-disable-line no-console
  }
  console.log(clor.eraseLine.cyan(message).string); // eslint-disable-line no-console
}

var timer = 0;

module.exports = function NyanProgressPlugin() {
  return new webpack.ProgressPlugin(function(progress, message) {
    var now = new Date().getTime();
    if (now - timer > 250 || progress === 1) {
      timer = now;
      onProgress(progress, message);
    }
  });
};
