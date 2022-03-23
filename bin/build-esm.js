#!/usr/bin/env node

const program = require('commander');
const updateNotifier = require('update-notifier');

const execCommand = require('../src/index');

const pkg = require('../package.json');

program
  .version(pkg.version);

// Checks for available update and returns an instance
const notifier = updateNotifier({
  pkg,
  shouldNotifyInNpmScript: true
});

// Notify using the built-in convenience method
notifier.notify();

const commandListMap = {
  start: 'start watch',
  build: 'build esm',
};

Object.keys(commandListMap).forEach(commandName => {
  program
    .command(commandName)
    .option('--root <path>', 'provide project root directory, default process.cwd()')
    .option('--build-config <path>', 'provide build esm config file path, default is process.cwd()/build-esm.config.js')
    .option('--babel-config <path>', 'provide babel config file path, default is process.cwd()/babel.config.js')
    .option('--postcss-config <path>', 'provide postcss config file path, default is process.cwd()/postcss.config.js')
    .option('--ignore <path>', 'provide igonre transfrom files')
    .option('--src <path>', 'source directory, default is src')
    .option('--out <path>', 'output directory, default is esm')
    .option('-ts, --typescript, ', 'is typescript project')
    .description(commandListMap[commandName])
    .action(options => {
      process.env.options = JSON.stringify(options);
      execCommand(commandName);
    });
});

if (process.argv.slice(2).length === 0) {
  program.help();
} else {
  program.parse(process.argv);
}
