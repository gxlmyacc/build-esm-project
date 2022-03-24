#!/usr/bin/env node

const start = require('../src/start');
const execCommand = require('../src/index').execCommand;

start(execCommand);
