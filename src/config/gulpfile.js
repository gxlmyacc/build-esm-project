const { task, src, dest, series, watch, lastRun } = require('gulp');
const babel = require('gulp-babel');
const postcss = require('gulp-postcss');
const less = require('gulp-less');
const sass = require('gulp-sass')(require('sass'));
const del = require('del');
const sourcemaps = require('gulp-sourcemaps');
const path = require('path');
const fs = require('fs');

const options = JSON.parse(process.env.options || {});
const rootDir = options.root
  ? path.resolve(process.cwd(), options.root)
  : process.cwd();
const srcDir = options.src ? options.src : './src';
const distDir = options.out ? options.out : './esm';
const jsMask = `${srcDir}/**/*.{js,jsx${options.typescript ? 'ts,tsx' : ''}}`;
const lessMask = `${srcDir}/**/*.less`;
const scssMask = `${srcDir}/**/*.scss`;
const otherMask = `${srcDir}/**/*.{css,png,jpg,gif,ico,json,svg}`;
const ignore = options.ignore
  ? options.ignore.split(',').filter(Boolean)
  : [];
const babelConfigFile = options.babelConfig
  ? path.resolve(rootDir, options.babelConfig)
  : path.resolve(rootDir, './babel.config.js');
const postcssConfigFile = options.postcssConfig
  ? path.resolve(rootDir, options.postcssConfig)
  : path.resolve(rootDir, './postcss.config.js');
const buildConfigFile = options.buildConfig
  ? path.resolve(rootDir, options.buildConfig)
  : path.resolve(rootDir, './build-esm.config.js');

let buildConfig = fs.existsSync(buildConfigFile)
  ? require(buildConfigFile)
  : {};
if (typeof buildConfig === 'function') buildConfig = buildConfig(options);

function cleanEsm() {
  if (buildConfig.cleanEsm) {
    const isContinue = buildConfig.cleanEsm();
    if (isContinue  === false) return;
  }
  return del([
    `${distDir}/**/*`
  ], { cwd: rootDir });
}

function buildJs(done, file) {
  let config = fs.existsSync(babelConfigFile) ? require(babelConfigFile) : {};
  if (typeof config === 'function') config = config();
  if (!config.presets) config.presets = [];
  if (!config.plugins) config.plugins = [];

  if (buildConfig.buildJs) {
    const isContinue = buildConfig.buildJs(config, done, file);
    if (isContinue === false) return;
  }

  src(file || jsMask, { cwd: rootDir, since: lastRun(buildJs), ignore })
    .pipe(sourcemaps.init())
    .pipe(babel(config))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(distDir, { cwd: rootDir }))
    .on('end', done);
}

let postcssPlugins;
function getPostcssPlugins() {
  if (postcssPlugins) return postcssPlugins;

  let postcssConfig = fs.existsSync(postcssConfigFile) ? require(postcssConfigFile) : {};
  if (typeof postcssConfig === 'function') postcssConfig = postcssConfig();

  postcssPlugins = Object.keys(postcssConfig.plugins || {}).map(key => require(key)(postcssConfig.plugins[key]));

  if (buildConfig.buildPostcss) {
    const isContinue = buildConfig.buildPostcss(postcssPlugins);
    if (isContinue === false) return;
  }

  return postcssPlugins;
}

function buildLess(done, file) {
  const postcssPlugins = getPostcssPlugins();
  if (!postcssPlugins) {
    done();
    return;
  }

  let lessConfig = {};
  if (buildConfig.buildLess) {
    const isContinue = buildConfig.buildLess(lessConfig, done, file);
    if (isContinue === false) return;
  }

  src(file || lessMask, { cwd: rootDir, since: lastRun(buildLess), ignore })
    .pipe(less())
    .pipe(postcss(postcssPlugins))
    .pipe(dest(distDir, { cwd: rootDir }))
    .on('end', done);
}

function buildScss(done, file) {
  const postcssPlugins = getPostcssPlugins();
  if (!postcssPlugins) {
    done();
    return;
  }

  let scssConfig = {};
  if (buildConfig.buildScss) {
    const isContinue = buildConfig.buildScss(scssConfig, done, file);
    if (isContinue === false) return;
  }

  src(file || scssMask, { cwd: rootDir, since: lastRun(buildScss), ignore })
    .pipe(sass(scssConfig).on('error', sass.logError))
    .pipe(postcss(postcssPlugins))
    .pipe(dest(distDir, { cwd: rootDir }))
    .on('end', done);
}

function buildOthers(done, file) {
  if (buildConfig.buildOthers) {
    const isContinue = buildConfig.buildOthers(done, file);
    if (isContinue === false) return;
  }
  src(file || otherMask, { cwd: rootDir, since: lastRun(buildOthers), ignore })
    .pipe(dest(distDir), { cwd: rootDir })
    .on('end', done);
}

const build = series(buildJs, buildScss, buildLess, buildOthers);
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

  watch([lessMask], {
    events: ['add', 'change'],
    cwd: rootDir,
    ignore,
  }, series(cb => {
    console.log('build less start...');
    cb();
  }, buildLess, cb => {
    console.log('build less end.');
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
    if (path.extname(file) === '.js') del([`${file}.map`], { force: true, cwd: rootDir });
    console.log(`File ${file} was removed`);
  });
  watcher.on('unlinkDir', file => {
    file = path.relative(rootDir, file);
    file = `./${file.replace(/\\/g, '/')}`.replace(srcDir, distDir);
    del([file], { force: true, cwd: rootDir });
    console.log(`Dir ${file} was removed`);
  });

  console.log('watcher started.');
  done();
}));
