const spawn = require('cross-spawn');

function execCommand(name, options = {}) {
  process.env.options = JSON.stringify(options);

  const result = spawn.sync(
    'node',
    [].concat(require.resolve('./scripts/' + name)),
    { stdio: 'inherit' }
  );
  if (result.signal) {
    if (result.signal === 'SIGKILL') {
      console.log(
        'The build failed because the process exited too early. '
          + 'This probably means the system ran out of memory or someone called '
          + '`kill -9` on the process.'
      );
    } else if (result.signal === 'SIGTERM') {
      console.log(
        'The build failed because the process exited too early. '
          + 'Someone might have called `kill` or `killall`, or the system could '
          + 'be shutting down.'
      );
    }
    process.exit(1);
  }
  process.exit(result.status);
}

/**
 * @typedef {{
 *   cleanEsm?: () => void|false,
 *   buildJs?: (babelConfig: { presets?: Record<string, any>, plugins?: Record<string, any> }, done: (result) => void, file: any) => void|false,
 *   buildLess?: (lessConfig: Record<string, any>, done: (result) => void, file: any) => void|false,
 *   buildScss?: (scssConfig: Record<string, any>, done: (result) => void, file: any) => void|false,
 *   buildPostcss?: (postcssPlugins: Record<string, function>) => void|false,
 *   buildOthers?: (othersConfig: Record<string, any>, done: (result) => void, file: any) => void|false
 * }} EsmConfig
 */

/**
 * @typedef {(...buildConfigs: EsmConfig[]) => { [key: string]: function[] } } MergeEsmConfig
 */

/** @type {MergeEsmConfig} */
const mergeEsmConfig = function (...buildConfigs) {
  const result = {};
  if (!buildConfigs.length) return result;

  const keysMap = {};
  buildConfigs.forEach(buildConfig => {
    if (!buildConfig) return;
    Object.keys(buildConfig).forEach(key => keysMap[key] = true);
  });
  Object.keys(keysMap).forEach(key => {
    if (!result[key]) result[key] = [];
    buildConfigs.forEach(buildConfig => {
      if (!buildConfig) return;
      if (Array.isArray(buildConfig[key])) Array.prototype.push.apply(result[key], buildConfig[key]);
      else result[key].push(buildConfig[key]);
    });
  });
  return result;
};

module.exports = {
  execCommand,
  mergeEsmConfig
};
