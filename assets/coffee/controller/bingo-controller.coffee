constants = require('../common/constants')()
util = require('../common/util')

module.exports = [
    '$scope', '$log', 'BingoSocket'
    ($scope, $log, BingoSocket) ->
        $scope.socket_status = {
            connected: 'OFF'
        }

        BingoSocket.on('connect', () ->
            $scope.socket_status.connected = 'ON'


            connectionNotReady = () ->
                BingoSocket.removeListener('receive-user-guid')
                BingoSocket.removeListener('room-created')
                BingoSocket.removeListener('join-room-result')
                BingoSocket.removeListener('game-on')
                BingoSocket.removeListener('choice-number')
                BingoSocket.removeListener('disconnected')

                $scope.$apply(->
                    $scope.socket_status.connected = 'OFF'
                )
                delete $scope.socket_status['guid']

            BingoSocket.on('receive-user-guid', (guid) ->
                $log.info guid
                $scope.socket_status.guid = guid
            )

            BingoSocket.on('room-created', (id) ->
                $scope.room_id = id
            )

            BingoSocket.on('join-room-result', (result) ->
                if result.status == false
                    return alert('join room : false');

                $scope.room_id = result.id
                _.forEach($scope.bingo_grid_size, (item) ->
                    if item.value == result.size
                        $scope.conf.grid_size_selected = item
                )

                $scope.draw(false)
            )

            BingoSocket.on('game-on', () ->
                $scope.my_turn = true

                #responsiveVoice.speak("換你了", "Chinese Female")
            )

            BingoSocket.on('choice-number', (data) ->
                $scope.conf.find_number = data.number
                $scope.findNumber(false)

                responsiveVoice.speak("#{data.number}號", "Chinese Female")
            )

            BingoSocket.on('disconnected', () ->
                connectionNotReady()
            )

            checkConnected = () ->
                if not BingoSocket.socket.connected
                    connectionNotReady()
                setTimeout(checkConnected, 1000)

            checkConnected()
#            BingoSocket.emit('join', 'Hello world from client')
#
#            BingoSocket.on('messages', (data) ->
#                $log.info data
#            )
        );

        $scope.conf = {}
        $scope.rows = []
        $scope.step = ''
        $scope.my_turn = false

        col_width = 30 + (5 * 2) + (3 * 2)
        space_width = 10

        $scope.bingo_grid_size = constants.bingo_grid_size

        $scope.draw = (create_room = true) ->
            numbers = []
            size = $scope.conf.grid_size_selected

            count = size.value

            i = 0
            while i < (count * count)
                numbers.push i + 1
                i++

            numbers = util.shuffle(numbers)

            makeCols = (count) ->
                cols = []
                i = 0
                while i < count
                    col = {
                        value: numbers.pop()
                    }
                    cols.push col

                    i++
                return cols

            rows = []
            j = 0
            while j < count
                row = {
                    cols: makeCols(count)
                }
                rows.push row

                j++

            $scope.rows = rows

            total_width = (col_width * count) + ((count - 1) * space_width)
            $scope.draw = SVG('grid-svg-canvas').size(total_width, total_width)

            #draw.line(0, 0, 270, 270).stroke({ width: 10, color: '#f06', linecap: 'round' })
            #draw.line(270, 0, 0, 270).stroke({ width: 10, color: '#f06', linecap: 'round' })

            $scope.step = 'step-play'
            if create_room == true and $scope.socket_status.connected == 'ON'
                BingoSocket.emit('create-room', { size: count })

            return

        $scope.clickNumber = (col, send_event = true) ->
            if send_event == true and $scope.my_turn == false
                return

            if col.clicked == true
                return


            toggleClicked = (col) ->
                if col.clicked
                    col.clicked = not col.clicked
                    return col
                col.clicked = true
                return col
            col = toggleClicked(col)

            if col.clicked == true
                $scope.last_col = col
            else
                delete $scope['last_col']

            if send_event == true
                $scope.my_turn = false
                BingoSocket.emit('click-number', { room_id: $scope.room_id, value: col.value })


            $scope.draw.clear()

            lines = util.checkBingoLines($scope.rows)
            count = $scope.rows.length

            $scope.lines = lines

            _.each(lines, (line) ->
                point = { x1: 0, y1: 0, x2: 0, y2: 0 }
                if line.type == 'row'
                    point.x1 = 0
                    point.y1 =
                        ((col_width * ++line.index) + (space_width * line.index)) - ((col_width / 2) + space_width)
                    point.x2 = (col_width * count) + ((count - 1) * space_width)
                    point.y2 = point.y1

                if line.type == 'col'
                    point.x1 =
                        ((col_width * ++line.index) + (space_width * line.index)) - ((col_width / 2) + space_width)
                    point.y1 = 0
                    point.x2 = point.x1
                    point.y2 = (col_width * count) + ((count - 1) * space_width)

                if line.type == 'lt-rd'
                    point.x1 = 0
                    point.y1 = 0
                    point.x2 = (col_width * count) + ((count - 1) * space_width)
                    point.y2 = point.x2

                if line.type == 'rt-ld'
                    point.x1 = (col_width * count) + ((count - 1) * space_width)
                    point.y1 = 0
                    point.x2 = 0
                    point.y2 = point.x1

                $log.info point
                $scope.draw.line(
                    point.x1,
                    point.y1,
                    point.x2,
                    point.y2,
                ).stroke({
                    width: 10,
                    color: '#f06',
                    linecap: 'round'
                })
            )

        $scope.findNumber = (send_event = true) ->
            i = 0
            while i < $scope.rows.length
                j = 0
                while j < $scope.rows.length
                    if $scope.rows[i].cols[j].value == $scope.conf.find_number
                        $scope.clickNumber($scope.rows[i].cols[j], send_event)
                        $scope.conf.find_number = ''
                        return
                    j++
                i++

        $scope.join = () ->
            room_id = $scope.conf.room_id
            BingoSocket.emit('join-room', { id: room_id })
]