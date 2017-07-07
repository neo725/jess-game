'use strict';

var gulp = require('gulp'),
    clean = require('gulp-clean'),
    sequence = require('run-sequence'),
    requireDir = require('require-dir');


requireDir('./gulp-script');

gulp.task('clean', function () {
    return gulp.src(['css', 'js', 'images', 'assets/dist', 'assets/build'], { read: false })
        .pipe(clean({ force: true }));
});

gulp.task('watch', function () {
    gulp.watch(['assets/coffee/main.coffee', 'assets/coffee/*/*.coffee', 'assets/coffee/*/**/*.coffee'], ['appjs-browserify']);
    //gulp.watch('assets/coffee/vendor.coffee', ['vendorjs-browserify']);
    gulp.watch(['assets/scss/*.scss', 'assets/scss/**/*.scss'], ['css']);
    gulp.watch('assets/imgs/assets/*', ['image']);
    gulp.watch('assets/imgs/icons/*', ['image']);
});

gulp.task('assets', function () {
    sequence('css', 'image', 'javascript');
});

gulp.task('default', function () {
    sequence('clean', 'assets', 'watch');
});
