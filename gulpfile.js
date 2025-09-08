const gulp = require('gulp')
const inline = require('gulp-inline')

// Task: inline CSS and JS into HTML
gulp.task('build', function () {
  return gulp
    .src('battleship/battleseek.html')
    .pipe(
      inline({
        base: 'battleship/', // where CSS/JS files live
        disabledTypes: [] // keep empty if you want both CSS & JS inlined
      })
    )
    .pipe(gulp.dest('dist'))
})
