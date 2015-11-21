'use strict';
var AnsiEscapes = require('ansi-escapes');
var AnsiStyles = require('ansi-styles');
var webpack = require('webpack');

require('object.assign').shim();

var bold = AnsiStyles.bold;
var inverse = AnsiStyles.inverse;

var red = AnsiStyles.red;
var yellow = AnsiStyles.yellow;
var green = AnsiStyles.green;
var blue = AnsiStyles.blue;
var magenta = AnsiStyles.magenta;

var bgRed = AnsiStyles.bgRed;
var bgYellow = AnsiStyles.bgYellow;
var bgGreen = AnsiStyles.bgGreen;
var bgBlue = AnsiStyles.bgBlue;

var cursorUp = AnsiEscapes.cursorUp;
var cursorDown = AnsiEscapes.cursorDown;
var eraseEndLine = AnsiEscapes.eraseEndLine;
var cursorSavePosition = AnsiEscapes.cursorSavePosition;
var cursorRestorePosition = AnsiEscapes.cursorRestorePosition;

var width = 50;
var stdoutLineCount = 0;

var nyanTemplate = {
  ascii: [
    ' ,--------,     ',
    ' │▗▝ ▞ ▝ ˄---˄  ',
    '~│ ▞  ▞ ❬.◕‿‿◕.❭',
    ' `w-w---- w w   '
  ],
  colors: [
    ' ggggggggggg    ',
    ' gMMMMMMMggggg  ',
    'ggMMMMMMgwwwwwwg',
    ' gggggggggggg   '
  ]
};

var nyanSaysTemplate = {
  ascii: [
    ' ,--------,      ,(-)-.',
    ' │▗▝ ▞ ▝ ˄---˄  / (X) |',
    '~│ ▞  ▞ ❬.◕‿‿◕.❭--(-)-’',
    ' `w-w---- w w            '
  ],
  colors: [
    ' ggggggggggg     w(w)ww',
    ' gMMMMMMMggggg  ww(w)ww',
    'ggMMMMMMgwwwwwwgww(w)ww',
    ' gggggggggggg            '
  ]
};

var templateColorMap = {
  g: function(t) { return t; },
  M: function(t) { return wrap(bold, wrap(magenta, wrap(inverse, t))); },
  w: function(t) { return wrap(bold, t); }
}

function wrap(color, text) {
  return color.open + text + color.close;
}

function prepareNyan(template, colorToAscii, text) {
  text = text && text.toString();
  return template.ascii.map(function(row, idx) {
    return row.replace(/\((.)\)/, function(m, c) {
      return c === 'X' ? text : text.replace(/./g, c);
    }).split('').reduce(function (arr, chr, j) {
      var color = template.colors[idx][j];
      var last = arr[arr.length - 1];
      if (last && last.colorCode === color) {
        last.text += chr;
        return arr;
      } else {
        return arr.concat({
          colorCode: color,
          color: colorToAscii[color] || function(t) { return t; },
          text: chr
        });
      }
    }, []);
  });
}

var nyanDefault = prepareNyan(nyanTemplate, templateColorMap);

var rainbow = [
  [
    function(t) { return wrap(red, t); },
    function(t) { return t.replace(/./g, ' '); }
  ],
  [
    function(t) { return wrap(bgRed, wrap(yellow, t)); },
    function(t) { return wrap(bold, wrap(red, wrap(bgRed, t))); }
  ],
  [
    function(t) { return wrap(bgYellow, wrap(green, t)); },
    function(t) { return wrap(bold, wrap(yellow, wrap(bgYellow, t))); }
  ],
  [
    function(t) { return wrap(bgGreen, wrap(blue, t)); },
    function(t) { return wrap(bold, wrap(green, wrap(bgGreen, t))); }
  ],
  [
    function(t) { return wrap(inverse, wrap(blue, t)); },
    function(t) { return wrap(bold, wrap(blue, wrap(bgBlue, t))); }
  ]
];

