const path = require('path');

function parseOptions(options = process.env.options || []) {
  const buildOptions = (!options || typeof options === 'string')
    ? JSON.parse(process.env.options || {})
    : options;

  const rootDir = buildOptions.root
    ? path.resolve(process.cwd(), buildOptions.root)
    : process.cwd();
  const srcDir = buildOptions.src ? buildOptions.src : './src';
  const distDir = buildOptions.out ? buildOptions.out : './esm';
  const jsMask = `${srcDir}/**/*.{js,jsx${buildOptions.typescript ? 'ts,tsx' : ''}}`;
  const lessMask = `${srcDir}/**/*.less`;
  const scssMask = `${srcDir}/**/*.scss`;
  const cssMask = `${srcDir}/**/*.css`;
  const otherMask = `${srcDir}/**/*.{png,jpg,gif,ico,json,svg,map}`;
  const ignore = buildOptions.ignore
    ? buildOptions.ignore.split(',').filter(Boolean)
    : [];
  const babelConfigFile = buildOptions.babelConfig
    ? path.resolve(rootDir, buildOptions.babelConfig)
    : path.resolve(rootDir, './babel.config.js');
  const postcssConfigFile = buildOptions.postcssConfig
    ? path.resolve(rootDir, buildOptions.postcssConfig)
    : path.resolve(rootDir, './postcss.config.js');
  const esmConfigFile = buildOptions.esmConfig
    ? path.resolve(rootDir, buildOptions.esmConfig)
    : path.resolve(rootDir, './esm-project.config.js');
  const commandPrefx = buildOptions.commandPrefx || '[build-esm-project]';
  const sourcemap = buildOptions.sourcemap;

  return {
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
    babelConfigFile,
    postcssConfigFile,
    esmConfigFile,
    commandPrefx,
    sourcemap
  };
}

module.exports = {
  parseOptions
};
