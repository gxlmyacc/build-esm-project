#!/usr/bin/env node

const program = require('commander');
const camelcase = require('camelcase');
const updateNotifier = require('update-notifier');

const execCommand = require('../utils/execCommand');

program
  .version('0.0.1');

const commandListMap = {
  start: 'start watch',
  build: 'build esm',
};


const pkg = require('../package.json');

// Checks for available update and returns an instance
const notifier = updateNotifier({
  pkg,
  shouldNotifyInNpmScript: true
});

// Notify using the built-in convenience method
notifier.notify();

// option 列表
const optionsList = [
  'babel-config',
  'postcss-config',
  'ignore-files',
  'root',
  'src',
  'out',
];

Object.keys(commandListMap).forEach(commandName => {
  program
    .command(commandName)
    .option('--root [path]', 'provide project root directory, default process.cwd()')
    .option('--babel-config', 'provide babel config file path, default is process.cwd()/babel.config.js')
    .option('--postcss-config', 'provide postcss config file path, default is process.cwd()/postcss.config.js')
    .option('--ignore', 'provide igonre transfrom files')
    .option('--src', 'source directory, default is src')
    .option('--out', 'output directory, default is esm')
    .description(commandListMap[commandName])
    .action(cmd => {
      process.env.options = JSON.stringify(optionsList.reduce((pre, cur) => {
        pre[camelcase(cur)] = cmd[cur];
        return pre;
      }, {}));
      execCommand(commandName);
    });
});

if (process.argv.slice(2).length === 0) {
  program.help();
} else {
  program.parse(process.argv);
}
