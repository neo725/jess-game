module.exports = () ->

    bingo_grid_size = []
    i = 5
    while i < 11
        bingo_grid_size.push {
            label: "#{i} x #{i}",
            value: i
        }
        i++

    return {
        bingo_grid_size: bingo_grid_size
    }