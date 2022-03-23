const { task, src, dest, series, watch, lastRun } = require('gulp');
const babel = require('gulp-babel');
const postcss = require('gulp-postcss');
const sass = require('gulp-sass')(require('sass'));
const del = require('del');
const sourcemaps = require('gulp-sourcemaps');
const path = require('path');
const fs = require('fs');

const rootDir = process.env.options.root
  ? path.resolve(process.cwd(), process.env.options.root)
  : process.cwd();
const srcDir = process.env.options.src
  ? path.resolve(process.cwd(), process.env.options.src)
  : path.resolve(process.cwd(), './src');
const distDir = process.env.options.out
  ? path.resolve(process.cwd(), process.env.options.out)
  : path.resolve(process.cwd(), './esm');
const jsMask = `${srcDir}/**/*.{js,jsx}`;
const scssMask = `${srcDir}/**/*.scss`;
const otherMask = `${srcDir}/**/*.{css,png,jpg,gif,ico,json,svg}`;
const ignore = process.env.options.ignore
  ? process.env.options.ignore.split(',').filter(Boolean)
  : [];

function cleanEsm() {
  return del([
    `${distDir}/**/*`
  ], { cwd: rootDir });
}

function buildJs(done, file) {
  const filename = path.resolve(rootDir, './babel.config.js');
  let config = fs.existsSync(filename) ? require(filename) : {};
  if (typeof config === 'function') config = config();
  src(file || jsMask, { cwd: rootDir, since: lastRun(buildJs), ignore })
    .pipe(sourcemaps.init())
    .pipe(babel(config))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(distDir, { cwd: rootDir }))
    .on('end', done);
}

function buildScss(done, file) {
  const filename = path.resolve(rootDir, './postcss.config.js');
  let config = fs.existsSync(filename) ? require(filename) : {};
  if (typeof config === 'function') config = config();
  const plugins = Object.keys(config.plugins || {}).map(key => require(key)(config.plugins[key]));
  src(file || scssMask, { cwd: rootDir, since: lastRun(buildScss), ignore })
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss(plugins))
    .pipe(dest(distDir, { cwd: rootDir }))
    .on('end', done);
}

function buildOthers(done, file) {
  src(file || otherMask, { cwd: rootDir, since: lastRun(buildOthers), ignore })
    .pipe(dest(distDir), { cwd: rootDir })
    .on('end', done);
}

const build = series(buildJs, buildScss, buildOthers);
task('build', series(cleanEsm, build));

task('start', series(build, done => {
  watch([`${srcDir}/**/*.*`], {
    events: ['addDir'],
    cwd: rootDir,
    ignore,
  }, series(cb => {
    console.log('build all start...');
    cb();
  }, build, cb => {
    console.log('build all end.');
    cb();
  }));
  watch([jsMask], {
    events: ['add', 'change'],
    cwd: rootDir,
    ignore,
  }, series(cb => {
    console.log('build js start...');
    cb();
  }, buildJs, cb => {
    console.log('build js end.');
    cb();
  }));

  watch([scssMask], {
    events: ['add', 'change'],
    cwd: rootDir,
    ignore,
  }, series(cb => {
    console.log('build scss start...');
    cb();
  }, buildScss, cb => {
    console.log('build scss end.');
    cb();
  }));

  watch([otherMask], {
    events: ['add', 'change'],
    cwd: rootDir,
    ignore,
  }, series(cb => {
    console.log('build others start...');
    cb();
  }, buildOthers, cb => {
    console.log('build others end.');
    cb();
  }));

  const watcher = watch([`${srcDir}/**/*.*`], {
    events: ['unlink', 'unlinkDir'],
    cwd: rootDir,
    ignore,
  });
  watcher.on('unlink', file => {
    file = `./${file.replace(/\\/g, '/')}`.replace(srcDir, distDir);
    if (path.extname(file) === '.scss') file = file.replace(/\.scss$/, '.css');
    del([file], { force: true });
    if (path.extname(file) === '.js') del([`${file}.map`], { force: true });
    console.log(`File ${file} was removed`);
  });
  watcher.on('unlinkDir', file => {
    file = path.relative(rootDir, file);
    file = `./${file.replace(/\\/g, '/')}`.replace(srcDir, distDir);
    del([file], { force: true });
    console.log(`Dir ${file} was removed`);
  });

  console.log('watcher started.');
  done();
}));
