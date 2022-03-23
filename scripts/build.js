const gulp = require('gulp');

function runTask(toRun) {
  const taskInstance = gulp.task(toRun);
  taskInstance.apply(gulp);
}

require('../config/gulpfile');

runTask('build');
