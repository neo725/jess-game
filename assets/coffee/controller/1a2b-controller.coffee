constants = require('../common/constants')()
util = require('../common/util')

module.exports = [
    '$scope', '$log', 'socket1a2b',
    ($scope, $log, socket1a2b) ->
        $scope.socket_status = {
            connected: 'OFF'
        }
        $scope.conf = {}
        $scope.step = ''
        $scope.my_turn = false
        $scope.count = 0
        $scope.answer = []
        $scope.else_guesses = []
        $scope.your_guesses = []

        col_width = 30 + (5 * 2) + (3 * 2)
        space_width = 10

        $scope.guess_number_size = constants.guess_number_size

        $scope.map = [
            [1, 2, 3, 4, 5],
            [6, 7, 8, 9, 0]
        ]

        $scope.current_tag = ''
        $scope.number_map = []

        do () ->
            i = 0
            while i < 10
                $scope.number_map.push {
                    number: i,
                    tag: ''
                }
                i++

        socket1a2b.on('connect', () ->
            $scope.socket_status.connected = 'ON'
            $scope.conf.room_id = 52188

            connectionNotReady = () ->
                socket1a2b.removeListener('receive-user-guid')
                socket1a2b.removeListener('room-created')
                socket1a2b.removeListener('join-room-result')
                socket1a2b.removeListener('game-on')
                socket1a2b.removeListener('guess-number')
                socket1a2b.removeListener('guess-number-result')
                socket1a2b.removeListener('disconnected')

                $scope.$apply(->
                    $scope.socket_status.connected = 'OFF'
                )
                delete $scope.socket_status['guid']

            socket1a2b.on('receive-user-guid', (guid) ->
                $log.info guid
                $scope.socket_status.guid = guid
            )

            socket1a2b.on('room-created', (id) ->
                $scope.room_id = id
            )

            socket1a2b.on('join-room-result', (result) ->
                if result.status == false
                    return alert('join room : false');

                $scope.room_id = result.id
                _.forEach($scope.guess_number_size, (item) ->
                    if item.value == result.size
                        $scope.conf.guess_number_size_selected = item
                )

                $scope.draw(false)
            )

            socket1a2b.on('game-on', () ->
                $scope.my_turn = true

#                responsiveVoice.speak("換你了", "Chinese Female")
            )

#            socket1a2b.on('choice-number', (data) ->
#                $scope.conf.find_number = data.number
#                $scope.findNumber(false)
#
#                responsiveVoice.speak("#{data.number}號", "Chinese Female")
#            )
            socket1a2b.on('guess-number', (data) ->
                number = data.number
                number_in_string = number.toString()

                a = 0
                b = 0
                index = 0
                guess_cols = []

                _.forEach(number_in_string, (str) ->
                    guess_cols.push str

                    answer_index = 0
                    _.forEach($scope.answer, (answer_number) ->
                        if str == answer_number.value.toString()
                            if answer_index == index
                                a++
                            else
                                b++
                        answer_index++
                    )
                    index++
                )

                item = {
                    room_id: $scope.room_id
                    cols: guess_cols
                    a: a
                    b: b
                }

                $scope.else_guesses.push item
                socket1a2b.emit('return-guess-number', item)

                if a < $scope.answer.length
                    $scope.my_turn = true
            )

            socket1a2b.on('guess-number-result', (data) ->
                $log.info data
                $scope.your_guesses.push (data)

                if data.a > 0 and data.b == 0 and data.a == $scope.count
                    speakOut("你贏了", "Chinese Female")
                else
                    speakOut("#{data.a} A #{data.b} B.", "Chinese Female")
            )

            socket1a2b.on('disconnected', () ->
                connectionNotReady()
            )

            checkConnected = () ->
                if not socket1a2b.socket.connected
                    connectionNotReady()
                setTimeout(checkConnected, 1000)

            checkConnected()
        );

        speakOut = (text, voice) ->
            #responsiveVoice.speak text, voice
            $('#speakVoice').attr('onclick', 'responsiveVoice.speak("' + text + '", "Chinese Female");');
            $('#speakVoice').trigger('click')

        $scope.draw = (create_room = true) ->
            size = $scope.conf.guess_number_size_selected

            count = size.value

            $scope.count = count

            numbers = []
            i = 0
            while i < 10
                numbers.push i
                i++

            numbers = util.shuffle(numbers)

            cols = []
            j = 0
            while j < count
                col = {
                    value: numbers.pop()
                }
                cols.push col

                j++

            $scope.answer = cols

            $scope.step = 'step-play'
            if create_room == true and $scope.socket_status.connected == 'ON'
                socket1a2b.emit('create-room', { size: count })

            return

        $scope.join = () ->
            room_id = $scope.conf.room_id
            socket1a2b.emit('join-room', { id: room_id })
#            sample_data = { a: 0, b: 0, cols: [1, 2, 3, 4], room_id: 48080 }
#            i = 0
#            while i < 30
#                $scope.your_guesses.push angular.copy sample_data
#                i++

        $scope.sendMyNumber = () ->
            number = $scope.conf.my_number

            number_in_string = number.toString()

            if number_in_string.length != $scope.answer.length
                speakOut("長度不正確", "Chinese Female")
                return

            $scope.my_turn = false
            $scope.conf.my_number = ''
            socket1a2b.emit('send-guess-number', { room_id: $scope.room_id, value: number })

        $scope.setTag = (tag) ->
            $scope.current_tag = tag

        $scope.setColorTag = (number) ->
            i = 0
            while i < 10
                if $scope.number_map[i].number == number
                    if $scope.number_map[i].tag == $scope.current_tag
                        $scope.number_map[i].tag = ''
                    else
                        $scope.number_map[i].tag = $scope.current_tag
                    break
                i++

        $scope.checkTag = (number, tag) ->
            i = 0
            while i < 10
                item = $scope.number_map[i]
                if item.number == number
                    return item.tag == tag
                i++
]