module.exports = {
    shuffle: (array) ->
        currentIndex = array.length
        while 0 != currentIndex
            randomIndex = Math.floor(Math.random() * currentIndex)
            currentIndex -= 1

            temporaryValue = array[currentIndex]
            array[currentIndex] = array[randomIndex]
            array[randomIndex] = temporaryValue

        return array

    checkBingoLines: (rows) ->
        lines = []
        size = rows.length

        # check type: row
        i = 0
        while i < size
            j = 0
            count = 0
            while j < size
                if rows[i].cols[j].clicked
                    count += 1
                j++
            if count == size
                lines.push { type: 'row', index: i }
            i++

        # check type: col
        i = 0
        while i < size
            j = 0
            count = 0
            while j < size
                if rows[j].cols[i].clicked
                    count += 1
                j++
            if count == size
                lines.push { type: 'col', index: i }
            i++

        # check type: lt-rd
        i = 0
        count = 0
        while i < size
            if rows[i].cols[i].clicked
                count += 1
            i++
        if count == size
            lines.push { type: 'lt-rd' }

        # check type: rt-ld
        i = 0
        count = 0
        while i < size
            if rows[i].cols[size - (i + 1)].clicked
                count += 1
            i++
        if count == size
            lines.push { type: 'rt-ld' }

        return lines
#        return [
#            { type: 'row', index: 2 },
#            { type: 'col', index: 3 },
#            { type: 'lt-rd' },
#            { type: 'rt-ld' }
#        ]
}