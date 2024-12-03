const chalk = require('chalk');
const { task, src, dest, series, watch, lastRun } = require('gulp');
const babel = require('gulp-babel');
const postcss = require('gulp-postcss');
const less = require('gulp-less');
const sass = require('gulp-sass')(require('sass'));
const npmSass = require('npm-sass');

const del = require('del');
const sourcemaps = require('gulp-sourcemaps');
const path = require('path');
const fs = require('fs');
const parseOptions = require('./utils').parseOptions;
const mergeEsmConfig = require('../index').mergeEsmConfig;

let globalEsmConfig;

const options = parseOptions(process.env.options);

const {
  buildOptions,
  rootDir,
  distDir,
  srcDir,
  jsMask,
  cssMask,
  scssMask,
  lessMask,
  otherMask,
  ignore,
  disableClean,
  babelConfigFile,
  postcssConfigFile,
  lessConfigFile,
  scssConfigFile,
  aliasConfigFile,
  esmConfigFile,
  commandPrefx,
  sourcemap,
  disableComplieStyles
} = options;

function runEsmConfigHook(hookName, args = []) {
  if (!globalEsmConfig) {
    let esmConfig = fs.existsSync(esmConfigFile)
      ? require(esmConfigFile)
      : {};
    if (typeof esmConfig === 'function') esmConfig = esmConfig(buildOptions);
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

let aliasConfig = null;
function getAliasConfig() {
  if (aliasConfig) return aliasConfig;
  aliasConfig = aliasConfigFile && fs.existsSync(aliasConfigFile)
    ? require(
      path.isAbsolute(aliasConfigFile) ? aliasConfigFile : path.join(rootDir, aliasConfigFile)
    )
    : {};
  if (aliasConfig && aliasConfig.alias) aliasConfig = aliasConfig.alias;
  if (!aliasConfig['~']) aliasConfig['~'] = srcDir;
  if (!aliasConfig['@']) aliasConfig['@'] = srcDir;
  return aliasConfig;
}

function cleanEsm() {
  console.log(chalk.cyan(commandPrefx) + ' clean esm...');

  if (srcDir === distDir) {
    console.log(chalk.cyan(commandPrefx) + ' ignore clean esm because srcDir equals distDir.');
    return Promise.resolve([]);
  }

  if (disableClean) {
    console.log(chalk.cyan(commandPrefx) + ' ignore clean esm.');
    return Promise.resolve([]);
  }

  const isContinue = runEsmConfigHook('cleanEsm', [buildOptions, options]);
  if (isContinue  === false) {
    console.log(chalk.cyan(commandPrefx) + ' clean paused.');
    return;
  }
  return del([
    `${distDir}/**/*`
  ], { cwd: rootDir });
}

function babelSupportTs(babelConfig) {
  let presetEnvIndex = -1;
  let presetTypeScriptIndex = -1;
  babelConfig.presets.forEach((preset, index) => {
    let presetOptions;
    if (Array.isArray(preset)) {
      presetOptions = preset[1];
      preset = preset[0];
    } else if (typeof preset === 'string') {
      presetOptions = {};
      babelConfig.presets[index] = [preset, presetOptions];
    } else {
      return;
    }
    let presetName = preset.toLowerCase();
    if (presetName.includes(path.join('@babel', 'preset-env')) || presetName.includes('@babel/preset-env')) {
      presetEnvIndex = index;
      return;
    }
    if (presetName.includes(path.join('@babel', 'typescript')) || presetName.includes('@babel/typescript')) {
      presetTypeScriptIndex = index;
    } else  if (presetName.includes(path.join('@babel', 'preset-typescript')) || presetName.includes('@babel/preset-typescript')) {
      presetTypeScriptIndex = index;
    }
  });
  if (presetEnvIndex > -1 && presetTypeScriptIndex === -1) {
    babelConfig.presets.splice(presetEnvIndex, 0, ['@babel/preset-typescript', {}]);
  }
  return babelConfig;
}

function buildJs(done, file) {
  console.log(chalk.cyan(commandPrefx) + ' build js start...');

  let babelConfig = fs.existsSync(babelConfigFile) ? require(babelConfigFile) : {};
  if (typeof babelConfig === 'function') babelConfig = babelConfig(buildOptions, options);
  if (!babelConfig.presets) babelConfig.presets = [];
  if (!babelConfig.plugins) babelConfig.plugins = [];

  if (buildOptions.typescript) {
    babelSupportTs(babelConfig);
  }

  const isContinue = runEsmConfigHook('buildJs', [buildOptions, babelConfig, {
    done,
    file,
    ...options
  }]);
  if (isContinue  === false) {
    console.log(chalk.cyan(commandPrefx) + ' build paused.');
    return;
  }

  let step = src(file || jsMask, { cwd: rootDir, since: lastRun(buildJs), ignore });
  if (sourcemap) step = step.pipe(sourcemaps.init());
  step = step.pipe(babel(babelConfig));
  if (sourcemap) step = step.pipe(sourcemaps.write('.'));

  step.pipe(dest(distDir, { cwd: rootDir }))
    .on('end', function () {
      console.log(chalk.cyan(commandPrefx) + ' build js end.');

      done && done.apply(null, arguments);
    });
}

let postcssPlugins;
function getPostcssPlugins() {
  if (postcssPlugins) return postcssPlugins;

  let postcssConfig = fs.existsSync(postcssConfigFile) ? require(postcssConfigFile) : {};
  if (typeof postcssConfig === 'function') postcssConfig = postcssConfig(buildOptions, options);

  postcssPlugins = Object.keys(postcssConfig.plugins || {}).map(key => require(key)(postcssConfig.plugins[key]));

  const isContinue = runEsmConfigHook('buildPostcss', [buildOptions, postcssPlugins, options]);
  if (isContinue  === false) {
    console.log(chalk.cyan(commandPrefx) + ' build paused.');
    return;
  }

  return postcssPlugins;
}

function buildOthers(done, file) {
  console.log(chalk.cyan(commandPrefx) + ' build others start...');
  let othersConfig = {};
  const isContinue = runEsmConfigHook('buildOthers', [buildOptions, othersConfig, {
    done,
    file,
    ...options
  }]);
  if (isContinue  === false) {
    console.log(chalk.cyan(commandPrefx) + ' build paused.');
    return;
  }

  src(file || otherMask, { cwd: rootDir, since: lastRun(buildOthers), ignore })
    .pipe(dest(distDir), { cwd: rootDir })
    .on('end', function () {
      console.log(chalk.cyan(commandPrefx) + ' build others end.');

      done && done.apply(null, arguments);
    });
}

function buildLess(done, file) {
  if (disableComplieStyles) {
    buildOthers(done, file || lessMask);
    return;
  }
  console.log(chalk.cyan(commandPrefx) + ' build less start...');
  const postcssPlugins = getPostcssPlugins();
  if (!postcssPlugins) {
    done();
    return;
  }

  let lessConfig = fs.existsSync(lessConfigFile) ? require(lessConfigFile) : {
    javascriptEnabled: true,
  };
  if (typeof lessConfig === 'function') lessConfig = lessConfig(buildOptions, options);

  const isContinue = runEsmConfigHook('buildLess', [buildOptions, lessConfig, {
    done,
    file,
    ...options
  }]);
  if (isContinue  === false) {
    console.log(chalk.cyan(commandPrefx) + ' build paused.');
    return;
  }

  src(file || lessMask, { cwd: rootDir, since: lastRun(buildLess), ignore })
    .pipe(less(lessConfig))
    .pipe(postcss(postcssPlugins))
    .pipe(dest(distDir, { cwd: rootDir }))
    .on('end', function () {
      console.log(chalk.cyan(commandPrefx) + ' build less end.');

      done && done.apply(null, arguments);
    });
}

function buildScss(done, file) {
  if (disableComplieStyles) {
    buildOthers(done, file || scssMask);
    return;
  }
  console.log(chalk.cyan(commandPrefx) + ' build scss start...');
  const postcssPlugins = getPostcssPlugins();
  if (!postcssPlugins) {
    done();
    return;
  }

  let scssConfig = fs.existsSync(scssConfigFile) ? require(scssConfigFile) : {};
  if (typeof scssConfig === 'function') scssConfig = scssConfig(buildOptions, options);

  const aliasConfig = getAliasConfig();

  scssConfig = {
    silenceDeprecations: ['legacy-js-api'],
    importer: (url, file, done) => {
      let aliasName = Object.keys(aliasConfig).find(key => url.startsWith(key));
      if (aliasName) {
        url = path.relative(path.dirname(file), path.join(aliasConfig[aliasName], url.replace(aliasName, '')));
      }
      return npmSass.importer(url, file, done);
    },
    ...scssConfig
  };

  const isContinue = runEsmConfigHook('buildScss', [buildOptions, scssConfig, {
    done,
    file,
    ...options
  }]);
  if (isContinue  === false) {
    console.log(chalk.cyan(commandPrefx) + ' build paused.');
    return;
  }

  src(file || scssMask, { cwd: rootDir, since: lastRun(buildScss), ignore })
    .pipe(sass(scssConfig).on('error', sass.logError))
    .pipe(postcss(postcssPlugins))
    .pipe(dest(distDir, { cwd: rootDir }))
    .on('end', function () {
      console.log(chalk.cyan(commandPrefx) + ' build scss end.');

      done && done.apply(null, arguments);
    });
}

function buildCss(done, file) {
  if (disableComplieStyles) {
    buildOthers(done, file || cssMask);
    return;
  }
  console.log(chalk.cyan(commandPrefx) + ' build css start...');
  const postcssPlugins = getPostcssPlugins();
  if (!postcssPlugins) {
    done();
    return;
  }

  let cssConfig = { plugins: postcssPlugins };
  const isContinue = runEsmConfigHook('buildCss', [buildOptions, cssConfig, {
    done,
    file,
    ...options
  }]);
  if (isContinue === false) {
    console.log(chalk.cyan(commandPrefx) + ' build paused.');
    return;
  }

  src(file || cssMask, { cwd: rootDir, since: lastRun(buildCss), ignore })
    .pipe(postcss(cssConfig.plugins))
    .pipe(dest(distDir, { cwd: rootDir }))
    .on('end', function () {
      console.log(chalk.cyan(commandPrefx) + ' build css end.');

      done && done.apply(null, arguments);
    });
}


const build = series(buildJs, buildScss, buildLess, buildCss, buildOthers);
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

  watch([cssMask], {
    events: ['add', 'change'],
    cwd: rootDir,
    ignore,
  }, series(cb => {
    console.log(chalk.cyan(commandPrefx) + '[watcher] build css start...');
    cb();
  }, buildCss, cb => {
    console.log(chalk.cyan(commandPrefx) + '[watcher] build css end.');
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
