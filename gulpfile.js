var gulp = require('gulp'),
    gutil = require('gulp-util'),
    concat = require('gulp-concat'),
    minifyCss = require('gulp-minify-css'),
    uglify = require('gulp-uglify'),
    babel = require('gulp-babel'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    header = require('gulp-header'),
    _ = require('underscore'),
    combiner = require('stream-combiner2');

var combinedServer = [];
//合并js
gulp.task('app', function(){
    combinedServer[0] = combiner.obj([
        gulp.src( './app/**' ),
        gulp.dest('./product/app')
    ]);
    combinedServer[0].on('error', console.error.bind(console));
});

gulp.task('server', function(){
    combinedServer[1] = combiner.obj([
        gulp.src( './server/**' ),
        header('"use strict";require("babel-polyfill");'),
        babel(),
        //uglify(),
        gulp.dest('./product/server')
    ]);    
    combinedServer[1].on('error', console.error.bind(console));
})

gulp.task('config', function(){
    combinedServer[2] = combiner.obj([
        gulp.src( './config/**' ),
        header('module.exports = '),
        gulp.dest('./product/server/common')
    ]);   
    combinedServer[2].on('error', console.error.bind(console));
});

gulp.task('default', function( release ){
    gulp.start(['app', 'server', 'config']);
});
