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
          color: mapColors[color] || ['reset'],
          text: chr
        });
      }
    }, []);
  });
}

var nyan = prepareNyan([
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
  g: ['bold', 'gray'],
  M: ['magenta', 'inverse'],
  w: ['bold']
});

var rainbow = [
  ['hidden', 'red', 'hidden', 'hidden'],
  ['bgRed', 'yellow', 'bgRed', 'red'],
  ['bgYellow', 'green', 'bgYellow', 'yellow'],
  ['bgGreen', 'blue', 'bgGreen', 'green'],
  ['inverse', 'blue', 'bgBlue', 'blue']
];

function drawRainbow(line, colors, width, step) {
  var wave = '\u2584\u2591';
  return Array.apply(null, Array(width)).reduce(function(l, val, idx) {
    return ((idx + step) % 8) < 4 ?
      l[colors[1]][colors[0]](wave[0]) :
      l[colors[3]][colors[2]].bold(colors[2] === 'hidden' ? ' ' : wave[1]);
  }, line);
}

function drawNyan(line, idx) {

  return nyan[idx].reduce(function(l, obj) {
    var color = obj.color;
    if (color[1]) {
      l = l[color[1]];
    }
    return l[color[0]](obj.text);
  }, line);
}

module.exports = function NyanProgressPlugin() {
  return new webpack.ProgressPlugin(function (progress, message) {
    if (++shift % 40) return;
    var step = shift / 40;

    const progressWidth = Math.ceil(progress * 50);
    if (hasProgress)
      console.log(clor.cursorUp(rainbow.length + 2).string); // eslint-disable-line no-console
    hasProgress = true;
    for (var i = 0; i < rainbow.length; i++) {
      var line = drawRainbow(clor.eraseLine, rainbow[i], progressWidth, step);
      var nyanLine = i + ((step % 8 < 4) ? -1 : 0);
      if (nyanLine < 4 && nyanLine >= 0) {
        line = drawNyan(line, nyanLine);
      }

      console.log(line.string); // eslint-disable-line no-console
    }
    console.log(clor.eraseLine.cyan(message).string); // eslint-disable-line no-console
  });
}