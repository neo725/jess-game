constants = require('../common/constants')()

module.exports = [
    '$scope', '$log',
    ($scope, $log) ->
        $scope.conf = {}
        $scope.rows = []

        $scope.bingo_grid_size = constants.bingo_grid_size

        $scope.draw = () ->
            size = $scope.conf.grid_size_selected

            count = size.value

            makeCols = (count) ->
                cols = []
                i = 0
                while i < count
                    col = {
                        value: 0
                    }
                    cols.push col

                    i++
                return cols

            rows = []
            i = 0
            while i < count
                row = {
                    cols: makeCols(count)
                }
                rows.push row

                i++

            $scope.rows = rows

            return
]