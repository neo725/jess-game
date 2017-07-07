'use strict';

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    spritesmith = require('gulp.spritesmith'),
    sequence = require('run-sequence'),
    rename = require('gulp-rename'),
    yargs = require('yargs').argv;


//var debug = (yargs.debug == 'false') ? false : true;

gulp.task('image', function(){
    sequence(['image:assets', 'image:sprite']);
});

gulp.task('image:assets', function () {
    // fav icon
    /*gulp.src(['assets/images/favicon.ico']).pipe(gulp.dest('www/img'));*/

    return gulp.src('assets/imgs/assets/**/*')
        .pipe(gulp.dest('images'));
});

gulp.task('image:sprite', function () {
    var spriteData = gulp.src('assets/imgs/icons/**/*.png')
        .pipe(spritesmith({
            imgName: 'sprite.png',
            cssName: '_sprite.scss',
            imgPath: '../images/sprite.png',
            algorithm: 'top-down'
        }));

    spriteData.img.pipe(gulp.dest('./app/images'));
    spriteData.css.pipe(gulp.dest('assets/scss/icon/'));
});