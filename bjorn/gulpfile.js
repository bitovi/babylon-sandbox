var gulp = require('gulp'),
    connect = require('gulp-connect'),
    open = require('gulp-open');
/**
 * Configuration for the local server
 */
var config = {
    port: 9001,
    browser: {
        url: 'http://localhost:9001',
        app: 'chrome'
    }
};

/**
 * Server Tasks
 */
gulp.task('server:app', function () {
    connect.server({
        port: config.port,
        root: ''
    });
    return gulp.src('./index.html')
        .pipe(open('', config.browser));
});