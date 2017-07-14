module.exports = [
    '$log', 'socketFactory',
    ($log, socketFactory) ->
        socket = io.connect(conf.socket_io_host)
        factory = socketFactory({
            ioSocket: socket
        })
        factory.socket = socket

        return factory
]