const path = require('path');

function parseOptions(options = process.env.options || []) {
  const buildOptions = (!options || typeof options === 'string')
    ? JSON.parse(process.env.options || {})
    : options;

  let {
    root,
    src,
    out,
    styleSrc,
    styleOut,
    ignore,
    babelConfig,
    postcssConfig,
    lessConfig,
    scssConfig,
    aliasConfig,
    esmConfig,
    typescript,
    disableComplieStyles,
    disableClean,

    commandPrefx = '[build-esm-project]',
    ...restOptions
  } = buildOptions;

  const rootDir = root
    ? path.resolve(process.cwd(), root)
    : process.cwd();
  const srcDir = src || './src';
  const distDir = out || './esm';
  const styleSrcDir =  styleSrc || srcDir;
  const styleDistDir = styleOut || distDir;
  const jsMask = `${srcDir}/**/*.{js,jsx,mjs,cjs${typescript ? ',ts,tsx,mts,cts' : ''}}`;
  const lessMask = `${styleSrcDir}/**/*.less`;
  const scssMask = `${styleSrcDir}/**/*.scss`;
  const cssMask = `${styleSrcDir}/**/*.css`;
  const otherMask = `${styleSrcDir}/**/*.{png,jpg,jpeg,gif,ico,webp,json,txt,svg,svgz,map,html,eot,ttf,woff,woff2}`;
  if (ignore) {
    ignore.split(',').filter(Boolean);
  } else {
    ignore = [];
  }
  const babelConfigFile = babelConfig
    ? path.resolve(rootDir, babelConfig)
    : path.resolve(rootDir, './babel.config.js');
  const postcssConfigFile = postcssConfig
    ? path.resolve(rootDir, postcssConfig)
    : path.resolve(rootDir, './postcss.config.js');
  const lessConfigFile = lessConfig
    ? path.resolve(rootDir, lessConfig)
    : path.resolve(rootDir, './less.config.js');
  const scssConfigFile = scssConfig
    ? path.resolve(rootDir, scssConfig)
    : path.resolve(rootDir, './scss.config.js');
  const aliasConfigFile = aliasConfig
    ? path.resolve(rootDir, aliasConfig)
    : path.resolve(rootDir, './alias.config.js');
  const esmConfigFile = esmConfig
    ? path.resolve(rootDir, esmConfig)
    : path.resolve(rootDir, './esm-project.config.js');


  return {
    ...restOptions,
    buildOptions,
    rootDir,
    distDir,
    srcDir,
    styleSrcDir,
    styleDistDir,
    jsMask,
    cssMask,
    scssMask,
    lessMask,
    otherMask,
    ignore,
    babelConfigFile,
    postcssConfigFile,
    lessConfigFile,
    scssConfigFile,
    aliasConfigFile,
    esmConfigFile,
    commandPrefx,
    disableComplieStyles,
    disableClean,
  };
}

module.exports = {
  parseOptions
};
