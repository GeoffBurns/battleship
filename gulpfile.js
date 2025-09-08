const gulp = require("gulp");
const concat = require("gulp-concat");
const inject = require("gulp-inject");
const fs = require("fs");

// Task: merge CSS + JS inline into HTML
gulp.task("build", function () {
  const cssContent = fs.readFileSync("src/style.css", "utf8");
  const jsContent = fs.readFileSync("src/script.js", "utf8");

  return gulp
    .src("src/index.html")
    .pipe(
      inject(gulp.src([], { read: false }), {
        starttag: "<!-- inject:css -->",
        endtag: "<!-- endinject -->",
        transform: function () {
          return `<style>\n${cssContent}\n</style>`;
        },
      })
    )
    .pipe(
      inject(gulp.src([], { read: false }), {
        starttag: "<!-- inject:js -->",
        endtag: "<!-- endinject -->",
        transform: function () {
          return `<script>\n${jsContent}\n</script>`;
        },
      })
    )
    .pipe(concat("final.html"))
    .pipe(gulp.dest("dist"));
});
