module.exports = {
    'jquery': {
        exports: 'global:$'
    },
    'angular': {
        exports: 'global:angular',
        depends: {
            'jquery': '$'
        }
    },
    'lodash': {
        exports: 'global:_'
    }
};