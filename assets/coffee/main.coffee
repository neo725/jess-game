angular.module('jess-game', ['ngRoute', 'btford.socket-io'])
.factory('BingoSocket', require('./factory/bingo-socket-factory'))
.controller('BingoController', require('./controller/bingo-controller'))
.config([
    '$locationProvider', '$routeProvider',
    ($locationProvider, $routeProvider) ->
        $locationProvider.hashPrefix('!')

        $routeProvider

        .when('/bingo',
            templateUrl: 'partial/_bingo.html'
        )
        .when('/1a2b',
            templateUrl: 'partial/_1a2b.html'
        )

        $routeProvider.otherwise({redirectTo: '/bingo'})
])