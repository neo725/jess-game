'use strict';

var gulp = require('gulp'),
    concat = require('gulp-concat'),
    sass = require('gulp-sass'),
    cleanCSS = require('gulp-clean-css'),
    gif = require('gulp-if'),
    rename = require('gulp-rename'),
    sequence = require('run-sequence'),
    sourcemaps = require('gulp-sourcemaps'),
    yargs = require('yargs').argv;


var release = (yargs.release == 'true') ? true : false;

gulp.task("css", function () {
    sequence("css:tocss", "css:copycss", "css:minify");
});

gulp.task("css:tocss", function () {
    return gulp.src('assets/scss/**/*.scss')
        .pipe(sass())
        .pipe(rename(function (path) {
            path.extname = ".css";
        }))
        .pipe(gulp.dest('assets/build/css'));
});

gulp.task("css:copycss", function() {
    return gulp.src(['assets/css/**/*.css', 'assets/css/**/*.css.map'])
        .pipe(gulp.dest('assets/build/css'));
});

gulp.task("css:minify", function () {
    //return gulp.src('assets/build/css/*.css')
    return gulp.src(['assets/css/**/*.css', 'assets/build/css/main.css'])
    //.pipe(sourcemaps.init())
    //.pipe(gif(release, cleanCSS({ compatibility: 'ie9' })))
    //.pipe(cleanCSS({ compatibility: 'ie9' }))
        .pipe(concat('site.css'))
        //.pipe(sourcemaps.write())
        .pipe(gulp.dest('./app/css'));
});