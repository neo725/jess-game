(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function() {
  var bingo_grid_size, i;
  bingo_grid_size = [];
  i = 5;
  while (i < 11) {
    bingo_grid_size.push({
      label: i + " x " + i,
      value: i
    });
    i++;
  }
  return {
    bingo_grid_size: bingo_grid_size
  };
};

},{}],2:[function(require,module,exports){
module.exports = {
  shuffle: function(array) {
    var currentIndex, randomIndex, temporaryValue;
    currentIndex = array.length;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  },
  checkBingoLines: function(rows) {
    var count, i, j, lines, size;
    lines = [];
    size = rows.length;
    i = 0;
    while (i < size) {
      j = 0;
      count = 0;
      while (j < size) {
        if (rows[i].cols[j].clicked) {
          count += 1;
        }
        j++;
      }
      if (count === size) {
        lines.push({
          type: 'row',
          index: i
        });
      }
      i++;
    }
    i = 0;
    while (i < size) {
      j = 0;
      count = 0;
      while (j < size) {
        if (rows[j].cols[i].clicked) {
          count += 1;
        }
        j++;
      }
      if (count === size) {
        lines.push({
          type: 'col',
          index: i
        });
      }
      i++;
    }
    i = 0;
    count = 0;
    while (i < size) {
      if (rows[i].cols[i].clicked) {
        count += 1;
      }
      i++;
    }
    if (count === size) {
      lines.push({
        type: 'lt-rd'
      });
    }
    i = 0;
    count = 0;
    while (i < size) {
      if (rows[i].cols[size - (i + 1)].clicked) {
        count += 1;
      }
      i++;
    }
    if (count === size) {
      lines.push({
        type: 'rt-ld'
      });
    }
    return lines;
  }
};

},{}],3:[function(require,module,exports){
var constants, util;

constants = require('../common/constants')();

util = require('../common/util');

module.exports = [
  '$scope', '$log', 'BingoSocket', function($scope, $log, BingoSocket) {
    var col_width, space_width;
    $scope.socket_status = {
      connected: 'OFF'
    };
    BingoSocket.on('connect', function() {
      var checkConnected, connectionNotReady;
      $scope.socket_status.connected = 'ON';
      connectionNotReady = function() {
        BingoSocket.removeListener('receive-user-guid');
        BingoSocket.removeListener('room-created');
        BingoSocket.removeListener('join-room-result');
        BingoSocket.removeListener('game-on');
        BingoSocket.removeListener('choice-number');
        BingoSocket.removeListener('disconnected');
        $scope.$apply(function() {
          return $scope.socket_status.connected = 'OFF';
        });
        return delete $scope.socket_status['guid'];
      };
      BingoSocket.on('receive-user-guid', function(guid) {
        $log.info(guid);
        return $scope.socket_status.guid = guid;
      });
      BingoSocket.on('room-created', function(id) {
        return $scope.room_id = id;
      });
      BingoSocket.on('join-room-result', function(result) {
        if (result.status === false) {
          return alert('join room : false');
        }
        $scope.room_id = result.id;
        _.forEach($scope.bingo_grid_size, function(item) {
          if (item.value === result.size) {
            return $scope.conf.grid_size_selected = item;
          }
        });
        return $scope.draw(false);
      });
      BingoSocket.on('game-on', function() {
        return $scope.my_turn = true;
      });
      BingoSocket.on('choice-number', function(data) {
        $scope.conf.find_number = data.number;
        $scope.findNumber(false);
        return responsiveVoice.speak(data.number + "號", "Chinese Female");
      });
      BingoSocket.on('disconnected', function() {
        return connectionNotReady();
      });
      checkConnected = function() {
        if (!BingoSocket.socket.connected) {
          connectionNotReady();
        }
        return setTimeout(checkConnected, 1000);
      };
      return checkConnected();
    });
    $scope.conf = {};
    $scope.rows = [];
    $scope.step = '';
    $scope.my_turn = false;
    col_width = 30 + (5 * 2) + (3 * 2);
    space_width = 10;
    $scope.bingo_grid_size = constants.bingo_grid_size;
    $scope.draw = function(create_room) {
      var count, i, j, makeCols, numbers, row, rows, size, total_width;
      if (create_room == null) {
        create_room = true;
      }
      numbers = [];
      size = $scope.conf.grid_size_selected;
      count = size.value;
      i = 0;
      while (i < (count * count)) {
        numbers.push(i + 1);
        i++;
      }
      numbers = util.shuffle(numbers);
      makeCols = function(count) {
        var col, cols;
        cols = [];
        i = 0;
        while (i < count) {
          col = {
            value: numbers.pop()
          };
          cols.push(col);
          i++;
        }
        return cols;
      };
      rows = [];
      j = 0;
      while (j < count) {
        row = {
          cols: makeCols(count)
        };
        rows.push(row);
        j++;
      }
      $scope.rows = rows;
      total_width = (col_width * count) + ((count - 1) * space_width);
      $scope.draw = SVG('grid-svg-canvas').size(total_width, total_width);
      $scope.step = 'step-play';
      if (create_room === true && $scope.socket_status.connected === 'ON') {
        BingoSocket.emit('create-room', {
          size: count
        });
      }
    };
    $scope.clickNumber = function(col, send_event) {
      var count, lines, toggleClicked;
      if (send_event == null) {
        send_event = true;
      }
      if (send_event === true && $scope.my_turn === false) {
        return;
      }
      if (col.clicked === true) {
        return;
      }
      toggleClicked = function(col) {
        if (col.clicked) {
          col.clicked = !col.clicked;
          return col;
        }
        col.clicked = true;
        return col;
      };
      col = toggleClicked(col);
      if (col.clicked === true) {
        $scope.last_col = col;
      } else {
        delete $scope['last_col'];
      }
      if (send_event === true) {
        $scope.my_turn = false;
        BingoSocket.emit('click-number', {
          room_id: $scope.room_id,
          value: col.value
        });
      }
      $scope.draw.clear();
      lines = util.checkBingoLines($scope.rows);
      count = $scope.rows.length;
      $scope.lines = lines;
      return _.each(lines, function(line) {
        var point;
        point = {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0
        };
        if (line.type === 'row') {
          point.x1 = 0;
          point.y1 = ((col_width * ++line.index) + (space_width * line.index)) - ((col_width / 2) + space_width);
          point.x2 = (col_width * count) + ((count - 1) * space_width);
          point.y2 = point.y1;
        }
        if (line.type === 'col') {
          point.x1 = ((col_width * ++line.index) + (space_width * line.index)) - ((col_width / 2) + space_width);
          point.y1 = 0;
          point.x2 = point.x1;
          point.y2 = (col_width * count) + ((count - 1) * space_width);
        }
        if (line.type === 'lt-rd') {
          point.x1 = 0;
          point.y1 = 0;
          point.x2 = (col_width * count) + ((count - 1) * space_width);
          point.y2 = point.x2;
        }
        if (line.type === 'rt-ld') {
          point.x1 = (col_width * count) + ((count - 1) * space_width);
          point.y1 = 0;
          point.x2 = 0;
          point.y2 = point.x1;
        }
        $log.info(point);
        return $scope.draw.line(point.x1, point.y1, point.x2, point.y2).stroke({
          width: 10,
          color: '#f06',
          linecap: 'round'
        });
      });
    };
    $scope.findNumber = function(send_event) {
      var i, j;
      if (send_event == null) {
        send_event = true;
      }
      i = 0;
      while (i < $scope.rows.length) {
        j = 0;
        while (j < $scope.rows.length) {
          if ($scope.rows[i].cols[j].value === $scope.conf.find_number) {
            $scope.clickNumber($scope.rows[i].cols[j], send_event);
            $scope.conf.find_number = '';
            return;
          }
          j++;
        }
        i++;
      }
    };
    return $scope.join = function() {
      var room_id;
      room_id = $scope.conf.room_id;
      return BingoSocket.emit('join-room', {
        id: room_id
      });
    };
  }
];

},{"../common/constants":1,"../common/util":2}],4:[function(require,module,exports){
module.exports = [
  '$log', 'socketFactory', function($log, socketFactory) {
    var factory, socket;
    socket = io.connect(conf.socket_io_host);
    factory = socketFactory({
      ioSocket: socket
    });
    factory.socket = socket;
    return factory;
  }
];

},{}],5:[function(require,module,exports){
angular.module('jess-game', ['ngRoute', 'btford.socket-io']).factory('BingoSocket', require('./factory/bingo-socket-factory')).controller('BingoController', require('./controller/bingo-controller')).config([
  '$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
    $locationProvider.hashPrefix('!');
    $routeProvider.when('/bingo', {
      templateUrl: 'partial/_bingo.html'
    }).when('/1a2b', {
      templateUrl: 'partial/_1a2b.html'
    });
    return $routeProvider.otherwise({
      redirectTo: '/bingo'
    });
  }
]);

},{"./controller/bingo-controller":3,"./factory/bingo-socket-factory":4}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhc3NldHMvYnVpbGQvY29mZmVlaWZ5L2NvbW1vbi9jb25zdGFudHMuanMiLCJhc3NldHMvYnVpbGQvY29mZmVlaWZ5L2NvbW1vbi91dGlsLmpzIiwiYXNzZXRzL2J1aWxkL2NvZmZlZWlmeS9jb250cm9sbGVyL2JpbmdvLWNvbnRyb2xsZXIuanMiLCJhc3NldHMvYnVpbGQvY29mZmVlaWZ5L2ZhY3RvcnkvYmluZ28tc29ja2V0LWZhY3RvcnkuanMiLCJhc3NldHMvYnVpbGQvY29mZmVlaWZ5L21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGJpbmdvX2dyaWRfc2l6ZSwgaTtcbiAgYmluZ29fZ3JpZF9zaXplID0gW107XG4gIGkgPSA1O1xuICB3aGlsZSAoaSA8IDExKSB7XG4gICAgYmluZ29fZ3JpZF9zaXplLnB1c2goe1xuICAgICAgbGFiZWw6IGkgKyBcIiB4IFwiICsgaSxcbiAgICAgIHZhbHVlOiBpXG4gICAgfSk7XG4gICAgaSsrO1xuICB9XG4gIHJldHVybiB7XG4gICAgYmluZ29fZ3JpZF9zaXplOiBiaW5nb19ncmlkX3NpemVcbiAgfTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgc2h1ZmZsZTogZnVuY3Rpb24oYXJyYXkpIHtcbiAgICB2YXIgY3VycmVudEluZGV4LCByYW5kb21JbmRleCwgdGVtcG9yYXJ5VmFsdWU7XG4gICAgY3VycmVudEluZGV4ID0gYXJyYXkubGVuZ3RoO1xuICAgIHdoaWxlICgwICE9PSBjdXJyZW50SW5kZXgpIHtcbiAgICAgIHJhbmRvbUluZGV4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY3VycmVudEluZGV4KTtcbiAgICAgIGN1cnJlbnRJbmRleCAtPSAxO1xuICAgICAgdGVtcG9yYXJ5VmFsdWUgPSBhcnJheVtjdXJyZW50SW5kZXhdO1xuICAgICAgYXJyYXlbY3VycmVudEluZGV4XSA9IGFycmF5W3JhbmRvbUluZGV4XTtcbiAgICAgIGFycmF5W3JhbmRvbUluZGV4XSA9IHRlbXBvcmFyeVZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXk7XG4gIH0sXG4gIGNoZWNrQmluZ29MaW5lczogZnVuY3Rpb24ocm93cykge1xuICAgIHZhciBjb3VudCwgaSwgaiwgbGluZXMsIHNpemU7XG4gICAgbGluZXMgPSBbXTtcbiAgICBzaXplID0gcm93cy5sZW5ndGg7XG4gICAgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBzaXplKSB7XG4gICAgICBqID0gMDtcbiAgICAgIGNvdW50ID0gMDtcbiAgICAgIHdoaWxlIChqIDwgc2l6ZSkge1xuICAgICAgICBpZiAocm93c1tpXS5jb2xzW2pdLmNsaWNrZWQpIHtcbiAgICAgICAgICBjb3VudCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGorKztcbiAgICAgIH1cbiAgICAgIGlmIChjb3VudCA9PT0gc2l6ZSkge1xuICAgICAgICBsaW5lcy5wdXNoKHtcbiAgICAgICAgICB0eXBlOiAncm93JyxcbiAgICAgICAgICBpbmRleDogaVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICB9XG4gICAgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBzaXplKSB7XG4gICAgICBqID0gMDtcbiAgICAgIGNvdW50ID0gMDtcbiAgICAgIHdoaWxlIChqIDwgc2l6ZSkge1xuICAgICAgICBpZiAocm93c1tqXS5jb2xzW2ldLmNsaWNrZWQpIHtcbiAgICAgICAgICBjb3VudCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGorKztcbiAgICAgIH1cbiAgICAgIGlmIChjb3VudCA9PT0gc2l6ZSkge1xuICAgICAgICBsaW5lcy5wdXNoKHtcbiAgICAgICAgICB0eXBlOiAnY29sJyxcbiAgICAgICAgICBpbmRleDogaVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICB9XG4gICAgaSA9IDA7XG4gICAgY291bnQgPSAwO1xuICAgIHdoaWxlIChpIDwgc2l6ZSkge1xuICAgICAgaWYgKHJvd3NbaV0uY29sc1tpXS5jbGlja2VkKSB7XG4gICAgICAgIGNvdW50ICs9IDE7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgfVxuICAgIGlmIChjb3VudCA9PT0gc2l6ZSkge1xuICAgICAgbGluZXMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdsdC1yZCdcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpID0gMDtcbiAgICBjb3VudCA9IDA7XG4gICAgd2hpbGUgKGkgPCBzaXplKSB7XG4gICAgICBpZiAocm93c1tpXS5jb2xzW3NpemUgLSAoaSArIDEpXS5jbGlja2VkKSB7XG4gICAgICAgIGNvdW50ICs9IDE7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgfVxuICAgIGlmIChjb3VudCA9PT0gc2l6ZSkge1xuICAgICAgbGluZXMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdydC1sZCdcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gbGluZXM7XG4gIH1cbn07XG4iLCJ2YXIgY29uc3RhbnRzLCB1dGlsO1xuXG5jb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb21tb24vY29uc3RhbnRzJykoKTtcblxudXRpbCA9IHJlcXVpcmUoJy4uL2NvbW1vbi91dGlsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gW1xuICAnJHNjb3BlJywgJyRsb2cnLCAnQmluZ29Tb2NrZXQnLCBmdW5jdGlvbigkc2NvcGUsICRsb2csIEJpbmdvU29ja2V0KSB7XG4gICAgdmFyIGNvbF93aWR0aCwgc3BhY2Vfd2lkdGg7XG4gICAgJHNjb3BlLnNvY2tldF9zdGF0dXMgPSB7XG4gICAgICBjb25uZWN0ZWQ6ICdPRkYnXG4gICAgfTtcbiAgICBCaW5nb1NvY2tldC5vbignY29ubmVjdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGNoZWNrQ29ubmVjdGVkLCBjb25uZWN0aW9uTm90UmVhZHk7XG4gICAgICAkc2NvcGUuc29ja2V0X3N0YXR1cy5jb25uZWN0ZWQgPSAnT04nO1xuICAgICAgY29ubmVjdGlvbk5vdFJlYWR5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIEJpbmdvU29ja2V0LnJlbW92ZUxpc3RlbmVyKCdyZWNlaXZlLXVzZXItZ3VpZCcpO1xuICAgICAgICBCaW5nb1NvY2tldC5yZW1vdmVMaXN0ZW5lcigncm9vbS1jcmVhdGVkJyk7XG4gICAgICAgIEJpbmdvU29ja2V0LnJlbW92ZUxpc3RlbmVyKCdqb2luLXJvb20tcmVzdWx0Jyk7XG4gICAgICAgIEJpbmdvU29ja2V0LnJlbW92ZUxpc3RlbmVyKCdnYW1lLW9uJyk7XG4gICAgICAgIEJpbmdvU29ja2V0LnJlbW92ZUxpc3RlbmVyKCdjaG9pY2UtbnVtYmVyJyk7XG4gICAgICAgIEJpbmdvU29ja2V0LnJlbW92ZUxpc3RlbmVyKCdkaXNjb25uZWN0ZWQnKTtcbiAgICAgICAgJHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLnNvY2tldF9zdGF0dXMuY29ubmVjdGVkID0gJ09GRic7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVsZXRlICRzY29wZS5zb2NrZXRfc3RhdHVzWydndWlkJ107XG4gICAgICB9O1xuICAgICAgQmluZ29Tb2NrZXQub24oJ3JlY2VpdmUtdXNlci1ndWlkJywgZnVuY3Rpb24oZ3VpZCkge1xuICAgICAgICAkbG9nLmluZm8oZ3VpZCk7XG4gICAgICAgIHJldHVybiAkc2NvcGUuc29ja2V0X3N0YXR1cy5ndWlkID0gZ3VpZDtcbiAgICAgIH0pO1xuICAgICAgQmluZ29Tb2NrZXQub24oJ3Jvb20tY3JlYXRlZCcsIGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHJldHVybiAkc2NvcGUucm9vbV9pZCA9IGlkO1xuICAgICAgfSk7XG4gICAgICBCaW5nb1NvY2tldC5vbignam9pbi1yb29tLXJlc3VsdCcsIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gZmFsc2UpIHtcbiAgICAgICAgICByZXR1cm4gYWxlcnQoJ2pvaW4gcm9vbSA6IGZhbHNlJyk7XG4gICAgICAgIH1cbiAgICAgICAgJHNjb3BlLnJvb21faWQgPSByZXN1bHQuaWQ7XG4gICAgICAgIF8uZm9yRWFjaCgkc2NvcGUuYmluZ29fZ3JpZF9zaXplLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgaWYgKGl0ZW0udmFsdWUgPT09IHJlc3VsdC5zaXplKSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLmNvbmYuZ3JpZF9zaXplX3NlbGVjdGVkID0gaXRlbTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gJHNjb3BlLmRyYXcoZmFsc2UpO1xuICAgICAgfSk7XG4gICAgICBCaW5nb1NvY2tldC5vbignZ2FtZS1vbicsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJHNjb3BlLm15X3R1cm4gPSB0cnVlO1xuICAgICAgfSk7XG4gICAgICBCaW5nb1NvY2tldC5vbignY2hvaWNlLW51bWJlcicsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgJHNjb3BlLmNvbmYuZmluZF9udW1iZXIgPSBkYXRhLm51bWJlcjtcbiAgICAgICAgJHNjb3BlLmZpbmROdW1iZXIoZmFsc2UpO1xuICAgICAgICByZXR1cm4gcmVzcG9uc2l2ZVZvaWNlLnNwZWFrKGRhdGEubnVtYmVyICsgXCLomZ9cIiwgXCJDaGluZXNlIEZlbWFsZVwiKTtcbiAgICAgIH0pO1xuICAgICAgQmluZ29Tb2NrZXQub24oJ2Rpc2Nvbm5lY3RlZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gY29ubmVjdGlvbk5vdFJlYWR5KCk7XG4gICAgICB9KTtcbiAgICAgIGNoZWNrQ29ubmVjdGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghQmluZ29Tb2NrZXQuc29ja2V0LmNvbm5lY3RlZCkge1xuICAgICAgICAgIGNvbm5lY3Rpb25Ob3RSZWFkeSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGNoZWNrQ29ubmVjdGVkLCAxMDAwKTtcbiAgICAgIH07XG4gICAgICByZXR1cm4gY2hlY2tDb25uZWN0ZWQoKTtcbiAgICB9KTtcbiAgICAkc2NvcGUuY29uZiA9IHt9O1xuICAgICRzY29wZS5yb3dzID0gW107XG4gICAgJHNjb3BlLnN0ZXAgPSAnJztcbiAgICAkc2NvcGUubXlfdHVybiA9IGZhbHNlO1xuICAgIGNvbF93aWR0aCA9IDMwICsgKDUgKiAyKSArICgzICogMik7XG4gICAgc3BhY2Vfd2lkdGggPSAxMDtcbiAgICAkc2NvcGUuYmluZ29fZ3JpZF9zaXplID0gY29uc3RhbnRzLmJpbmdvX2dyaWRfc2l6ZTtcbiAgICAkc2NvcGUuZHJhdyA9IGZ1bmN0aW9uKGNyZWF0ZV9yb29tKSB7XG4gICAgICB2YXIgY291bnQsIGksIGosIG1ha2VDb2xzLCBudW1iZXJzLCByb3csIHJvd3MsIHNpemUsIHRvdGFsX3dpZHRoO1xuICAgICAgaWYgKGNyZWF0ZV9yb29tID09IG51bGwpIHtcbiAgICAgICAgY3JlYXRlX3Jvb20gPSB0cnVlO1xuICAgICAgfVxuICAgICAgbnVtYmVycyA9IFtdO1xuICAgICAgc2l6ZSA9ICRzY29wZS5jb25mLmdyaWRfc2l6ZV9zZWxlY3RlZDtcbiAgICAgIGNvdW50ID0gc2l6ZS52YWx1ZTtcbiAgICAgIGkgPSAwO1xuICAgICAgd2hpbGUgKGkgPCAoY291bnQgKiBjb3VudCkpIHtcbiAgICAgICAgbnVtYmVycy5wdXNoKGkgKyAxKTtcbiAgICAgICAgaSsrO1xuICAgICAgfVxuICAgICAgbnVtYmVycyA9IHV0aWwuc2h1ZmZsZShudW1iZXJzKTtcbiAgICAgIG1ha2VDb2xzID0gZnVuY3Rpb24oY291bnQpIHtcbiAgICAgICAgdmFyIGNvbCwgY29scztcbiAgICAgICAgY29scyA9IFtdO1xuICAgICAgICBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCBjb3VudCkge1xuICAgICAgICAgIGNvbCA9IHtcbiAgICAgICAgICAgIHZhbHVlOiBudW1iZXJzLnBvcCgpXG4gICAgICAgICAgfTtcbiAgICAgICAgICBjb2xzLnB1c2goY29sKTtcbiAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbHM7XG4gICAgICB9O1xuICAgICAgcm93cyA9IFtdO1xuICAgICAgaiA9IDA7XG4gICAgICB3aGlsZSAoaiA8IGNvdW50KSB7XG4gICAgICAgIHJvdyA9IHtcbiAgICAgICAgICBjb2xzOiBtYWtlQ29scyhjb3VudClcbiAgICAgICAgfTtcbiAgICAgICAgcm93cy5wdXNoKHJvdyk7XG4gICAgICAgIGorKztcbiAgICAgIH1cbiAgICAgICRzY29wZS5yb3dzID0gcm93cztcbiAgICAgIHRvdGFsX3dpZHRoID0gKGNvbF93aWR0aCAqIGNvdW50KSArICgoY291bnQgLSAxKSAqIHNwYWNlX3dpZHRoKTtcbiAgICAgICRzY29wZS5kcmF3ID0gU1ZHKCdncmlkLXN2Zy1jYW52YXMnKS5zaXplKHRvdGFsX3dpZHRoLCB0b3RhbF93aWR0aCk7XG4gICAgICAkc2NvcGUuc3RlcCA9ICdzdGVwLXBsYXknO1xuICAgICAgaWYgKGNyZWF0ZV9yb29tID09PSB0cnVlICYmICRzY29wZS5zb2NrZXRfc3RhdHVzLmNvbm5lY3RlZCA9PT0gJ09OJykge1xuICAgICAgICBCaW5nb1NvY2tldC5lbWl0KCdjcmVhdGUtcm9vbScsIHtcbiAgICAgICAgICBzaXplOiBjb3VudFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICAgICRzY29wZS5jbGlja051bWJlciA9IGZ1bmN0aW9uKGNvbCwgc2VuZF9ldmVudCkge1xuICAgICAgdmFyIGNvdW50LCBsaW5lcywgdG9nZ2xlQ2xpY2tlZDtcbiAgICAgIGlmIChzZW5kX2V2ZW50ID09IG51bGwpIHtcbiAgICAgICAgc2VuZF9ldmVudCA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAoc2VuZF9ldmVudCA9PT0gdHJ1ZSAmJiAkc2NvcGUubXlfdHVybiA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKGNvbC5jbGlja2VkID09PSB0cnVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRvZ2dsZUNsaWNrZWQgPSBmdW5jdGlvbihjb2wpIHtcbiAgICAgICAgaWYgKGNvbC5jbGlja2VkKSB7XG4gICAgICAgICAgY29sLmNsaWNrZWQgPSAhY29sLmNsaWNrZWQ7XG4gICAgICAgICAgcmV0dXJuIGNvbDtcbiAgICAgICAgfVxuICAgICAgICBjb2wuY2xpY2tlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiBjb2w7XG4gICAgICB9O1xuICAgICAgY29sID0gdG9nZ2xlQ2xpY2tlZChjb2wpO1xuICAgICAgaWYgKGNvbC5jbGlja2VkID09PSB0cnVlKSB7XG4gICAgICAgICRzY29wZS5sYXN0X2NvbCA9IGNvbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlbGV0ZSAkc2NvcGVbJ2xhc3RfY29sJ107XG4gICAgICB9XG4gICAgICBpZiAoc2VuZF9ldmVudCA9PT0gdHJ1ZSkge1xuICAgICAgICAkc2NvcGUubXlfdHVybiA9IGZhbHNlO1xuICAgICAgICBCaW5nb1NvY2tldC5lbWl0KCdjbGljay1udW1iZXInLCB7XG4gICAgICAgICAgcm9vbV9pZDogJHNjb3BlLnJvb21faWQsXG4gICAgICAgICAgdmFsdWU6IGNvbC52YWx1ZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgICRzY29wZS5kcmF3LmNsZWFyKCk7XG4gICAgICBsaW5lcyA9IHV0aWwuY2hlY2tCaW5nb0xpbmVzKCRzY29wZS5yb3dzKTtcbiAgICAgIGNvdW50ID0gJHNjb3BlLnJvd3MubGVuZ3RoO1xuICAgICAgJHNjb3BlLmxpbmVzID0gbGluZXM7XG4gICAgICByZXR1cm4gXy5lYWNoKGxpbmVzLCBmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgIHZhciBwb2ludDtcbiAgICAgICAgcG9pbnQgPSB7XG4gICAgICAgICAgeDE6IDAsXG4gICAgICAgICAgeTE6IDAsXG4gICAgICAgICAgeDI6IDAsXG4gICAgICAgICAgeTI6IDBcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGxpbmUudHlwZSA9PT0gJ3JvdycpIHtcbiAgICAgICAgICBwb2ludC54MSA9IDA7XG4gICAgICAgICAgcG9pbnQueTEgPSAoKGNvbF93aWR0aCAqICsrbGluZS5pbmRleCkgKyAoc3BhY2Vfd2lkdGggKiBsaW5lLmluZGV4KSkgLSAoKGNvbF93aWR0aCAvIDIpICsgc3BhY2Vfd2lkdGgpO1xuICAgICAgICAgIHBvaW50LngyID0gKGNvbF93aWR0aCAqIGNvdW50KSArICgoY291bnQgLSAxKSAqIHNwYWNlX3dpZHRoKTtcbiAgICAgICAgICBwb2ludC55MiA9IHBvaW50LnkxO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsaW5lLnR5cGUgPT09ICdjb2wnKSB7XG4gICAgICAgICAgcG9pbnQueDEgPSAoKGNvbF93aWR0aCAqICsrbGluZS5pbmRleCkgKyAoc3BhY2Vfd2lkdGggKiBsaW5lLmluZGV4KSkgLSAoKGNvbF93aWR0aCAvIDIpICsgc3BhY2Vfd2lkdGgpO1xuICAgICAgICAgIHBvaW50LnkxID0gMDtcbiAgICAgICAgICBwb2ludC54MiA9IHBvaW50LngxO1xuICAgICAgICAgIHBvaW50LnkyID0gKGNvbF93aWR0aCAqIGNvdW50KSArICgoY291bnQgLSAxKSAqIHNwYWNlX3dpZHRoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGluZS50eXBlID09PSAnbHQtcmQnKSB7XG4gICAgICAgICAgcG9pbnQueDEgPSAwO1xuICAgICAgICAgIHBvaW50LnkxID0gMDtcbiAgICAgICAgICBwb2ludC54MiA9IChjb2xfd2lkdGggKiBjb3VudCkgKyAoKGNvdW50IC0gMSkgKiBzcGFjZV93aWR0aCk7XG4gICAgICAgICAgcG9pbnQueTIgPSBwb2ludC54MjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGluZS50eXBlID09PSAncnQtbGQnKSB7XG4gICAgICAgICAgcG9pbnQueDEgPSAoY29sX3dpZHRoICogY291bnQpICsgKChjb3VudCAtIDEpICogc3BhY2Vfd2lkdGgpO1xuICAgICAgICAgIHBvaW50LnkxID0gMDtcbiAgICAgICAgICBwb2ludC54MiA9IDA7XG4gICAgICAgICAgcG9pbnQueTIgPSBwb2ludC54MTtcbiAgICAgICAgfVxuICAgICAgICAkbG9nLmluZm8ocG9pbnQpO1xuICAgICAgICByZXR1cm4gJHNjb3BlLmRyYXcubGluZShwb2ludC54MSwgcG9pbnQueTEsIHBvaW50LngyLCBwb2ludC55Mikuc3Ryb2tlKHtcbiAgICAgICAgICB3aWR0aDogMTAsXG4gICAgICAgICAgY29sb3I6ICcjZjA2JyxcbiAgICAgICAgICBsaW5lY2FwOiAncm91bmQnXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICAkc2NvcGUuZmluZE51bWJlciA9IGZ1bmN0aW9uKHNlbmRfZXZlbnQpIHtcbiAgICAgIHZhciBpLCBqO1xuICAgICAgaWYgKHNlbmRfZXZlbnQgPT0gbnVsbCkge1xuICAgICAgICBzZW5kX2V2ZW50ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGkgPSAwO1xuICAgICAgd2hpbGUgKGkgPCAkc2NvcGUucm93cy5sZW5ndGgpIHtcbiAgICAgICAgaiA9IDA7XG4gICAgICAgIHdoaWxlIChqIDwgJHNjb3BlLnJvd3MubGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKCRzY29wZS5yb3dzW2ldLmNvbHNbal0udmFsdWUgPT09ICRzY29wZS5jb25mLmZpbmRfbnVtYmVyKSB7XG4gICAgICAgICAgICAkc2NvcGUuY2xpY2tOdW1iZXIoJHNjb3BlLnJvd3NbaV0uY29sc1tqXSwgc2VuZF9ldmVudCk7XG4gICAgICAgICAgICAkc2NvcGUuY29uZi5maW5kX251bWJlciA9ICcnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBqKys7XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuICRzY29wZS5qb2luID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcm9vbV9pZDtcbiAgICAgIHJvb21faWQgPSAkc2NvcGUuY29uZi5yb29tX2lkO1xuICAgICAgcmV0dXJuIEJpbmdvU29ja2V0LmVtaXQoJ2pvaW4tcm9vbScsIHtcbiAgICAgICAgaWQ6IHJvb21faWRcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cbl07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcbiAgJyRsb2cnLCAnc29ja2V0RmFjdG9yeScsIGZ1bmN0aW9uKCRsb2csIHNvY2tldEZhY3RvcnkpIHtcbiAgICB2YXIgZmFjdG9yeSwgc29ja2V0O1xuICAgIHNvY2tldCA9IGlvLmNvbm5lY3QoY29uZi5zb2NrZXRfaW9faG9zdCk7XG4gICAgZmFjdG9yeSA9IHNvY2tldEZhY3Rvcnkoe1xuICAgICAgaW9Tb2NrZXQ6IHNvY2tldFxuICAgIH0pO1xuICAgIGZhY3Rvcnkuc29ja2V0ID0gc29ja2V0O1xuICAgIHJldHVybiBmYWN0b3J5O1xuICB9XG5dO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2plc3MtZ2FtZScsIFsnbmdSb3V0ZScsICdidGZvcmQuc29ja2V0LWlvJ10pLmZhY3RvcnkoJ0JpbmdvU29ja2V0JywgcmVxdWlyZSgnLi9mYWN0b3J5L2JpbmdvLXNvY2tldC1mYWN0b3J5JykpLmNvbnRyb2xsZXIoJ0JpbmdvQ29udHJvbGxlcicsIHJlcXVpcmUoJy4vY29udHJvbGxlci9iaW5nby1jb250cm9sbGVyJykpLmNvbmZpZyhbXG4gICckbG9jYXRpb25Qcm92aWRlcicsICckcm91dGVQcm92aWRlcicsIGZ1bmN0aW9uKCRsb2NhdGlvblByb3ZpZGVyLCAkcm91dGVQcm92aWRlcikge1xuICAgICRsb2NhdGlvblByb3ZpZGVyLmhhc2hQcmVmaXgoJyEnKTtcbiAgICAkcm91dGVQcm92aWRlci53aGVuKCcvYmluZ28nLCB7XG4gICAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWwvX2JpbmdvLmh0bWwnXG4gICAgfSkud2hlbignLzFhMmInLCB7XG4gICAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWwvXzFhMmIuaHRtbCdcbiAgICB9KTtcbiAgICByZXR1cm4gJHJvdXRlUHJvdmlkZXIub3RoZXJ3aXNlKHtcbiAgICAgIHJlZGlyZWN0VG86ICcvYmluZ28nXG4gICAgfSk7XG4gIH1cbl0pO1xuIl19
