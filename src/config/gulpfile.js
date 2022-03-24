const chalk = require('chalk');
const { task, src, dest, series, watch, lastRun } = require('gulp');
const babel = require('gulp-babel');
const postcss = require('gulp-postcss');
const less = require('gulp-less');
const sass = require('gulp-sass')(require('sass'));
const del = require('del');
const sourcemaps = require('gulp-sourcemaps');
const path = require('path');
const fs = require('fs');
const mergeEsmConfig = require('../index').mergeEsmConfig;

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
const esmConfigFile = options.esmConfig
  ? path.resolve(rootDir, options.esmConfig)
  : path.resolve(rootDir, './esm-project.config.js');
const commandPrefx = options.commandPrefx || '[build-esm-project]';


let globalEsmConfig;
function runEsmConfigHook(hookName, args = []) {
  if (!globalEsmConfig) {
    let esmConfig = fs.existsSync(esmConfigFile)
      ? require(esmConfigFile)
      : {};
    if (typeof esmConfig === 'function') esmConfig = esmConfig(options);
    globalEsmConfig = mergeEsmConfig(esmConfig);
  }

  let isContinue = true;
  if (!globalEsmConfig[hookName]) return isContinue;

  globalEsmConfig[hookName].some(fn => {
    isContinue = fn.apply(globalEsmConfig[hookName], args) !== false;
    return !isContinue;
  });

  return isContinue;
}

function cleanEsm() {
  console.log(chalk.cyan(commandPrefx) + ' clean esm...');

  const isContinue = runEsmConfigHook('cleanEsm');
  if (isContinue  === false) {
    console.log(chalk.cyan(commandPrefx) + ' clean paused.');
    return;
  }
  return del([
    `${distDir}/**/*`
  ], { cwd: rootDir });
}


function buildJs(done, file) {
  console.log(chalk.cyan(commandPrefx) + ' build js start...');

  let config = fs.existsSync(babelConfigFile) ? require(babelConfigFile) : {};
  if (typeof config === 'function') config = config();
  if (!config.presets) config.presets = [];
  if (!config.plugins) config.plugins = [];

  const isContinue = runEsmConfigHook('buildJs', [config, done, file]);
  if (isContinue  === false) {
    console.log(chalk.cyan(commandPrefx) + ' build paused.');
    return;
  }

  src(file || jsMask, { cwd: rootDir, since: lastRun(buildJs), ignore })
    .pipe(sourcemaps.init())
    .pipe(babel(config))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(distDir, { cwd: rootDir }))
    .on('end', () => {
      console.log(chalk.cyan(commandPrefx) + ' build js end.');

      done && done.apply(arguments);
    });
}

let postcssPlugins;
function getPostcssPlugins() {
  if (postcssPlugins) return postcssPlugins;

  let postcssConfig = fs.existsSync(postcssConfigFile) ? require(postcssConfigFile) : {};
  if (typeof postcssConfig === 'function') postcssConfig = postcssConfig();

  postcssPlugins = Object.keys(postcssConfig.plugins || {}).map(key => require(key)(postcssConfig.plugins[key]));

  const isContinue = runEsmConfigHook('buildPostcss', [postcssPlugins]);
  if (isContinue  === false) {
    console.log(chalk.cyan(commandPrefx) + ' build paused.');
    return;
  }

  return postcssPlugins;
}

function buildLess(done, file) {
  console.log(chalk.cyan(commandPrefx) + ' build less start...');
  const postcssPlugins = getPostcssPlugins();
  if (!postcssPlugins) {
    done();
    return;
  }

  let lessConfig = {};
  const isContinue = runEsmConfigHook('buildLess', [lessConfig, done, file]);
  if (isContinue  === false) {
    console.log(chalk.cyan(commandPrefx) + ' build paused.');
    return;
  }

  src(file || lessMask, { cwd: rootDir, since: lastRun(buildLess), ignore })
    .pipe(less(lessConfig))
    .pipe(postcss(postcssPlugins))
    .pipe(dest(distDir, { cwd: rootDir }))
    .on('end', () => {
      console.log(chalk.cyan(commandPrefx) + ' build less end.');

      done && done.apply(arguments);
    });
}

