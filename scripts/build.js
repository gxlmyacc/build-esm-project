const gulp = require('gulp');
const path = require('path');

function runTask(toRun) {
  const taskInstance = gulp.task(toRun);
  taskInstance.apply(gulp);
}

require(path.resolve(__dirname, '../config/gulpfile.js'));

runTask('build');
