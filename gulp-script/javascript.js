'use strict';

var gulp = require('gulp'),
    gutil = require('gulp-util'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    glob = require('glob'),
    es = require('event-stream'),
    rename = require('gulp-rename'),
    browserify = require('browserify'),
    transform = require('vinyl-transform'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    gif = require('gulp-if'),
    coffee = require('gulp-coffee'),
    concat = require('gulp-concat'),
    sequence = require('run-sequence'),
    yargs = require('yargs').argv;

var release = (yargs.release == 'true') ? true : false;
gutil.log('>> javascript.release = ' + release);

gulp.task('javascript', function () {
    sequence(['vendorjs-browserify', 'appjs-browserify']);
  });

gulp.task('coffeeifyjs', function () {
    return gulp.src('assets/coffee/**/*.coffee')
        .pipe(coffee({ bare: true }).on('error', gutil.log))
        .pipe(gulp.dest('assets/build/coffeeify'));
  });

gulp.task('vendorjs-browserify', ['coffeeifyjs'], function (cb) {
    //return browserify('./assets/build/coffeeify/vendor.js')
    //    .bundle()
    //    .pipe(source('vendor.js'))
    //    .pipe(gulp.dest('js'));

    //return gulp.src(['./assets/build/coffeeify/vendor.js']) // you can also use glob patterns here to browserify->uglify multiple files
    //.pipe(browserified)
    //.pipe(uglify())
    return browserify('./assets/build/coffeeify/vendor.js')
        .bundle()
        .pipe(source('vendor.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest('./app/js'));
  });

gulp.task('appjs-browserify', ['coffeeifyjs'], function (done) {
    //glob('./assets/build/coffeeify/**/main.js', function(err, files) {
    //    if (err) done(err);
    //
    //    var tasks = files.map(function(entry) {
    //        return browserify({ entries: entry })
    //            .bundle()
    //            //.pipe(source(entry))
    //            .pipe(source('main.js'))
    //            .pipe(buffer())
    //            .pipe(sourcemaps.init())
    //            .pipe(uglify())
    //            .pipe(sourcemaps.write('map'))
    //            .pipe(gulp.dest('js'));
    //    });
    //    es.merge(tasks).on('end', done);
    //});
    return browserify({ entries: './assets/build/coffeeify/main.js', debug: true })
        .bundle()
        .pipe(source('main.js'))
        .pipe(buffer())
        //.pipe(sourcemaps.init({loadMaps: true}))
        //.pipe(uglify())
        //.pipe(sourcemaps.write('map'))
        .pipe(gulp.dest('./app/js'));
  });