function buildScss(done, file) {
  console.log(chalk.cyan(commandPrefx) + ' build scss start...');
  const postcssPlugins = getPostcssPlugins();
  if (!postcssPlugins) {
    done();
    return;
  }

  let scssConfig = {};
  const isContinue = runEsmConfigHook('buildScss', [scssConfig, done, file]);
  if (isContinue  === false) {
    console.log(chalk.cyan(commandPrefx) + ' build paused.');
    return;
  }

  src(file || scssMask, { cwd: rootDir, since: lastRun(buildScss), ignore })
    .pipe(sass(scssConfig).on('error', sass.logError))
    .pipe(postcss(postcssPlugins))
    .pipe(dest(distDir, { cwd: rootDir }))
    .on('end', () => {
      console.log(chalk.cyan(commandPrefx) + ' build scss end.');

      done && done.apply(arguments);
    });
}

function buildOthers(done, file) {
  console.log(chalk.cyan(commandPrefx) + ' build others start...');
  let othersConfig = {};
  const isContinue = runEsmConfigHook('buildScss', [othersConfig, done, file]);
  if (isContinue  === false) {
    console.log(chalk.cyan(commandPrefx) + ' build paused.');
    return;
  }

  src(file || otherMask, { cwd: rootDir, since: lastRun(buildOthers), ignore })
    .pipe(dest(distDir), { cwd: rootDir })
    .on('end', () => {
      console.log(chalk.cyan(commandPrefx) + ' build others end.');

      done && done.apply(arguments);
    });
}

const build = series(buildJs, buildScss, buildLess, buildOthers);
task('build', series(cleanEsm, build));

task('start', series(build, done => {
  watch([`${srcDir}/**/*.*`], {
    events: ['addDir'],
    cwd: rootDir,
    ignore,
  }, series(cb => {
    console.log(chalk.cyan(commandPrefx) + '[watcher] build all start...');
    cb();
  }, build, cb => {
    console.log(chalk.cyan(commandPrefx) + '[watcher] build all end.');
    cb();
  }));
  watch([jsMask], {
    events: ['add', 'change'],
    cwd: rootDir,
    ignore,
  }, series(cb => {
    console.log(chalk.cyan(commandPrefx) + '[watcher] build js start...');
    cb();
  }, buildJs, cb => {
    console.log(chalk.cyan(commandPrefx) + '[watcher] build js end.');
    cb();
  }));

  watch([lessMask], {
    events: ['add', 'change'],
    cwd: rootDir,
    ignore,
  }, series(cb => {
    console.log(chalk.cyan(commandPrefx) + '[watcher] build less start...');
    cb();
  }, buildLess, cb => {
    console.log(chalk.cyan(commandPrefx) + '[watcher] build less end.');
    cb();
  }));

  watch([scssMask], {
    events: ['add', 'change'],
    cwd: rootDir,
    ignore,
  }, series(cb => {
    console.log(chalk.cyan(commandPrefx) + '[watcher] build scss start...');
    cb();
  }, buildScss, cb => {
    console.log(chalk.cyan(commandPrefx) + '[watcher] build scss end.');
    cb();
  }));

  watch([otherMask], {
    events: ['add', 'change'],
    cwd: rootDir,
    ignore,
  }, series(cb => {
    console.log(chalk.cyan(commandPrefx) + '[watcher] build others start...');
    cb();
  }, buildOthers, cb => {
    console.log(chalk.cyan(commandPrefx) + '[watcher] build others end.');
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
    console.log(chalk.cyan(commandPrefx) + `[watcher] File ${file} was removed`);
  });
  watcher.on('unlinkDir', file => {
    file = path.relative(rootDir, file);
    file = `./${file.replace(/\\/g, '/')}`.replace(srcDir, distDir);
    del([file], { force: true, cwd: rootDir });
    console.log(chalk.cyan(commandPrefx) + `[watcher] Dir ${file} was removed`);
  });

  console.log(chalk.cyan(commandPrefx) + '[watcher] watcher started.');
  done();
}));
