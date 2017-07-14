(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function() {
  var bingo_grid_size, guess_number_size, i;
  bingo_grid_size = [];
  i = 5;
  while (i < 11) {
    bingo_grid_size.push({
      label: i + " x " + i,
      value: i
    });
    i++;
  }
  guess_number_size = [];
  i = 4;
  while (i < 7) {
    guess_number_size.push({
      label: i,
      value: i
    });
    i++;
  }
  return {
    bingo_grid_size: bingo_grid_size,
    guess_number_size: guess_number_size
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
  '$scope', '$log', 'socket1a2b', function($scope, $log, socket1a2b) {
    var col_width, space_width, speakOut;
    $scope.socket_status = {
      connected: 'OFF'
    };
    $scope.conf = {};
    $scope.step = '';
    $scope.my_turn = false;
    $scope.count = 0;
    $scope.answer = [];
    $scope.else_guesses = [];
    $scope.your_guesses = [];
    col_width = 30 + (5 * 2) + (3 * 2);
    space_width = 10;
    $scope.guess_number_size = constants.guess_number_size;
    socket1a2b.on('connect', function() {
      var checkConnected, connectionNotReady;
      $scope.socket_status.connected = 'ON';
      connectionNotReady = function() {
        socket1a2b.removeListener('receive-user-guid');
        socket1a2b.removeListener('room-created');
        socket1a2b.removeListener('join-room-result');
        socket1a2b.removeListener('game-on');
        socket1a2b.removeListener('guess-number');
        socket1a2b.removeListener('guess-number-result');
        socket1a2b.removeListener('disconnected');
        $scope.$apply(function() {
          return $scope.socket_status.connected = 'OFF';
        });
        return delete $scope.socket_status['guid'];
      };
      socket1a2b.on('receive-user-guid', function(guid) {
        $log.info(guid);
        return $scope.socket_status.guid = guid;
      });
      socket1a2b.on('room-created', function(id) {
        return $scope.room_id = id;
      });
      socket1a2b.on('join-room-result', function(result) {
        if (result.status === false) {
          return alert('join room : false');
        }
        $scope.room_id = result.id;
        _.forEach($scope.guess_number_size, function(item) {
          if (item.value === result.size) {
            return $scope.conf.guess_number_size_selected = item;
          }
        });
        return $scope.draw(false);
      });
      socket1a2b.on('game-on', function() {
        return $scope.my_turn = true;
      });
      socket1a2b.on('guess-number', function(data) {
        var a, b, guess_cols, index, item, number, number_in_string;
        number = data.number;
        number_in_string = number.toString();
        a = 0;
        b = 0;
        index = 0;
        guess_cols = [];
        _.forEach(number_in_string, function(str) {
          var answer_index;
          guess_cols.push(str);
          answer_index = 0;
          _.forEach($scope.answer, function(answer_number) {
            if (str === answer_number.value.toString()) {
              if (answer_index === index) {
                a++;
              } else {
                b++;
              }
            }
            return answer_index++;
          });
          return index++;
        });
        item = {
          room_id: $scope.room_id,
          cols: guess_cols,
          a: a,
          b: b
        };
        $scope.else_guesses.push(item);
        socket1a2b.emit('return-guess-number', item);
        if (a < $scope.answer.length) {
          return $scope.my_turn = true;
        }
      });
      socket1a2b.on('guess-number-result', function(data) {
        $scope.your_guesses.push(data);
        if (data.a > 0 && data.b === 0 && data.a === $scope.count) {
          return speakOut("你贏了", "Chinese Female");
        } else {
          return speakOut(data.a + " A " + data.b + " B.", "Chinese Female");
        }
      });
      socket1a2b.on('disconnected', function() {
        return connectionNotReady();
      });
      checkConnected = function() {
        if (!socket1a2b.socket.connected) {
          connectionNotReady();
        }
        return setTimeout(checkConnected, 1000);
      };
      return checkConnected();
    });
    speakOut = function(text, voice) {
      $('#speakVoice').attr('onclick', 'responsiveVoice.speak("' + text + '", "Chinese Female");');
      return $('#speakVoice').trigger('click');
    };
    $scope.draw = function(create_room) {
      var col, cols, count, i, j, numbers, size;
      if (create_room == null) {
        create_room = true;
      }
      size = $scope.conf.guess_number_size_selected;
      count = size.value;
      $scope.count = count;
      numbers = [];
      i = 0;
      while (i < 10) {
        numbers.push(i);
        i++;
      }
      numbers = util.shuffle(numbers);
      cols = [];
      j = 0;
      while (j < count) {
        col = {
          value: numbers.pop()
        };
        cols.push(col);
        j++;
      }
      $scope.answer = cols;
      $scope.step = 'step-play';
      if (create_room === true && $scope.socket_status.connected === 'ON') {
        socket1a2b.emit('create-room', {
          size: count
        });
      }
    };
    $scope.join = function() {
      var room_id;
      room_id = $scope.conf.room_id;
      return socket1a2b.emit('join-room', {
        id: room_id
      });
    };
    return $scope.sendMyNumber = function() {
      var number, number_in_string;
      number = $scope.conf.my_number;
      number_in_string = number.toString();
      if (number_in_string.length !== $scope.answer.length) {
        speakOut("長度不正確", "Chinese Female");
        return;
      }
      $scope.my_turn = false;
      $scope.conf.my_number = '';
      return socket1a2b.emit('send-guess-number', {
        room_id: $scope.room_id,
        value: number
      });
    };
  }
];

},{"../common/constants":1,"../common/util":2}],4:[function(require,module,exports){
var constants, util;

constants = require('../common/constants')();

util = require('../common/util');

module.exports = [
  '$scope', '$log', 'BingoSocket', function($scope, $log, BingoSocket) {
    var col_width, space_width;
    $scope.socket_status = {
      connected: 'OFF'
    };
    $scope.conf = {};
    $scope.rows = [];
    $scope.step = '';
    $scope.my_turn = false;
    col_width = 30 + (5 * 2) + (3 * 2);
    space_width = 10;
    $scope.bingo_grid_size = constants.bingo_grid_size;
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

},{"../common/constants":1,"../common/util":2}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],7:[function(require,module,exports){
angular.module('jess-game', ['ngRoute', 'btford.socket-io']).factory('BingoSocket', require('./factory/bingo-socket-factory')).factory('socket1a2b', require('./factory/1a2b-socket-factory')).controller('BingoController', require('./controller/bingo-controller')).controller('1a2bController', require('./controller/1a2b-controller')).config([
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

},{"./controller/1a2b-controller":3,"./controller/bingo-controller":4,"./factory/1a2b-socket-factory":5,"./factory/bingo-socket-factory":6}]},{},[7])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhc3NldHMvYnVpbGQvY29mZmVlaWZ5L2NvbW1vbi9jb25zdGFudHMuanMiLCJhc3NldHMvYnVpbGQvY29mZmVlaWZ5L2NvbW1vbi91dGlsLmpzIiwiYXNzZXRzL2J1aWxkL2NvZmZlZWlmeS9jb250cm9sbGVyLzFhMmItY29udHJvbGxlci5qcyIsImFzc2V0cy9idWlsZC9jb2ZmZWVpZnkvY29udHJvbGxlci9iaW5nby1jb250cm9sbGVyLmpzIiwiYXNzZXRzL2J1aWxkL2NvZmZlZWlmeS9mYWN0b3J5LzFhMmItc29ja2V0LWZhY3RvcnkuanMiLCJhc3NldHMvYnVpbGQvY29mZmVlaWZ5L21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYmluZ29fZ3JpZF9zaXplLCBndWVzc19udW1iZXJfc2l6ZSwgaTtcbiAgYmluZ29fZ3JpZF9zaXplID0gW107XG4gIGkgPSA1O1xuICB3aGlsZSAoaSA8IDExKSB7XG4gICAgYmluZ29fZ3JpZF9zaXplLnB1c2goe1xuICAgICAgbGFiZWw6IGkgKyBcIiB4IFwiICsgaSxcbiAgICAgIHZhbHVlOiBpXG4gICAgfSk7XG4gICAgaSsrO1xuICB9XG4gIGd1ZXNzX251bWJlcl9zaXplID0gW107XG4gIGkgPSA0O1xuICB3aGlsZSAoaSA8IDcpIHtcbiAgICBndWVzc19udW1iZXJfc2l6ZS5wdXNoKHtcbiAgICAgIGxhYmVsOiBpLFxuICAgICAgdmFsdWU6IGlcbiAgICB9KTtcbiAgICBpKys7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBiaW5nb19ncmlkX3NpemU6IGJpbmdvX2dyaWRfc2l6ZSxcbiAgICBndWVzc19udW1iZXJfc2l6ZTogZ3Vlc3NfbnVtYmVyX3NpemVcbiAgfTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgc2h1ZmZsZTogZnVuY3Rpb24oYXJyYXkpIHtcbiAgICB2YXIgY3VycmVudEluZGV4LCByYW5kb21JbmRleCwgdGVtcG9yYXJ5VmFsdWU7XG4gICAgY3VycmVudEluZGV4ID0gYXJyYXkubGVuZ3RoO1xuICAgIHdoaWxlICgwICE9PSBjdXJyZW50SW5kZXgpIHtcbiAgICAgIHJhbmRvbUluZGV4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY3VycmVudEluZGV4KTtcbiAgICAgIGN1cnJlbnRJbmRleCAtPSAxO1xuICAgICAgdGVtcG9yYXJ5VmFsdWUgPSBhcnJheVtjdXJyZW50SW5kZXhdO1xuICAgICAgYXJyYXlbY3VycmVudEluZGV4XSA9IGFycmF5W3JhbmRvbUluZGV4XTtcbiAgICAgIGFycmF5W3JhbmRvbUluZGV4XSA9IHRlbXBvcmFyeVZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXk7XG4gIH0sXG4gIGNoZWNrQmluZ29MaW5lczogZnVuY3Rpb24ocm93cykge1xuICAgIHZhciBjb3VudCwgaSwgaiwgbGluZXMsIHNpemU7XG4gICAgbGluZXMgPSBbXTtcbiAgICBzaXplID0gcm93cy5sZW5ndGg7XG4gICAgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBzaXplKSB7XG4gICAgICBqID0gMDtcbiAgICAgIGNvdW50ID0gMDtcbiAgICAgIHdoaWxlIChqIDwgc2l6ZSkge1xuICAgICAgICBpZiAocm93c1tpXS5jb2xzW2pdLmNsaWNrZWQpIHtcbiAgICAgICAgICBjb3VudCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGorKztcbiAgICAgIH1cbiAgICAgIGlmIChjb3VudCA9PT0gc2l6ZSkge1xuICAgICAgICBsaW5lcy5wdXNoKHtcbiAgICAgICAgICB0eXBlOiAncm93JyxcbiAgICAgICAgICBpbmRleDogaVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICB9XG4gICAgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBzaXplKSB7XG4gICAgICBqID0gMDtcbiAgICAgIGNvdW50ID0gMDtcbiAgICAgIHdoaWxlIChqIDwgc2l6ZSkge1xuICAgICAgICBpZiAocm93c1tqXS5jb2xzW2ldLmNsaWNrZWQpIHtcbiAgICAgICAgICBjb3VudCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGorKztcbiAgICAgIH1cbiAgICAgIGlmIChjb3VudCA9PT0gc2l6ZSkge1xuICAgICAgICBsaW5lcy5wdXNoKHtcbiAgICAgICAgICB0eXBlOiAnY29sJyxcbiAgICAgICAgICBpbmRleDogaVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICB9XG4gICAgaSA9IDA7XG4gICAgY291bnQgPSAwO1xuICAgIHdoaWxlIChpIDwgc2l6ZSkge1xuICAgICAgaWYgKHJvd3NbaV0uY29sc1tpXS5jbGlja2VkKSB7XG4gICAgICAgIGNvdW50ICs9IDE7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgfVxuICAgIGlmIChjb3VudCA9PT0gc2l6ZSkge1xuICAgICAgbGluZXMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdsdC1yZCdcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpID0gMDtcbiAgICBjb3VudCA9IDA7XG4gICAgd2hpbGUgKGkgPCBzaXplKSB7XG4gICAgICBpZiAocm93c1tpXS5jb2xzW3NpemUgLSAoaSArIDEpXS5jbGlja2VkKSB7XG4gICAgICAgIGNvdW50ICs9IDE7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgfVxuICAgIGlmIChjb3VudCA9PT0gc2l6ZSkge1xuICAgICAgbGluZXMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdydC1sZCdcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gbGluZXM7XG4gIH1cbn07XG4iLCJ2YXIgY29uc3RhbnRzLCB1dGlsO1xuXG5jb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb21tb24vY29uc3RhbnRzJykoKTtcblxudXRpbCA9IHJlcXVpcmUoJy4uL2NvbW1vbi91dGlsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gW1xuICAnJHNjb3BlJywgJyRsb2cnLCAnc29ja2V0MWEyYicsIGZ1bmN0aW9uKCRzY29wZSwgJGxvZywgc29ja2V0MWEyYikge1xuICAgIHZhciBjb2xfd2lkdGgsIHNwYWNlX3dpZHRoLCBzcGVha091dDtcbiAgICAkc2NvcGUuc29ja2V0X3N0YXR1cyA9IHtcbiAgICAgIGNvbm5lY3RlZDogJ09GRidcbiAgICB9O1xuICAgICRzY29wZS5jb25mID0ge307XG4gICAgJHNjb3BlLnN0ZXAgPSAnJztcbiAgICAkc2NvcGUubXlfdHVybiA9IGZhbHNlO1xuICAgICRzY29wZS5jb3VudCA9IDA7XG4gICAgJHNjb3BlLmFuc3dlciA9IFtdO1xuICAgICRzY29wZS5lbHNlX2d1ZXNzZXMgPSBbXTtcbiAgICAkc2NvcGUueW91cl9ndWVzc2VzID0gW107XG4gICAgY29sX3dpZHRoID0gMzAgKyAoNSAqIDIpICsgKDMgKiAyKTtcbiAgICBzcGFjZV93aWR0aCA9IDEwO1xuICAgICRzY29wZS5ndWVzc19udW1iZXJfc2l6ZSA9IGNvbnN0YW50cy5ndWVzc19udW1iZXJfc2l6ZTtcbiAgICBzb2NrZXQxYTJiLm9uKCdjb25uZWN0JywgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY2hlY2tDb25uZWN0ZWQsIGNvbm5lY3Rpb25Ob3RSZWFkeTtcbiAgICAgICRzY29wZS5zb2NrZXRfc3RhdHVzLmNvbm5lY3RlZCA9ICdPTic7XG4gICAgICBjb25uZWN0aW9uTm90UmVhZHkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc29ja2V0MWEyYi5yZW1vdmVMaXN0ZW5lcigncmVjZWl2ZS11c2VyLWd1aWQnKTtcbiAgICAgICAgc29ja2V0MWEyYi5yZW1vdmVMaXN0ZW5lcigncm9vbS1jcmVhdGVkJyk7XG4gICAgICAgIHNvY2tldDFhMmIucmVtb3ZlTGlzdGVuZXIoJ2pvaW4tcm9vbS1yZXN1bHQnKTtcbiAgICAgICAgc29ja2V0MWEyYi5yZW1vdmVMaXN0ZW5lcignZ2FtZS1vbicpO1xuICAgICAgICBzb2NrZXQxYTJiLnJlbW92ZUxpc3RlbmVyKCdndWVzcy1udW1iZXInKTtcbiAgICAgICAgc29ja2V0MWEyYi5yZW1vdmVMaXN0ZW5lcignZ3Vlc3MtbnVtYmVyLXJlc3VsdCcpO1xuICAgICAgICBzb2NrZXQxYTJiLnJlbW92ZUxpc3RlbmVyKCdkaXNjb25uZWN0ZWQnKTtcbiAgICAgICAgJHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLnNvY2tldF9zdGF0dXMuY29ubmVjdGVkID0gJ09GRic7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVsZXRlICRzY29wZS5zb2NrZXRfc3RhdHVzWydndWlkJ107XG4gICAgICB9O1xuICAgICAgc29ja2V0MWEyYi5vbigncmVjZWl2ZS11c2VyLWd1aWQnLCBmdW5jdGlvbihndWlkKSB7XG4gICAgICAgICRsb2cuaW5mbyhndWlkKTtcbiAgICAgICAgcmV0dXJuICRzY29wZS5zb2NrZXRfc3RhdHVzLmd1aWQgPSBndWlkO1xuICAgICAgfSk7XG4gICAgICBzb2NrZXQxYTJiLm9uKCdyb29tLWNyZWF0ZWQnLCBmdW5jdGlvbihpZCkge1xuICAgICAgICByZXR1cm4gJHNjb3BlLnJvb21faWQgPSBpZDtcbiAgICAgIH0pO1xuICAgICAgc29ja2V0MWEyYi5vbignam9pbi1yb29tLXJlc3VsdCcsIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gZmFsc2UpIHtcbiAgICAgICAgICByZXR1cm4gYWxlcnQoJ2pvaW4gcm9vbSA6IGZhbHNlJyk7XG4gICAgICAgIH1cbiAgICAgICAgJHNjb3BlLnJvb21faWQgPSByZXN1bHQuaWQ7XG4gICAgICAgIF8uZm9yRWFjaCgkc2NvcGUuZ3Vlc3NfbnVtYmVyX3NpemUsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICBpZiAoaXRlbS52YWx1ZSA9PT0gcmVzdWx0LnNpemUpIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUuY29uZi5ndWVzc19udW1iZXJfc2l6ZV9zZWxlY3RlZCA9IGl0ZW07XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuICRzY29wZS5kcmF3KGZhbHNlKTtcbiAgICAgIH0pO1xuICAgICAgc29ja2V0MWEyYi5vbignZ2FtZS1vbicsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJHNjb3BlLm15X3R1cm4gPSB0cnVlO1xuICAgICAgfSk7XG4gICAgICBzb2NrZXQxYTJiLm9uKCdndWVzcy1udW1iZXInLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBhLCBiLCBndWVzc19jb2xzLCBpbmRleCwgaXRlbSwgbnVtYmVyLCBudW1iZXJfaW5fc3RyaW5nO1xuICAgICAgICBudW1iZXIgPSBkYXRhLm51bWJlcjtcbiAgICAgICAgbnVtYmVyX2luX3N0cmluZyA9IG51bWJlci50b1N0cmluZygpO1xuICAgICAgICBhID0gMDtcbiAgICAgICAgYiA9IDA7XG4gICAgICAgIGluZGV4ID0gMDtcbiAgICAgICAgZ3Vlc3NfY29scyA9IFtdO1xuICAgICAgICBfLmZvckVhY2gobnVtYmVyX2luX3N0cmluZywgZnVuY3Rpb24oc3RyKSB7XG4gICAgICAgICAgdmFyIGFuc3dlcl9pbmRleDtcbiAgICAgICAgICBndWVzc19jb2xzLnB1c2goc3RyKTtcbiAgICAgICAgICBhbnN3ZXJfaW5kZXggPSAwO1xuICAgICAgICAgIF8uZm9yRWFjaCgkc2NvcGUuYW5zd2VyLCBmdW5jdGlvbihhbnN3ZXJfbnVtYmVyKSB7XG4gICAgICAgICAgICBpZiAoc3RyID09PSBhbnN3ZXJfbnVtYmVyLnZhbHVlLnRvU3RyaW5nKCkpIHtcbiAgICAgICAgICAgICAgaWYgKGFuc3dlcl9pbmRleCA9PT0gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBhKys7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYisrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYW5zd2VyX2luZGV4Kys7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIGluZGV4Kys7XG4gICAgICAgIH0pO1xuICAgICAgICBpdGVtID0ge1xuICAgICAgICAgIHJvb21faWQ6ICRzY29wZS5yb29tX2lkLFxuICAgICAgICAgIGNvbHM6IGd1ZXNzX2NvbHMsXG4gICAgICAgICAgYTogYSxcbiAgICAgICAgICBiOiBiXG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5lbHNlX2d1ZXNzZXMucHVzaChpdGVtKTtcbiAgICAgICAgc29ja2V0MWEyYi5lbWl0KCdyZXR1cm4tZ3Vlc3MtbnVtYmVyJywgaXRlbSk7XG4gICAgICAgIGlmIChhIDwgJHNjb3BlLmFuc3dlci5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLm15X3R1cm4gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHNvY2tldDFhMmIub24oJ2d1ZXNzLW51bWJlci1yZXN1bHQnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICRzY29wZS55b3VyX2d1ZXNzZXMucHVzaChkYXRhKTtcbiAgICAgICAgaWYgKGRhdGEuYSA+IDAgJiYgZGF0YS5iID09PSAwICYmIGRhdGEuYSA9PT0gJHNjb3BlLmNvdW50KSB7XG4gICAgICAgICAgcmV0dXJuIHNwZWFrT3V0KFwi5L2g6LSP5LqGXCIsIFwiQ2hpbmVzZSBGZW1hbGVcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHNwZWFrT3V0KGRhdGEuYSArIFwiIEEgXCIgKyBkYXRhLmIgKyBcIiBCLlwiLCBcIkNoaW5lc2UgRmVtYWxlXCIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHNvY2tldDFhMmIub24oJ2Rpc2Nvbm5lY3RlZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gY29ubmVjdGlvbk5vdFJlYWR5KCk7XG4gICAgICB9KTtcbiAgICAgIGNoZWNrQ29ubmVjdGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghc29ja2V0MWEyYi5zb2NrZXQuY29ubmVjdGVkKSB7XG4gICAgICAgICAgY29ubmVjdGlvbk5vdFJlYWR5KCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoY2hlY2tDb25uZWN0ZWQsIDEwMDApO1xuICAgICAgfTtcbiAgICAgIHJldHVybiBjaGVja0Nvbm5lY3RlZCgpO1xuICAgIH0pO1xuICAgIHNwZWFrT3V0ID0gZnVuY3Rpb24odGV4dCwgdm9pY2UpIHtcbiAgICAgICQoJyNzcGVha1ZvaWNlJykuYXR0cignb25jbGljaycsICdyZXNwb25zaXZlVm9pY2Uuc3BlYWsoXCInICsgdGV4dCArICdcIiwgXCJDaGluZXNlIEZlbWFsZVwiKTsnKTtcbiAgICAgIHJldHVybiAkKCcjc3BlYWtWb2ljZScpLnRyaWdnZXIoJ2NsaWNrJyk7XG4gICAgfTtcbiAgICAkc2NvcGUuZHJhdyA9IGZ1bmN0aW9uKGNyZWF0ZV9yb29tKSB7XG4gICAgICB2YXIgY29sLCBjb2xzLCBjb3VudCwgaSwgaiwgbnVtYmVycywgc2l6ZTtcbiAgICAgIGlmIChjcmVhdGVfcm9vbSA9PSBudWxsKSB7XG4gICAgICAgIGNyZWF0ZV9yb29tID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHNpemUgPSAkc2NvcGUuY29uZi5ndWVzc19udW1iZXJfc2l6ZV9zZWxlY3RlZDtcbiAgICAgIGNvdW50ID0gc2l6ZS52YWx1ZTtcbiAgICAgICRzY29wZS5jb3VudCA9IGNvdW50O1xuICAgICAgbnVtYmVycyA9IFtdO1xuICAgICAgaSA9IDA7XG4gICAgICB3aGlsZSAoaSA8IDEwKSB7XG4gICAgICAgIG51bWJlcnMucHVzaChpKTtcbiAgICAgICAgaSsrO1xuICAgICAgfVxuICAgICAgbnVtYmVycyA9IHV0aWwuc2h1ZmZsZShudW1iZXJzKTtcbiAgICAgIGNvbHMgPSBbXTtcbiAgICAgIGogPSAwO1xuICAgICAgd2hpbGUgKGogPCBjb3VudCkge1xuICAgICAgICBjb2wgPSB7XG4gICAgICAgICAgdmFsdWU6IG51bWJlcnMucG9wKClcbiAgICAgICAgfTtcbiAgICAgICAgY29scy5wdXNoKGNvbCk7XG4gICAgICAgIGorKztcbiAgICAgIH1cbiAgICAgICRzY29wZS5hbnN3ZXIgPSBjb2xzO1xuICAgICAgJHNjb3BlLnN0ZXAgPSAnc3RlcC1wbGF5JztcbiAgICAgIGlmIChjcmVhdGVfcm9vbSA9PT0gdHJ1ZSAmJiAkc2NvcGUuc29ja2V0X3N0YXR1cy5jb25uZWN0ZWQgPT09ICdPTicpIHtcbiAgICAgICAgc29ja2V0MWEyYi5lbWl0KCdjcmVhdGUtcm9vbScsIHtcbiAgICAgICAgICBzaXplOiBjb3VudFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICAgICRzY29wZS5qb2luID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcm9vbV9pZDtcbiAgICAgIHJvb21faWQgPSAkc2NvcGUuY29uZi5yb29tX2lkO1xuICAgICAgcmV0dXJuIHNvY2tldDFhMmIuZW1pdCgnam9pbi1yb29tJywge1xuICAgICAgICBpZDogcm9vbV9pZFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gJHNjb3BlLnNlbmRNeU51bWJlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG51bWJlciwgbnVtYmVyX2luX3N0cmluZztcbiAgICAgIG51bWJlciA9ICRzY29wZS5jb25mLm15X251bWJlcjtcbiAgICAgIG51bWJlcl9pbl9zdHJpbmcgPSBudW1iZXIudG9TdHJpbmcoKTtcbiAgICAgIGlmIChudW1iZXJfaW5fc3RyaW5nLmxlbmd0aCAhPT0gJHNjb3BlLmFuc3dlci5sZW5ndGgpIHtcbiAgICAgICAgc3BlYWtPdXQoXCLplbfluqbkuI3mraPnorpcIiwgXCJDaGluZXNlIEZlbWFsZVwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgJHNjb3BlLm15X3R1cm4gPSBmYWxzZTtcbiAgICAgICRzY29wZS5jb25mLm15X251bWJlciA9ICcnO1xuICAgICAgcmV0dXJuIHNvY2tldDFhMmIuZW1pdCgnc2VuZC1ndWVzcy1udW1iZXInLCB7XG4gICAgICAgIHJvb21faWQ6ICRzY29wZS5yb29tX2lkLFxuICAgICAgICB2YWx1ZTogbnVtYmVyXG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5dO1xuIiwidmFyIGNvbnN0YW50cywgdXRpbDtcblxuY29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29tbW9uL2NvbnN0YW50cycpKCk7XG5cbnV0aWwgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFtcbiAgJyRzY29wZScsICckbG9nJywgJ0JpbmdvU29ja2V0JywgZnVuY3Rpb24oJHNjb3BlLCAkbG9nLCBCaW5nb1NvY2tldCkge1xuICAgIHZhciBjb2xfd2lkdGgsIHNwYWNlX3dpZHRoO1xuICAgICRzY29wZS5zb2NrZXRfc3RhdHVzID0ge1xuICAgICAgY29ubmVjdGVkOiAnT0ZGJ1xuICAgIH07XG4gICAgJHNjb3BlLmNvbmYgPSB7fTtcbiAgICAkc2NvcGUucm93cyA9IFtdO1xuICAgICRzY29wZS5zdGVwID0gJyc7XG4gICAgJHNjb3BlLm15X3R1cm4gPSBmYWxzZTtcbiAgICBjb2xfd2lkdGggPSAzMCArICg1ICogMikgKyAoMyAqIDIpO1xuICAgIHNwYWNlX3dpZHRoID0gMTA7XG4gICAgJHNjb3BlLmJpbmdvX2dyaWRfc2l6ZSA9IGNvbnN0YW50cy5iaW5nb19ncmlkX3NpemU7XG4gICAgQmluZ29Tb2NrZXQub24oJ2Nvbm5lY3QnLCBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBjaGVja0Nvbm5lY3RlZCwgY29ubmVjdGlvbk5vdFJlYWR5O1xuICAgICAgJHNjb3BlLnNvY2tldF9zdGF0dXMuY29ubmVjdGVkID0gJ09OJztcbiAgICAgIGNvbm5lY3Rpb25Ob3RSZWFkeSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBCaW5nb1NvY2tldC5yZW1vdmVMaXN0ZW5lcigncmVjZWl2ZS11c2VyLWd1aWQnKTtcbiAgICAgICAgQmluZ29Tb2NrZXQucmVtb3ZlTGlzdGVuZXIoJ3Jvb20tY3JlYXRlZCcpO1xuICAgICAgICBCaW5nb1NvY2tldC5yZW1vdmVMaXN0ZW5lcignam9pbi1yb29tLXJlc3VsdCcpO1xuICAgICAgICBCaW5nb1NvY2tldC5yZW1vdmVMaXN0ZW5lcignZ2FtZS1vbicpO1xuICAgICAgICBCaW5nb1NvY2tldC5yZW1vdmVMaXN0ZW5lcignY2hvaWNlLW51bWJlcicpO1xuICAgICAgICBCaW5nb1NvY2tldC5yZW1vdmVMaXN0ZW5lcignZGlzY29ubmVjdGVkJyk7XG4gICAgICAgICRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5zb2NrZXRfc3RhdHVzLmNvbm5lY3RlZCA9ICdPRkYnO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlbGV0ZSAkc2NvcGUuc29ja2V0X3N0YXR1c1snZ3VpZCddO1xuICAgICAgfTtcbiAgICAgIEJpbmdvU29ja2V0Lm9uKCdyZWNlaXZlLXVzZXItZ3VpZCcsIGZ1bmN0aW9uKGd1aWQpIHtcbiAgICAgICAgJGxvZy5pbmZvKGd1aWQpO1xuICAgICAgICByZXR1cm4gJHNjb3BlLnNvY2tldF9zdGF0dXMuZ3VpZCA9IGd1aWQ7XG4gICAgICB9KTtcbiAgICAgIEJpbmdvU29ja2V0Lm9uKCdyb29tLWNyZWF0ZWQnLCBmdW5jdGlvbihpZCkge1xuICAgICAgICByZXR1cm4gJHNjb3BlLnJvb21faWQgPSBpZDtcbiAgICAgIH0pO1xuICAgICAgQmluZ29Tb2NrZXQub24oJ2pvaW4tcm9vbS1yZXN1bHQnLCBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgaWYgKHJlc3VsdC5zdGF0dXMgPT09IGZhbHNlKSB7XG4gICAgICAgICAgcmV0dXJuIGFsZXJ0KCdqb2luIHJvb20gOiBmYWxzZScpO1xuICAgICAgICB9XG4gICAgICAgICRzY29wZS5yb29tX2lkID0gcmVzdWx0LmlkO1xuICAgICAgICBfLmZvckVhY2goJHNjb3BlLmJpbmdvX2dyaWRfc2l6ZSwgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgIGlmIChpdGVtLnZhbHVlID09PSByZXN1bHQuc2l6ZSkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5jb25mLmdyaWRfc2l6ZV9zZWxlY3RlZCA9IGl0ZW07XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuICRzY29wZS5kcmF3KGZhbHNlKTtcbiAgICAgIH0pO1xuICAgICAgQmluZ29Tb2NrZXQub24oJ2dhbWUtb24nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICRzY29wZS5teV90dXJuID0gdHJ1ZTtcbiAgICAgIH0pO1xuICAgICAgQmluZ29Tb2NrZXQub24oJ2Nob2ljZS1udW1iZXInLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICRzY29wZS5jb25mLmZpbmRfbnVtYmVyID0gZGF0YS5udW1iZXI7XG4gICAgICAgICRzY29wZS5maW5kTnVtYmVyKGZhbHNlKTtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNpdmVWb2ljZS5zcGVhayhkYXRhLm51bWJlciArIFwi6JmfXCIsIFwiQ2hpbmVzZSBGZW1hbGVcIik7XG4gICAgICB9KTtcbiAgICAgIEJpbmdvU29ja2V0Lm9uKCdkaXNjb25uZWN0ZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGNvbm5lY3Rpb25Ob3RSZWFkeSgpO1xuICAgICAgfSk7XG4gICAgICBjaGVja0Nvbm5lY3RlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIUJpbmdvU29ja2V0LnNvY2tldC5jb25uZWN0ZWQpIHtcbiAgICAgICAgICBjb25uZWN0aW9uTm90UmVhZHkoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2V0VGltZW91dChjaGVja0Nvbm5lY3RlZCwgMTAwMCk7XG4gICAgICB9O1xuICAgICAgcmV0dXJuIGNoZWNrQ29ubmVjdGVkKCk7XG4gICAgfSk7XG4gICAgJHNjb3BlLmRyYXcgPSBmdW5jdGlvbihjcmVhdGVfcm9vbSkge1xuICAgICAgdmFyIGNvdW50LCBpLCBqLCBtYWtlQ29scywgbnVtYmVycywgcm93LCByb3dzLCBzaXplLCB0b3RhbF93aWR0aDtcbiAgICAgIGlmIChjcmVhdGVfcm9vbSA9PSBudWxsKSB7XG4gICAgICAgIGNyZWF0ZV9yb29tID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIG51bWJlcnMgPSBbXTtcbiAgICAgIHNpemUgPSAkc2NvcGUuY29uZi5ncmlkX3NpemVfc2VsZWN0ZWQ7XG4gICAgICBjb3VudCA9IHNpemUudmFsdWU7XG4gICAgICBpID0gMDtcbiAgICAgIHdoaWxlIChpIDwgKGNvdW50ICogY291bnQpKSB7XG4gICAgICAgIG51bWJlcnMucHVzaChpICsgMSk7XG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICAgIG51bWJlcnMgPSB1dGlsLnNodWZmbGUobnVtYmVycyk7XG4gICAgICBtYWtlQ29scyA9IGZ1bmN0aW9uKGNvdW50KSB7XG4gICAgICAgIHZhciBjb2wsIGNvbHM7XG4gICAgICAgIGNvbHMgPSBbXTtcbiAgICAgICAgaSA9IDA7XG4gICAgICAgIHdoaWxlIChpIDwgY291bnQpIHtcbiAgICAgICAgICBjb2wgPSB7XG4gICAgICAgICAgICB2YWx1ZTogbnVtYmVycy5wb3AoKVxuICAgICAgICAgIH07XG4gICAgICAgICAgY29scy5wdXNoKGNvbCk7XG4gICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb2xzO1xuICAgICAgfTtcbiAgICAgIHJvd3MgPSBbXTtcbiAgICAgIGogPSAwO1xuICAgICAgd2hpbGUgKGogPCBjb3VudCkge1xuICAgICAgICByb3cgPSB7XG4gICAgICAgICAgY29sczogbWFrZUNvbHMoY291bnQpXG4gICAgICAgIH07XG4gICAgICAgIHJvd3MucHVzaChyb3cpO1xuICAgICAgICBqKys7XG4gICAgICB9XG4gICAgICAkc2NvcGUucm93cyA9IHJvd3M7XG4gICAgICB0b3RhbF93aWR0aCA9IChjb2xfd2lkdGggKiBjb3VudCkgKyAoKGNvdW50IC0gMSkgKiBzcGFjZV93aWR0aCk7XG4gICAgICAkc2NvcGUuZHJhdyA9IFNWRygnZ3JpZC1zdmctY2FudmFzJykuc2l6ZSh0b3RhbF93aWR0aCwgdG90YWxfd2lkdGgpO1xuICAgICAgJHNjb3BlLnN0ZXAgPSAnc3RlcC1wbGF5JztcbiAgICAgIGlmIChjcmVhdGVfcm9vbSA9PT0gdHJ1ZSAmJiAkc2NvcGUuc29ja2V0X3N0YXR1cy5jb25uZWN0ZWQgPT09ICdPTicpIHtcbiAgICAgICAgQmluZ29Tb2NrZXQuZW1pdCgnY3JlYXRlLXJvb20nLCB7XG4gICAgICAgICAgc2l6ZTogY291bnRcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgICAkc2NvcGUuY2xpY2tOdW1iZXIgPSBmdW5jdGlvbihjb2wsIHNlbmRfZXZlbnQpIHtcbiAgICAgIHZhciBjb3VudCwgbGluZXMsIHRvZ2dsZUNsaWNrZWQ7XG4gICAgICBpZiAoc2VuZF9ldmVudCA9PSBudWxsKSB7XG4gICAgICAgIHNlbmRfZXZlbnQgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKHNlbmRfZXZlbnQgPT09IHRydWUgJiYgJHNjb3BlLm15X3R1cm4gPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChjb2wuY2xpY2tlZCA9PT0gdHJ1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0b2dnbGVDbGlja2VkID0gZnVuY3Rpb24oY29sKSB7XG4gICAgICAgIGlmIChjb2wuY2xpY2tlZCkge1xuICAgICAgICAgIGNvbC5jbGlja2VkID0gIWNvbC5jbGlja2VkO1xuICAgICAgICAgIHJldHVybiBjb2w7XG4gICAgICAgIH1cbiAgICAgICAgY29sLmNsaWNrZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gY29sO1xuICAgICAgfTtcbiAgICAgIGNvbCA9IHRvZ2dsZUNsaWNrZWQoY29sKTtcbiAgICAgIGlmIChjb2wuY2xpY2tlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAkc2NvcGUubGFzdF9jb2wgPSBjb2w7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWxldGUgJHNjb3BlWydsYXN0X2NvbCddO1xuICAgICAgfVxuICAgICAgaWYgKHNlbmRfZXZlbnQgPT09IHRydWUpIHtcbiAgICAgICAgJHNjb3BlLm15X3R1cm4gPSBmYWxzZTtcbiAgICAgICAgQmluZ29Tb2NrZXQuZW1pdCgnY2xpY2stbnVtYmVyJywge1xuICAgICAgICAgIHJvb21faWQ6ICRzY29wZS5yb29tX2lkLFxuICAgICAgICAgIHZhbHVlOiBjb2wudmFsdWVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAkc2NvcGUuZHJhdy5jbGVhcigpO1xuICAgICAgbGluZXMgPSB1dGlsLmNoZWNrQmluZ29MaW5lcygkc2NvcGUucm93cyk7XG4gICAgICBjb3VudCA9ICRzY29wZS5yb3dzLmxlbmd0aDtcbiAgICAgICRzY29wZS5saW5lcyA9IGxpbmVzO1xuICAgICAgcmV0dXJuIF8uZWFjaChsaW5lcywgZnVuY3Rpb24obGluZSkge1xuICAgICAgICB2YXIgcG9pbnQ7XG4gICAgICAgIHBvaW50ID0ge1xuICAgICAgICAgIHgxOiAwLFxuICAgICAgICAgIHkxOiAwLFxuICAgICAgICAgIHgyOiAwLFxuICAgICAgICAgIHkyOiAwXG4gICAgICAgIH07XG4gICAgICAgIGlmIChsaW5lLnR5cGUgPT09ICdyb3cnKSB7XG4gICAgICAgICAgcG9pbnQueDEgPSAwO1xuICAgICAgICAgIHBvaW50LnkxID0gKChjb2xfd2lkdGggKiArK2xpbmUuaW5kZXgpICsgKHNwYWNlX3dpZHRoICogbGluZS5pbmRleCkpIC0gKChjb2xfd2lkdGggLyAyKSArIHNwYWNlX3dpZHRoKTtcbiAgICAgICAgICBwb2ludC54MiA9IChjb2xfd2lkdGggKiBjb3VudCkgKyAoKGNvdW50IC0gMSkgKiBzcGFjZV93aWR0aCk7XG4gICAgICAgICAgcG9pbnQueTIgPSBwb2ludC55MTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGluZS50eXBlID09PSAnY29sJykge1xuICAgICAgICAgIHBvaW50LngxID0gKChjb2xfd2lkdGggKiArK2xpbmUuaW5kZXgpICsgKHNwYWNlX3dpZHRoICogbGluZS5pbmRleCkpIC0gKChjb2xfd2lkdGggLyAyKSArIHNwYWNlX3dpZHRoKTtcbiAgICAgICAgICBwb2ludC55MSA9IDA7XG4gICAgICAgICAgcG9pbnQueDIgPSBwb2ludC54MTtcbiAgICAgICAgICBwb2ludC55MiA9IChjb2xfd2lkdGggKiBjb3VudCkgKyAoKGNvdW50IC0gMSkgKiBzcGFjZV93aWR0aCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxpbmUudHlwZSA9PT0gJ2x0LXJkJykge1xuICAgICAgICAgIHBvaW50LngxID0gMDtcbiAgICAgICAgICBwb2ludC55MSA9IDA7XG4gICAgICAgICAgcG9pbnQueDIgPSAoY29sX3dpZHRoICogY291bnQpICsgKChjb3VudCAtIDEpICogc3BhY2Vfd2lkdGgpO1xuICAgICAgICAgIHBvaW50LnkyID0gcG9pbnQueDI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxpbmUudHlwZSA9PT0gJ3J0LWxkJykge1xuICAgICAgICAgIHBvaW50LngxID0gKGNvbF93aWR0aCAqIGNvdW50KSArICgoY291bnQgLSAxKSAqIHNwYWNlX3dpZHRoKTtcbiAgICAgICAgICBwb2ludC55MSA9IDA7XG4gICAgICAgICAgcG9pbnQueDIgPSAwO1xuICAgICAgICAgIHBvaW50LnkyID0gcG9pbnQueDE7XG4gICAgICAgIH1cbiAgICAgICAgJGxvZy5pbmZvKHBvaW50KTtcbiAgICAgICAgcmV0dXJuICRzY29wZS5kcmF3LmxpbmUocG9pbnQueDEsIHBvaW50LnkxLCBwb2ludC54MiwgcG9pbnQueTIpLnN0cm9rZSh7XG4gICAgICAgICAgd2lkdGg6IDEwLFxuICAgICAgICAgIGNvbG9yOiAnI2YwNicsXG4gICAgICAgICAgbGluZWNhcDogJ3JvdW5kJ1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgJHNjb3BlLmZpbmROdW1iZXIgPSBmdW5jdGlvbihzZW5kX2V2ZW50KSB7XG4gICAgICB2YXIgaSwgajtcbiAgICAgIGlmIChzZW5kX2V2ZW50ID09IG51bGwpIHtcbiAgICAgICAgc2VuZF9ldmVudCA9IHRydWU7XG4gICAgICB9XG4gICAgICBpID0gMDtcbiAgICAgIHdoaWxlIChpIDwgJHNjb3BlLnJvd3MubGVuZ3RoKSB7XG4gICAgICAgIGogPSAwO1xuICAgICAgICB3aGlsZSAoaiA8ICRzY29wZS5yb3dzLmxlbmd0aCkge1xuICAgICAgICAgIGlmICgkc2NvcGUucm93c1tpXS5jb2xzW2pdLnZhbHVlID09PSAkc2NvcGUuY29uZi5maW5kX251bWJlcikge1xuICAgICAgICAgICAgJHNjb3BlLmNsaWNrTnVtYmVyKCRzY29wZS5yb3dzW2ldLmNvbHNbal0sIHNlbmRfZXZlbnQpO1xuICAgICAgICAgICAgJHNjb3BlLmNvbmYuZmluZF9udW1iZXIgPSAnJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaisrO1xuICAgICAgICB9XG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiAkc2NvcGUuam9pbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJvb21faWQ7XG4gICAgICByb29tX2lkID0gJHNjb3BlLmNvbmYucm9vbV9pZDtcbiAgICAgIHJldHVybiBCaW5nb1NvY2tldC5lbWl0KCdqb2luLXJvb20nLCB7XG4gICAgICAgIGlkOiByb29tX2lkXG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5dO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBbXG4gICckbG9nJywgJ3NvY2tldEZhY3RvcnknLCBmdW5jdGlvbigkbG9nLCBzb2NrZXRGYWN0b3J5KSB7XG4gICAgdmFyIGZhY3RvcnksIHNvY2tldDtcbiAgICBzb2NrZXQgPSBpby5jb25uZWN0KGNvbmYuc29ja2V0X2lvX2hvc3QpO1xuICAgIGZhY3RvcnkgPSBzb2NrZXRGYWN0b3J5KHtcbiAgICAgIGlvU29ja2V0OiBzb2NrZXRcbiAgICB9KTtcbiAgICBmYWN0b3J5LnNvY2tldCA9IHNvY2tldDtcbiAgICByZXR1cm4gZmFjdG9yeTtcbiAgfVxuXTtcbiIsImFuZ3VsYXIubW9kdWxlKCdqZXNzLWdhbWUnLCBbJ25nUm91dGUnLCAnYnRmb3JkLnNvY2tldC1pbyddKS5mYWN0b3J5KCdCaW5nb1NvY2tldCcsIHJlcXVpcmUoJy4vZmFjdG9yeS9iaW5nby1zb2NrZXQtZmFjdG9yeScpKS5mYWN0b3J5KCdzb2NrZXQxYTJiJywgcmVxdWlyZSgnLi9mYWN0b3J5LzFhMmItc29ja2V0LWZhY3RvcnknKSkuY29udHJvbGxlcignQmluZ29Db250cm9sbGVyJywgcmVxdWlyZSgnLi9jb250cm9sbGVyL2JpbmdvLWNvbnRyb2xsZXInKSkuY29udHJvbGxlcignMWEyYkNvbnRyb2xsZXInLCByZXF1aXJlKCcuL2NvbnRyb2xsZXIvMWEyYi1jb250cm9sbGVyJykpLmNvbmZpZyhbXG4gICckbG9jYXRpb25Qcm92aWRlcicsICckcm91dGVQcm92aWRlcicsIGZ1bmN0aW9uKCRsb2NhdGlvblByb3ZpZGVyLCAkcm91dGVQcm92aWRlcikge1xuICAgICRsb2NhdGlvblByb3ZpZGVyLmhhc2hQcmVmaXgoJyEnKTtcbiAgICAkcm91dGVQcm92aWRlci53aGVuKCcvYmluZ28nLCB7XG4gICAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWwvX2JpbmdvLmh0bWwnXG4gICAgfSkud2hlbignLzFhMmInLCB7XG4gICAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWwvXzFhMmIuaHRtbCdcbiAgICB9KTtcbiAgICByZXR1cm4gJHJvdXRlUHJvdmlkZXIub3RoZXJ3aXNlKHtcbiAgICAgIHJlZGlyZWN0VG86ICcvYmluZ28nXG4gICAgfSk7XG4gIH1cbl0pO1xuIl19
