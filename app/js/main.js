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
    $scope.map = [[1, 2, 3, 4, 5], [6, 7, 8, 9, 0]];
    $scope.current_tag = '';
    $scope.number_map = [];
    (function() {
      var i, results;
      i = 0;
      results = [];
      while (i < 10) {
        $scope.number_map.push({
          number: i,
          tag: ''
        });
        results.push(i++);
      }
      return results;
    })();
    socket1a2b.on('connect', function() {
      var checkConnected, connectionNotReady;
      $scope.socket_status.connected = 'ON';
      $scope.conf.room_id = 52188;
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
        $log.info(data);
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
    $scope.sendMyNumber = function() {
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
    $scope.setTag = function(tag) {
      return $scope.current_tag = tag;
    };
    $scope.setColorTag = function(number) {
      var i, results;
      i = 0;
      results = [];
      while (i < 10) {
        if ($scope.number_map[i].number === number) {
          if ($scope.number_map[i].tag === $scope.current_tag) {
            $scope.number_map[i].tag = '';
          } else {
            $scope.number_map[i].tag = $scope.current_tag;
          }
          break;
        }
        results.push(i++);
      }
      return results;
    };
    return $scope.checkTag = function(number, tag) {
      var i, item;
      i = 0;
      while (i < 10) {
        item = $scope.number_map[i];
        if (item.number === number) {
          return item.tag === tag;
        }
        i++;
      }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhc3NldHMvYnVpbGQvY29mZmVlaWZ5L2NvbW1vbi9jb25zdGFudHMuanMiLCJhc3NldHMvYnVpbGQvY29mZmVlaWZ5L2NvbW1vbi91dGlsLmpzIiwiYXNzZXRzL2J1aWxkL2NvZmZlZWlmeS9jb250cm9sbGVyLzFhMmItY29udHJvbGxlci5qcyIsImFzc2V0cy9idWlsZC9jb2ZmZWVpZnkvY29udHJvbGxlci9iaW5nby1jb250cm9sbGVyLmpzIiwiYXNzZXRzL2J1aWxkL2NvZmZlZWlmeS9mYWN0b3J5LzFhMmItc29ja2V0LWZhY3RvcnkuanMiLCJhc3NldHMvYnVpbGQvY29mZmVlaWZ5L21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBiaW5nb19ncmlkX3NpemUsIGd1ZXNzX251bWJlcl9zaXplLCBpO1xuICBiaW5nb19ncmlkX3NpemUgPSBbXTtcbiAgaSA9IDU7XG4gIHdoaWxlIChpIDwgMTEpIHtcbiAgICBiaW5nb19ncmlkX3NpemUucHVzaCh7XG4gICAgICBsYWJlbDogaSArIFwiIHggXCIgKyBpLFxuICAgICAgdmFsdWU6IGlcbiAgICB9KTtcbiAgICBpKys7XG4gIH1cbiAgZ3Vlc3NfbnVtYmVyX3NpemUgPSBbXTtcbiAgaSA9IDQ7XG4gIHdoaWxlIChpIDwgNykge1xuICAgIGd1ZXNzX251bWJlcl9zaXplLnB1c2goe1xuICAgICAgbGFiZWw6IGksXG4gICAgICB2YWx1ZTogaVxuICAgIH0pO1xuICAgIGkrKztcbiAgfVxuICByZXR1cm4ge1xuICAgIGJpbmdvX2dyaWRfc2l6ZTogYmluZ29fZ3JpZF9zaXplLFxuICAgIGd1ZXNzX251bWJlcl9zaXplOiBndWVzc19udW1iZXJfc2l6ZVxuICB9O1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBzaHVmZmxlOiBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciBjdXJyZW50SW5kZXgsIHJhbmRvbUluZGV4LCB0ZW1wb3JhcnlWYWx1ZTtcbiAgICBjdXJyZW50SW5kZXggPSBhcnJheS5sZW5ndGg7XG4gICAgd2hpbGUgKDAgIT09IGN1cnJlbnRJbmRleCkge1xuICAgICAgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjdXJyZW50SW5kZXgpO1xuICAgICAgY3VycmVudEluZGV4IC09IDE7XG4gICAgICB0ZW1wb3JhcnlWYWx1ZSA9IGFycmF5W2N1cnJlbnRJbmRleF07XG4gICAgICBhcnJheVtjdXJyZW50SW5kZXhdID0gYXJyYXlbcmFuZG9tSW5kZXhdO1xuICAgICAgYXJyYXlbcmFuZG9tSW5kZXhdID0gdGVtcG9yYXJ5VmFsdWU7XG4gICAgfVxuICAgIHJldHVybiBhcnJheTtcbiAgfSxcbiAgY2hlY2tCaW5nb0xpbmVzOiBmdW5jdGlvbihyb3dzKSB7XG4gICAgdmFyIGNvdW50LCBpLCBqLCBsaW5lcywgc2l6ZTtcbiAgICBsaW5lcyA9IFtdO1xuICAgIHNpemUgPSByb3dzLmxlbmd0aDtcbiAgICBpID0gMDtcbiAgICB3aGlsZSAoaSA8IHNpemUpIHtcbiAgICAgIGogPSAwO1xuICAgICAgY291bnQgPSAwO1xuICAgICAgd2hpbGUgKGogPCBzaXplKSB7XG4gICAgICAgIGlmIChyb3dzW2ldLmNvbHNbal0uY2xpY2tlZCkge1xuICAgICAgICAgIGNvdW50ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgaisrO1xuICAgICAgfVxuICAgICAgaWYgKGNvdW50ID09PSBzaXplKSB7XG4gICAgICAgIGxpbmVzLnB1c2goe1xuICAgICAgICAgIHR5cGU6ICdyb3cnLFxuICAgICAgICAgIGluZGV4OiBpXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaSsrO1xuICAgIH1cbiAgICBpID0gMDtcbiAgICB3aGlsZSAoaSA8IHNpemUpIHtcbiAgICAgIGogPSAwO1xuICAgICAgY291bnQgPSAwO1xuICAgICAgd2hpbGUgKGogPCBzaXplKSB7XG4gICAgICAgIGlmIChyb3dzW2pdLmNvbHNbaV0uY2xpY2tlZCkge1xuICAgICAgICAgIGNvdW50ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgaisrO1xuICAgICAgfVxuICAgICAgaWYgKGNvdW50ID09PSBzaXplKSB7XG4gICAgICAgIGxpbmVzLnB1c2goe1xuICAgICAgICAgIHR5cGU6ICdjb2wnLFxuICAgICAgICAgIGluZGV4OiBpXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaSsrO1xuICAgIH1cbiAgICBpID0gMDtcbiAgICBjb3VudCA9IDA7XG4gICAgd2hpbGUgKGkgPCBzaXplKSB7XG4gICAgICBpZiAocm93c1tpXS5jb2xzW2ldLmNsaWNrZWQpIHtcbiAgICAgICAgY291bnQgKz0gMTtcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICB9XG4gICAgaWYgKGNvdW50ID09PSBzaXplKSB7XG4gICAgICBsaW5lcy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2x0LXJkJ1xuICAgICAgfSk7XG4gICAgfVxuICAgIGkgPSAwO1xuICAgIGNvdW50ID0gMDtcbiAgICB3aGlsZSAoaSA8IHNpemUpIHtcbiAgICAgIGlmIChyb3dzW2ldLmNvbHNbc2l6ZSAtIChpICsgMSldLmNsaWNrZWQpIHtcbiAgICAgICAgY291bnQgKz0gMTtcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICB9XG4gICAgaWYgKGNvdW50ID09PSBzaXplKSB7XG4gICAgICBsaW5lcy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ3J0LWxkJ1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBsaW5lcztcbiAgfVxufTtcbiIsInZhciBjb25zdGFudHMsIHV0aWw7XG5cbmNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbW1vbi9jb25zdGFudHMnKSgpO1xuXG51dGlsID0gcmVxdWlyZSgnLi4vY29tbW9uL3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBbXG4gICckc2NvcGUnLCAnJGxvZycsICdzb2NrZXQxYTJiJywgZnVuY3Rpb24oJHNjb3BlLCAkbG9nLCBzb2NrZXQxYTJiKSB7XG4gICAgdmFyIGNvbF93aWR0aCwgc3BhY2Vfd2lkdGgsIHNwZWFrT3V0O1xuICAgICRzY29wZS5zb2NrZXRfc3RhdHVzID0ge1xuICAgICAgY29ubmVjdGVkOiAnT0ZGJ1xuICAgIH07XG4gICAgJHNjb3BlLmNvbmYgPSB7fTtcbiAgICAkc2NvcGUuc3RlcCA9ICcnO1xuICAgICRzY29wZS5teV90dXJuID0gZmFsc2U7XG4gICAgJHNjb3BlLmNvdW50ID0gMDtcbiAgICAkc2NvcGUuYW5zd2VyID0gW107XG4gICAgJHNjb3BlLmVsc2VfZ3Vlc3NlcyA9IFtdO1xuICAgICRzY29wZS55b3VyX2d1ZXNzZXMgPSBbXTtcbiAgICBjb2xfd2lkdGggPSAzMCArICg1ICogMikgKyAoMyAqIDIpO1xuICAgIHNwYWNlX3dpZHRoID0gMTA7XG4gICAgJHNjb3BlLmd1ZXNzX251bWJlcl9zaXplID0gY29uc3RhbnRzLmd1ZXNzX251bWJlcl9zaXplO1xuICAgICRzY29wZS5tYXAgPSBbWzEsIDIsIDMsIDQsIDVdLCBbNiwgNywgOCwgOSwgMF1dO1xuICAgICRzY29wZS5jdXJyZW50X3RhZyA9ICcnO1xuICAgICRzY29wZS5udW1iZXJfbWFwID0gW107XG4gICAgKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGksIHJlc3VsdHM7XG4gICAgICBpID0gMDtcbiAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgIHdoaWxlIChpIDwgMTApIHtcbiAgICAgICAgJHNjb3BlLm51bWJlcl9tYXAucHVzaCh7XG4gICAgICAgICAgbnVtYmVyOiBpLFxuICAgICAgICAgIHRhZzogJydcbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdHMucHVzaChpKyspO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfSkoKTtcbiAgICBzb2NrZXQxYTJiLm9uKCdjb25uZWN0JywgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY2hlY2tDb25uZWN0ZWQsIGNvbm5lY3Rpb25Ob3RSZWFkeTtcbiAgICAgICRzY29wZS5zb2NrZXRfc3RhdHVzLmNvbm5lY3RlZCA9ICdPTic7XG4gICAgICAkc2NvcGUuY29uZi5yb29tX2lkID0gNTIxODg7XG4gICAgICBjb25uZWN0aW9uTm90UmVhZHkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc29ja2V0MWEyYi5yZW1vdmVMaXN0ZW5lcigncmVjZWl2ZS11c2VyLWd1aWQnKTtcbiAgICAgICAgc29ja2V0MWEyYi5yZW1vdmVMaXN0ZW5lcigncm9vbS1jcmVhdGVkJyk7XG4gICAgICAgIHNvY2tldDFhMmIucmVtb3ZlTGlzdGVuZXIoJ2pvaW4tcm9vbS1yZXN1bHQnKTtcbiAgICAgICAgc29ja2V0MWEyYi5yZW1vdmVMaXN0ZW5lcignZ2FtZS1vbicpO1xuICAgICAgICBzb2NrZXQxYTJiLnJlbW92ZUxpc3RlbmVyKCdndWVzcy1udW1iZXInKTtcbiAgICAgICAgc29ja2V0MWEyYi5yZW1vdmVMaXN0ZW5lcignZ3Vlc3MtbnVtYmVyLXJlc3VsdCcpO1xuICAgICAgICBzb2NrZXQxYTJiLnJlbW92ZUxpc3RlbmVyKCdkaXNjb25uZWN0ZWQnKTtcbiAgICAgICAgJHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLnNvY2tldF9zdGF0dXMuY29ubmVjdGVkID0gJ09GRic7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVsZXRlICRzY29wZS5zb2NrZXRfc3RhdHVzWydndWlkJ107XG4gICAgICB9O1xuICAgICAgc29ja2V0MWEyYi5vbigncmVjZWl2ZS11c2VyLWd1aWQnLCBmdW5jdGlvbihndWlkKSB7XG4gICAgICAgICRsb2cuaW5mbyhndWlkKTtcbiAgICAgICAgcmV0dXJuICRzY29wZS5zb2NrZXRfc3RhdHVzLmd1aWQgPSBndWlkO1xuICAgICAgfSk7XG4gICAgICBzb2NrZXQxYTJiLm9uKCdyb29tLWNyZWF0ZWQnLCBmdW5jdGlvbihpZCkge1xuICAgICAgICByZXR1cm4gJHNjb3BlLnJvb21faWQgPSBpZDtcbiAgICAgIH0pO1xuICAgICAgc29ja2V0MWEyYi5vbignam9pbi1yb29tLXJlc3VsdCcsIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gZmFsc2UpIHtcbiAgICAgICAgICByZXR1cm4gYWxlcnQoJ2pvaW4gcm9vbSA6IGZhbHNlJyk7XG4gICAgICAgIH1cbiAgICAgICAgJHNjb3BlLnJvb21faWQgPSByZXN1bHQuaWQ7XG4gICAgICAgIF8uZm9yRWFjaCgkc2NvcGUuZ3Vlc3NfbnVtYmVyX3NpemUsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICBpZiAoaXRlbS52YWx1ZSA9PT0gcmVzdWx0LnNpemUpIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUuY29uZi5ndWVzc19udW1iZXJfc2l6ZV9zZWxlY3RlZCA9IGl0ZW07XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuICRzY29wZS5kcmF3KGZhbHNlKTtcbiAgICAgIH0pO1xuICAgICAgc29ja2V0MWEyYi5vbignZ2FtZS1vbicsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJHNjb3BlLm15X3R1cm4gPSB0cnVlO1xuICAgICAgfSk7XG4gICAgICBzb2NrZXQxYTJiLm9uKCdndWVzcy1udW1iZXInLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBhLCBiLCBndWVzc19jb2xzLCBpbmRleCwgaXRlbSwgbnVtYmVyLCBudW1iZXJfaW5fc3RyaW5nO1xuICAgICAgICBudW1iZXIgPSBkYXRhLm51bWJlcjtcbiAgICAgICAgbnVtYmVyX2luX3N0cmluZyA9IG51bWJlci50b1N0cmluZygpO1xuICAgICAgICBhID0gMDtcbiAgICAgICAgYiA9IDA7XG4gICAgICAgIGluZGV4ID0gMDtcbiAgICAgICAgZ3Vlc3NfY29scyA9IFtdO1xuICAgICAgICBfLmZvckVhY2gobnVtYmVyX2luX3N0cmluZywgZnVuY3Rpb24oc3RyKSB7XG4gICAgICAgICAgdmFyIGFuc3dlcl9pbmRleDtcbiAgICAgICAgICBndWVzc19jb2xzLnB1c2goc3RyKTtcbiAgICAgICAgICBhbnN3ZXJfaW5kZXggPSAwO1xuICAgICAgICAgIF8uZm9yRWFjaCgkc2NvcGUuYW5zd2VyLCBmdW5jdGlvbihhbnN3ZXJfbnVtYmVyKSB7XG4gICAgICAgICAgICBpZiAoc3RyID09PSBhbnN3ZXJfbnVtYmVyLnZhbHVlLnRvU3RyaW5nKCkpIHtcbiAgICAgICAgICAgICAgaWYgKGFuc3dlcl9pbmRleCA9PT0gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBhKys7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYisrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYW5zd2VyX2luZGV4Kys7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIGluZGV4Kys7XG4gICAgICAgIH0pO1xuICAgICAgICBpdGVtID0ge1xuICAgICAgICAgIHJvb21faWQ6ICRzY29wZS5yb29tX2lkLFxuICAgICAgICAgIGNvbHM6IGd1ZXNzX2NvbHMsXG4gICAgICAgICAgYTogYSxcbiAgICAgICAgICBiOiBiXG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5lbHNlX2d1ZXNzZXMucHVzaChpdGVtKTtcbiAgICAgICAgc29ja2V0MWEyYi5lbWl0KCdyZXR1cm4tZ3Vlc3MtbnVtYmVyJywgaXRlbSk7XG4gICAgICAgIGlmIChhIDwgJHNjb3BlLmFuc3dlci5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLm15X3R1cm4gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHNvY2tldDFhMmIub24oJ2d1ZXNzLW51bWJlci1yZXN1bHQnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICRsb2cuaW5mbyhkYXRhKTtcbiAgICAgICAgJHNjb3BlLnlvdXJfZ3Vlc3Nlcy5wdXNoKGRhdGEpO1xuICAgICAgICBpZiAoZGF0YS5hID4gMCAmJiBkYXRhLmIgPT09IDAgJiYgZGF0YS5hID09PSAkc2NvcGUuY291bnQpIHtcbiAgICAgICAgICByZXR1cm4gc3BlYWtPdXQoXCLkvaDotI/kuoZcIiwgXCJDaGluZXNlIEZlbWFsZVwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gc3BlYWtPdXQoZGF0YS5hICsgXCIgQSBcIiArIGRhdGEuYiArIFwiIEIuXCIsIFwiQ2hpbmVzZSBGZW1hbGVcIik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgc29ja2V0MWEyYi5vbignZGlzY29ubmVjdGVkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBjb25uZWN0aW9uTm90UmVhZHkoKTtcbiAgICAgIH0pO1xuICAgICAgY2hlY2tDb25uZWN0ZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCFzb2NrZXQxYTJiLnNvY2tldC5jb25uZWN0ZWQpIHtcbiAgICAgICAgICBjb25uZWN0aW9uTm90UmVhZHkoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2V0VGltZW91dChjaGVja0Nvbm5lY3RlZCwgMTAwMCk7XG4gICAgICB9O1xuICAgICAgcmV0dXJuIGNoZWNrQ29ubmVjdGVkKCk7XG4gICAgfSk7XG4gICAgc3BlYWtPdXQgPSBmdW5jdGlvbih0ZXh0LCB2b2ljZSkge1xuICAgICAgJCgnI3NwZWFrVm9pY2UnKS5hdHRyKCdvbmNsaWNrJywgJ3Jlc3BvbnNpdmVWb2ljZS5zcGVhayhcIicgKyB0ZXh0ICsgJ1wiLCBcIkNoaW5lc2UgRmVtYWxlXCIpOycpO1xuICAgICAgcmV0dXJuICQoJyNzcGVha1ZvaWNlJykudHJpZ2dlcignY2xpY2snKTtcbiAgICB9O1xuICAgICRzY29wZS5kcmF3ID0gZnVuY3Rpb24oY3JlYXRlX3Jvb20pIHtcbiAgICAgIHZhciBjb2wsIGNvbHMsIGNvdW50LCBpLCBqLCBudW1iZXJzLCBzaXplO1xuICAgICAgaWYgKGNyZWF0ZV9yb29tID09IG51bGwpIHtcbiAgICAgICAgY3JlYXRlX3Jvb20gPSB0cnVlO1xuICAgICAgfVxuICAgICAgc2l6ZSA9ICRzY29wZS5jb25mLmd1ZXNzX251bWJlcl9zaXplX3NlbGVjdGVkO1xuICAgICAgY291bnQgPSBzaXplLnZhbHVlO1xuICAgICAgJHNjb3BlLmNvdW50ID0gY291bnQ7XG4gICAgICBudW1iZXJzID0gW107XG4gICAgICBpID0gMDtcbiAgICAgIHdoaWxlIChpIDwgMTApIHtcbiAgICAgICAgbnVtYmVycy5wdXNoKGkpO1xuICAgICAgICBpKys7XG4gICAgICB9XG4gICAgICBudW1iZXJzID0gdXRpbC5zaHVmZmxlKG51bWJlcnMpO1xuICAgICAgY29scyA9IFtdO1xuICAgICAgaiA9IDA7XG4gICAgICB3aGlsZSAoaiA8IGNvdW50KSB7XG4gICAgICAgIGNvbCA9IHtcbiAgICAgICAgICB2YWx1ZTogbnVtYmVycy5wb3AoKVxuICAgICAgICB9O1xuICAgICAgICBjb2xzLnB1c2goY29sKTtcbiAgICAgICAgaisrO1xuICAgICAgfVxuICAgICAgJHNjb3BlLmFuc3dlciA9IGNvbHM7XG4gICAgICAkc2NvcGUuc3RlcCA9ICdzdGVwLXBsYXknO1xuICAgICAgaWYgKGNyZWF0ZV9yb29tID09PSB0cnVlICYmICRzY29wZS5zb2NrZXRfc3RhdHVzLmNvbm5lY3RlZCA9PT0gJ09OJykge1xuICAgICAgICBzb2NrZXQxYTJiLmVtaXQoJ2NyZWF0ZS1yb29tJywge1xuICAgICAgICAgIHNpemU6IGNvdW50XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG4gICAgJHNjb3BlLmpvaW4gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByb29tX2lkO1xuICAgICAgcm9vbV9pZCA9ICRzY29wZS5jb25mLnJvb21faWQ7XG4gICAgICByZXR1cm4gc29ja2V0MWEyYi5lbWl0KCdqb2luLXJvb20nLCB7XG4gICAgICAgIGlkOiByb29tX2lkXG4gICAgICB9KTtcbiAgICB9O1xuICAgICRzY29wZS5zZW5kTXlOdW1iZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBudW1iZXIsIG51bWJlcl9pbl9zdHJpbmc7XG4gICAgICBudW1iZXIgPSAkc2NvcGUuY29uZi5teV9udW1iZXI7XG4gICAgICBudW1iZXJfaW5fc3RyaW5nID0gbnVtYmVyLnRvU3RyaW5nKCk7XG4gICAgICBpZiAobnVtYmVyX2luX3N0cmluZy5sZW5ndGggIT09ICRzY29wZS5hbnN3ZXIubGVuZ3RoKSB7XG4gICAgICAgIHNwZWFrT3V0KFwi6ZW35bqm5LiN5q2j56K6XCIsIFwiQ2hpbmVzZSBGZW1hbGVcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgICRzY29wZS5teV90dXJuID0gZmFsc2U7XG4gICAgICAkc2NvcGUuY29uZi5teV9udW1iZXIgPSAnJztcbiAgICAgIHJldHVybiBzb2NrZXQxYTJiLmVtaXQoJ3NlbmQtZ3Vlc3MtbnVtYmVyJywge1xuICAgICAgICByb29tX2lkOiAkc2NvcGUucm9vbV9pZCxcbiAgICAgICAgdmFsdWU6IG51bWJlclxuICAgICAgfSk7XG4gICAgfTtcbiAgICAkc2NvcGUuc2V0VGFnID0gZnVuY3Rpb24odGFnKSB7XG4gICAgICByZXR1cm4gJHNjb3BlLmN1cnJlbnRfdGFnID0gdGFnO1xuICAgIH07XG4gICAgJHNjb3BlLnNldENvbG9yVGFnID0gZnVuY3Rpb24obnVtYmVyKSB7XG4gICAgICB2YXIgaSwgcmVzdWx0cztcbiAgICAgIGkgPSAwO1xuICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgd2hpbGUgKGkgPCAxMCkge1xuICAgICAgICBpZiAoJHNjb3BlLm51bWJlcl9tYXBbaV0ubnVtYmVyID09PSBudW1iZXIpIHtcbiAgICAgICAgICBpZiAoJHNjb3BlLm51bWJlcl9tYXBbaV0udGFnID09PSAkc2NvcGUuY3VycmVudF90YWcpIHtcbiAgICAgICAgICAgICRzY29wZS5udW1iZXJfbWFwW2ldLnRhZyA9ICcnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUubnVtYmVyX21hcFtpXS50YWcgPSAkc2NvcGUuY3VycmVudF90YWc7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdHMucHVzaChpKyspO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfTtcbiAgICByZXR1cm4gJHNjb3BlLmNoZWNrVGFnID0gZnVuY3Rpb24obnVtYmVyLCB0YWcpIHtcbiAgICAgIHZhciBpLCBpdGVtO1xuICAgICAgaSA9IDA7XG4gICAgICB3aGlsZSAoaSA8IDEwKSB7XG4gICAgICAgIGl0ZW0gPSAkc2NvcGUubnVtYmVyX21hcFtpXTtcbiAgICAgICAgaWYgKGl0ZW0ubnVtYmVyID09PSBudW1iZXIpIHtcbiAgICAgICAgICByZXR1cm4gaXRlbS50YWcgPT09IHRhZztcbiAgICAgICAgfVxuICAgICAgICBpKys7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXTtcbiIsInZhciBjb25zdGFudHMsIHV0aWw7XG5cbmNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbW1vbi9jb25zdGFudHMnKSgpO1xuXG51dGlsID0gcmVxdWlyZSgnLi4vY29tbW9uL3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBbXG4gICckc2NvcGUnLCAnJGxvZycsICdCaW5nb1NvY2tldCcsIGZ1bmN0aW9uKCRzY29wZSwgJGxvZywgQmluZ29Tb2NrZXQpIHtcbiAgICB2YXIgY29sX3dpZHRoLCBzcGFjZV93aWR0aDtcbiAgICAkc2NvcGUuc29ja2V0X3N0YXR1cyA9IHtcbiAgICAgIGNvbm5lY3RlZDogJ09GRidcbiAgICB9O1xuICAgICRzY29wZS5jb25mID0ge307XG4gICAgJHNjb3BlLnJvd3MgPSBbXTtcbiAgICAkc2NvcGUuc3RlcCA9ICcnO1xuICAgICRzY29wZS5teV90dXJuID0gZmFsc2U7XG4gICAgY29sX3dpZHRoID0gMzAgKyAoNSAqIDIpICsgKDMgKiAyKTtcbiAgICBzcGFjZV93aWR0aCA9IDEwO1xuICAgICRzY29wZS5iaW5nb19ncmlkX3NpemUgPSBjb25zdGFudHMuYmluZ29fZ3JpZF9zaXplO1xuICAgIEJpbmdvU29ja2V0Lm9uKCdjb25uZWN0JywgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY2hlY2tDb25uZWN0ZWQsIGNvbm5lY3Rpb25Ob3RSZWFkeTtcbiAgICAgICRzY29wZS5zb2NrZXRfc3RhdHVzLmNvbm5lY3RlZCA9ICdPTic7XG4gICAgICBjb25uZWN0aW9uTm90UmVhZHkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgQmluZ29Tb2NrZXQucmVtb3ZlTGlzdGVuZXIoJ3JlY2VpdmUtdXNlci1ndWlkJyk7XG4gICAgICAgIEJpbmdvU29ja2V0LnJlbW92ZUxpc3RlbmVyKCdyb29tLWNyZWF0ZWQnKTtcbiAgICAgICAgQmluZ29Tb2NrZXQucmVtb3ZlTGlzdGVuZXIoJ2pvaW4tcm9vbS1yZXN1bHQnKTtcbiAgICAgICAgQmluZ29Tb2NrZXQucmVtb3ZlTGlzdGVuZXIoJ2dhbWUtb24nKTtcbiAgICAgICAgQmluZ29Tb2NrZXQucmVtb3ZlTGlzdGVuZXIoJ2Nob2ljZS1udW1iZXInKTtcbiAgICAgICAgQmluZ29Tb2NrZXQucmVtb3ZlTGlzdGVuZXIoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgICAgICAkc2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiAkc2NvcGUuc29ja2V0X3N0YXR1cy5jb25uZWN0ZWQgPSAnT0ZGJztcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWxldGUgJHNjb3BlLnNvY2tldF9zdGF0dXNbJ2d1aWQnXTtcbiAgICAgIH07XG4gICAgICBCaW5nb1NvY2tldC5vbigncmVjZWl2ZS11c2VyLWd1aWQnLCBmdW5jdGlvbihndWlkKSB7XG4gICAgICAgICRsb2cuaW5mbyhndWlkKTtcbiAgICAgICAgcmV0dXJuICRzY29wZS5zb2NrZXRfc3RhdHVzLmd1aWQgPSBndWlkO1xuICAgICAgfSk7XG4gICAgICBCaW5nb1NvY2tldC5vbigncm9vbS1jcmVhdGVkJywgZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgcmV0dXJuICRzY29wZS5yb29tX2lkID0gaWQ7XG4gICAgICB9KTtcbiAgICAgIEJpbmdvU29ja2V0Lm9uKCdqb2luLXJvb20tcmVzdWx0JywgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgIGlmIChyZXN1bHQuc3RhdHVzID09PSBmYWxzZSkge1xuICAgICAgICAgIHJldHVybiBhbGVydCgnam9pbiByb29tIDogZmFsc2UnKTtcbiAgICAgICAgfVxuICAgICAgICAkc2NvcGUucm9vbV9pZCA9IHJlc3VsdC5pZDtcbiAgICAgICAgXy5mb3JFYWNoKCRzY29wZS5iaW5nb19ncmlkX3NpemUsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICBpZiAoaXRlbS52YWx1ZSA9PT0gcmVzdWx0LnNpemUpIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUuY29uZi5ncmlkX3NpemVfc2VsZWN0ZWQgPSBpdGVtO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiAkc2NvcGUuZHJhdyhmYWxzZSk7XG4gICAgICB9KTtcbiAgICAgIEJpbmdvU29ja2V0Lm9uKCdnYW1lLW9uJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAkc2NvcGUubXlfdHVybiA9IHRydWU7XG4gICAgICB9KTtcbiAgICAgIEJpbmdvU29ja2V0Lm9uKCdjaG9pY2UtbnVtYmVyJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAkc2NvcGUuY29uZi5maW5kX251bWJlciA9IGRhdGEubnVtYmVyO1xuICAgICAgICAkc2NvcGUuZmluZE51bWJlcihmYWxzZSk7XG4gICAgICAgIHJldHVybiByZXNwb25zaXZlVm9pY2Uuc3BlYWsoZGF0YS5udW1iZXIgKyBcIuiZn1wiLCBcIkNoaW5lc2UgRmVtYWxlXCIpO1xuICAgICAgfSk7XG4gICAgICBCaW5nb1NvY2tldC5vbignZGlzY29ubmVjdGVkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBjb25uZWN0aW9uTm90UmVhZHkoKTtcbiAgICAgIH0pO1xuICAgICAgY2hlY2tDb25uZWN0ZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCFCaW5nb1NvY2tldC5zb2NrZXQuY29ubmVjdGVkKSB7XG4gICAgICAgICAgY29ubmVjdGlvbk5vdFJlYWR5KCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoY2hlY2tDb25uZWN0ZWQsIDEwMDApO1xuICAgICAgfTtcbiAgICAgIHJldHVybiBjaGVja0Nvbm5lY3RlZCgpO1xuICAgIH0pO1xuICAgICRzY29wZS5kcmF3ID0gZnVuY3Rpb24oY3JlYXRlX3Jvb20pIHtcbiAgICAgIHZhciBjb3VudCwgaSwgaiwgbWFrZUNvbHMsIG51bWJlcnMsIHJvdywgcm93cywgc2l6ZSwgdG90YWxfd2lkdGg7XG4gICAgICBpZiAoY3JlYXRlX3Jvb20gPT0gbnVsbCkge1xuICAgICAgICBjcmVhdGVfcm9vbSA9IHRydWU7XG4gICAgICB9XG4gICAgICBudW1iZXJzID0gW107XG4gICAgICBzaXplID0gJHNjb3BlLmNvbmYuZ3JpZF9zaXplX3NlbGVjdGVkO1xuICAgICAgY291bnQgPSBzaXplLnZhbHVlO1xuICAgICAgaSA9IDA7XG4gICAgICB3aGlsZSAoaSA8IChjb3VudCAqIGNvdW50KSkge1xuICAgICAgICBudW1iZXJzLnB1c2goaSArIDEpO1xuICAgICAgICBpKys7XG4gICAgICB9XG4gICAgICBudW1iZXJzID0gdXRpbC5zaHVmZmxlKG51bWJlcnMpO1xuICAgICAgbWFrZUNvbHMgPSBmdW5jdGlvbihjb3VudCkge1xuICAgICAgICB2YXIgY29sLCBjb2xzO1xuICAgICAgICBjb2xzID0gW107XG4gICAgICAgIGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IGNvdW50KSB7XG4gICAgICAgICAgY29sID0ge1xuICAgICAgICAgICAgdmFsdWU6IG51bWJlcnMucG9wKClcbiAgICAgICAgICB9O1xuICAgICAgICAgIGNvbHMucHVzaChjb2wpO1xuICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29scztcbiAgICAgIH07XG4gICAgICByb3dzID0gW107XG4gICAgICBqID0gMDtcbiAgICAgIHdoaWxlIChqIDwgY291bnQpIHtcbiAgICAgICAgcm93ID0ge1xuICAgICAgICAgIGNvbHM6IG1ha2VDb2xzKGNvdW50KVxuICAgICAgICB9O1xuICAgICAgICByb3dzLnB1c2gocm93KTtcbiAgICAgICAgaisrO1xuICAgICAgfVxuICAgICAgJHNjb3BlLnJvd3MgPSByb3dzO1xuICAgICAgdG90YWxfd2lkdGggPSAoY29sX3dpZHRoICogY291bnQpICsgKChjb3VudCAtIDEpICogc3BhY2Vfd2lkdGgpO1xuICAgICAgJHNjb3BlLmRyYXcgPSBTVkcoJ2dyaWQtc3ZnLWNhbnZhcycpLnNpemUodG90YWxfd2lkdGgsIHRvdGFsX3dpZHRoKTtcbiAgICAgICRzY29wZS5zdGVwID0gJ3N0ZXAtcGxheSc7XG4gICAgICBpZiAoY3JlYXRlX3Jvb20gPT09IHRydWUgJiYgJHNjb3BlLnNvY2tldF9zdGF0dXMuY29ubmVjdGVkID09PSAnT04nKSB7XG4gICAgICAgIEJpbmdvU29ja2V0LmVtaXQoJ2NyZWF0ZS1yb29tJywge1xuICAgICAgICAgIHNpemU6IGNvdW50XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG4gICAgJHNjb3BlLmNsaWNrTnVtYmVyID0gZnVuY3Rpb24oY29sLCBzZW5kX2V2ZW50KSB7XG4gICAgICB2YXIgY291bnQsIGxpbmVzLCB0b2dnbGVDbGlja2VkO1xuICAgICAgaWYgKHNlbmRfZXZlbnQgPT0gbnVsbCkge1xuICAgICAgICBzZW5kX2V2ZW50ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChzZW5kX2V2ZW50ID09PSB0cnVlICYmICRzY29wZS5teV90dXJuID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoY29sLmNsaWNrZWQgPT09IHRydWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdG9nZ2xlQ2xpY2tlZCA9IGZ1bmN0aW9uKGNvbCkge1xuICAgICAgICBpZiAoY29sLmNsaWNrZWQpIHtcbiAgICAgICAgICBjb2wuY2xpY2tlZCA9ICFjb2wuY2xpY2tlZDtcbiAgICAgICAgICByZXR1cm4gY29sO1xuICAgICAgICB9XG4gICAgICAgIGNvbC5jbGlja2VkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGNvbDtcbiAgICAgIH07XG4gICAgICBjb2wgPSB0b2dnbGVDbGlja2VkKGNvbCk7XG4gICAgICBpZiAoY29sLmNsaWNrZWQgPT09IHRydWUpIHtcbiAgICAgICAgJHNjb3BlLmxhc3RfY29sID0gY29sO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVsZXRlICRzY29wZVsnbGFzdF9jb2wnXTtcbiAgICAgIH1cbiAgICAgIGlmIChzZW5kX2V2ZW50ID09PSB0cnVlKSB7XG4gICAgICAgICRzY29wZS5teV90dXJuID0gZmFsc2U7XG4gICAgICAgIEJpbmdvU29ja2V0LmVtaXQoJ2NsaWNrLW51bWJlcicsIHtcbiAgICAgICAgICByb29tX2lkOiAkc2NvcGUucm9vbV9pZCxcbiAgICAgICAgICB2YWx1ZTogY29sLnZhbHVlXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgJHNjb3BlLmRyYXcuY2xlYXIoKTtcbiAgICAgIGxpbmVzID0gdXRpbC5jaGVja0JpbmdvTGluZXMoJHNjb3BlLnJvd3MpO1xuICAgICAgY291bnQgPSAkc2NvcGUucm93cy5sZW5ndGg7XG4gICAgICAkc2NvcGUubGluZXMgPSBsaW5lcztcbiAgICAgIHJldHVybiBfLmVhY2gobGluZXMsIGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgdmFyIHBvaW50O1xuICAgICAgICBwb2ludCA9IHtcbiAgICAgICAgICB4MTogMCxcbiAgICAgICAgICB5MTogMCxcbiAgICAgICAgICB4MjogMCxcbiAgICAgICAgICB5MjogMFxuICAgICAgICB9O1xuICAgICAgICBpZiAobGluZS50eXBlID09PSAncm93Jykge1xuICAgICAgICAgIHBvaW50LngxID0gMDtcbiAgICAgICAgICBwb2ludC55MSA9ICgoY29sX3dpZHRoICogKytsaW5lLmluZGV4KSArIChzcGFjZV93aWR0aCAqIGxpbmUuaW5kZXgpKSAtICgoY29sX3dpZHRoIC8gMikgKyBzcGFjZV93aWR0aCk7XG4gICAgICAgICAgcG9pbnQueDIgPSAoY29sX3dpZHRoICogY291bnQpICsgKChjb3VudCAtIDEpICogc3BhY2Vfd2lkdGgpO1xuICAgICAgICAgIHBvaW50LnkyID0gcG9pbnQueTE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxpbmUudHlwZSA9PT0gJ2NvbCcpIHtcbiAgICAgICAgICBwb2ludC54MSA9ICgoY29sX3dpZHRoICogKytsaW5lLmluZGV4KSArIChzcGFjZV93aWR0aCAqIGxpbmUuaW5kZXgpKSAtICgoY29sX3dpZHRoIC8gMikgKyBzcGFjZV93aWR0aCk7XG4gICAgICAgICAgcG9pbnQueTEgPSAwO1xuICAgICAgICAgIHBvaW50LngyID0gcG9pbnQueDE7XG4gICAgICAgICAgcG9pbnQueTIgPSAoY29sX3dpZHRoICogY291bnQpICsgKChjb3VudCAtIDEpICogc3BhY2Vfd2lkdGgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsaW5lLnR5cGUgPT09ICdsdC1yZCcpIHtcbiAgICAgICAgICBwb2ludC54MSA9IDA7XG4gICAgICAgICAgcG9pbnQueTEgPSAwO1xuICAgICAgICAgIHBvaW50LngyID0gKGNvbF93aWR0aCAqIGNvdW50KSArICgoY291bnQgLSAxKSAqIHNwYWNlX3dpZHRoKTtcbiAgICAgICAgICBwb2ludC55MiA9IHBvaW50LngyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsaW5lLnR5cGUgPT09ICdydC1sZCcpIHtcbiAgICAgICAgICBwb2ludC54MSA9IChjb2xfd2lkdGggKiBjb3VudCkgKyAoKGNvdW50IC0gMSkgKiBzcGFjZV93aWR0aCk7XG4gICAgICAgICAgcG9pbnQueTEgPSAwO1xuICAgICAgICAgIHBvaW50LngyID0gMDtcbiAgICAgICAgICBwb2ludC55MiA9IHBvaW50LngxO1xuICAgICAgICB9XG4gICAgICAgICRsb2cuaW5mbyhwb2ludCk7XG4gICAgICAgIHJldHVybiAkc2NvcGUuZHJhdy5saW5lKHBvaW50LngxLCBwb2ludC55MSwgcG9pbnQueDIsIHBvaW50LnkyKS5zdHJva2Uoe1xuICAgICAgICAgIHdpZHRoOiAxMCxcbiAgICAgICAgICBjb2xvcjogJyNmMDYnLFxuICAgICAgICAgIGxpbmVjYXA6ICdyb3VuZCdcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9O1xuICAgICRzY29wZS5maW5kTnVtYmVyID0gZnVuY3Rpb24oc2VuZF9ldmVudCkge1xuICAgICAgdmFyIGksIGo7XG4gICAgICBpZiAoc2VuZF9ldmVudCA9PSBudWxsKSB7XG4gICAgICAgIHNlbmRfZXZlbnQgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaSA9IDA7XG4gICAgICB3aGlsZSAoaSA8ICRzY29wZS5yb3dzLmxlbmd0aCkge1xuICAgICAgICBqID0gMDtcbiAgICAgICAgd2hpbGUgKGogPCAkc2NvcGUucm93cy5sZW5ndGgpIHtcbiAgICAgICAgICBpZiAoJHNjb3BlLnJvd3NbaV0uY29sc1tqXS52YWx1ZSA9PT0gJHNjb3BlLmNvbmYuZmluZF9udW1iZXIpIHtcbiAgICAgICAgICAgICRzY29wZS5jbGlja051bWJlcigkc2NvcGUucm93c1tpXS5jb2xzW2pdLCBzZW5kX2V2ZW50KTtcbiAgICAgICAgICAgICRzY29wZS5jb25mLmZpbmRfbnVtYmVyID0gJyc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGorKztcbiAgICAgICAgfVxuICAgICAgICBpKys7XG4gICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gJHNjb3BlLmpvaW4gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByb29tX2lkO1xuICAgICAgcm9vbV9pZCA9ICRzY29wZS5jb25mLnJvb21faWQ7XG4gICAgICByZXR1cm4gQmluZ29Tb2NrZXQuZW1pdCgnam9pbi1yb29tJywge1xuICAgICAgICBpZDogcm9vbV9pZFxuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXTtcbiIsIm1vZHVsZS5leHBvcnRzID0gW1xuICAnJGxvZycsICdzb2NrZXRGYWN0b3J5JywgZnVuY3Rpb24oJGxvZywgc29ja2V0RmFjdG9yeSkge1xuICAgIHZhciBmYWN0b3J5LCBzb2NrZXQ7XG4gICAgc29ja2V0ID0gaW8uY29ubmVjdChjb25mLnNvY2tldF9pb19ob3N0KTtcbiAgICBmYWN0b3J5ID0gc29ja2V0RmFjdG9yeSh7XG4gICAgICBpb1NvY2tldDogc29ja2V0XG4gICAgfSk7XG4gICAgZmFjdG9yeS5zb2NrZXQgPSBzb2NrZXQ7XG4gICAgcmV0dXJuIGZhY3Rvcnk7XG4gIH1cbl07XG4iLCJhbmd1bGFyLm1vZHVsZSgnamVzcy1nYW1lJywgWyduZ1JvdXRlJywgJ2J0Zm9yZC5zb2NrZXQtaW8nXSkuZmFjdG9yeSgnQmluZ29Tb2NrZXQnLCByZXF1aXJlKCcuL2ZhY3RvcnkvYmluZ28tc29ja2V0LWZhY3RvcnknKSkuZmFjdG9yeSgnc29ja2V0MWEyYicsIHJlcXVpcmUoJy4vZmFjdG9yeS8xYTJiLXNvY2tldC1mYWN0b3J5JykpLmNvbnRyb2xsZXIoJ0JpbmdvQ29udHJvbGxlcicsIHJlcXVpcmUoJy4vY29udHJvbGxlci9iaW5nby1jb250cm9sbGVyJykpLmNvbnRyb2xsZXIoJzFhMmJDb250cm9sbGVyJywgcmVxdWlyZSgnLi9jb250cm9sbGVyLzFhMmItY29udHJvbGxlcicpKS5jb25maWcoW1xuICAnJGxvY2F0aW9uUHJvdmlkZXInLCAnJHJvdXRlUHJvdmlkZXInLCBmdW5jdGlvbigkbG9jYXRpb25Qcm92aWRlciwgJHJvdXRlUHJvdmlkZXIpIHtcbiAgICAkbG9jYXRpb25Qcm92aWRlci5oYXNoUHJlZml4KCchJyk7XG4gICAgJHJvdXRlUHJvdmlkZXIud2hlbignL2JpbmdvJywge1xuICAgICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFsL19iaW5nby5odG1sJ1xuICAgIH0pLndoZW4oJy8xYTJiJywge1xuICAgICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFsL18xYTJiLmh0bWwnXG4gICAgfSk7XG4gICAgcmV0dXJuICRyb3V0ZVByb3ZpZGVyLm90aGVyd2lzZSh7XG4gICAgICByZWRpcmVjdFRvOiAnL2JpbmdvJ1xuICAgIH0pO1xuICB9XG5dKTtcbiJdfQ==
