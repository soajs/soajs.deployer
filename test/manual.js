'use strict';
/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const { Command } = require('commander');
const version = require('../package.json').version;

const program = new Command();

program
    .version(version)
    .option('-T, --type <type>', '(required): Deployment type')
    .option('-S, --step <step>', '(required): Deployment step')
    .parse(process.argv);


const programOptions = program.opts();

console.log("========= programOptions.type");
console.log(programOptions.type);
console.log("========= programOptions.step");
console.log(programOptions.step);