function drawRainbow(colors, width, step) {
  var wave = ['\u2584', '\u2591'];
  var text = '';
  var line = '';
  var idx = step;
  for (var i = 0; i < width; i++) {
    text += wave[idx % 2];
    if((step + i) % 4 === 0) {
      line += colors[idx % 2](text);
      text = '';
      idx++;
    }
  }
  return text ? line + colors[idx % 2](text) : line;
}

function drawNyan(nyan, line, idx) {
  return nyan[idx].reduce(function(l, obj) {
    return l + obj.color(obj.text);
  }, line);
}

function onProgress(progress, messages, step, isInProgress, options) {
  var progressWidth = Math.ceil(progress * width);
  var nyanText = options.nyanCatSays(progress, messages);

  if (isInProgress) {
    if (options.restoreCursorPosition) {
      options.logger(cursorSavePosition + cursorUp(1));
    }
    options.logger(cursorUp(rainbow.length + stdoutLineCount + 2));
  } else {
    options.logger('');
  }

  for (var i = 0; i < rainbow.length; i++) {
    var line = drawRainbow(rainbow[i], progressWidth, step);
    var nyanLine = i + ((step % 8 < 4) ? -1 : 0);
    if (nyanLine < 4 && nyanLine >= 0) {
      line = drawNyan(
        nyanText ? prepareNyan(nyanSaysTemplate, templateColorMap, nyanText) : nyanDefault,
        line,
        nyanLine
      );
    }

    options.logger(line + eraseEndLine);
  }
  options.logger(options.getProgressMessage(progress, messages, AnsiStyles) +
    eraseEndLine + (!isInProgress ? cursorDown(1) : '')
  );
  if (isInProgress) {
    if (options.restoreCursorPosition) {
      options.logger(cursorRestorePosition + cursorUp(1));
    } else if (stdoutLineCount > 0) {
      options.logger(cursorDown(stdoutLineCount - 1));
    }
  }
}

module.exports = function NyanProgressPlugin(options) {
  var timer = 0;
  var shift = 0;
  var originalStdoutWrite;
  var isPrintingProgress = false;
  var isStarted = false;
  var startTime = 0;

  options = Object.assign({
    debounceInterval: 180,
    logger: console.log.bind(console), // eslint-disable-line no-console
    hookStdout: true,
    getProgressMessage: function(percentage, messages, styles) {
      return styles.cyan.open + messages[0] + styles.cyan.close +
        (messages[1] ?
          ' ' + styles.green.open + '(' + messages[1] + ')' + styles.green.close :
          ''
        );
    },
    nyanCatSays: function (progress) { return progress === 1 && 'Nyan!'; }
  }, options);

  if (options.hookStdout) {
    originalStdoutWrite = process.stdout.write;
    process.stdout.write = function(msg) {
      originalStdoutWrite.apply(process.stdout, arguments);
      if (isStarted && !isPrintingProgress) {
        stdoutLineCount += msg.split('\n').length - 1;
      }
    }
  }

  return new webpack.ProgressPlugin(function(progress, message) {
    var now = new Date().getTime();
    if (!isStarted) {
      onProgress(progress, [message], shift++, false, options);
      startTime = now;
      isStarted = true;
    } else if (progress === 1) {
      isPrintingProgress = true;
      var endTimeMessage = 'build time: ' + (now - startTime) / 1000 + 's';
      onProgress(progress, [message, endTimeMessage], shift++, true, options);
      isPrintingProgress = false;

      if (originalStdoutWrite) {
        process.stdout.write = originalStdoutWrite;
      }
      stdoutLineCount = 0;
      isStarted = false;
    } else if (now - timer > options.debounceInterval) {
      timer = now;
      isPrintingProgress = true;
      onProgress(progress, [message], shift++, true, options);
      isPrintingProgress = false;
    }
  });
};
