'use strict';
/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const { Command } = require('commander');

const program = new Command();
const log = console.log;

const config = require('./config.js');
const utils = require('./utils');
const version = require('../package.json').version;
const customConfig = require('./customConfig.js');

program
	.version(version)
	.option('-T, --type <type>', '(required): Deployment type')
	.option('-S, --step <step>', '(required): Deployment step')
	.parse(process.argv);

const programOptions = program.opts();

if (config.deploy.types.indexOf(programOptions.type) === -1) {
	log(`SOAJS deployer is not compatible with the provided type ${programOptions.type}`);
	log(`Please choose one of ${config.deploy.types.join(', ')}. Exiting ...`);
	process.exit();
}
if (process.env.SOAJS_DEPLOYER_TYPE) {
	if (programOptions.type !== process.env.SOAJS_DEPLOYER_TYPE) {
		log(`SOAJS deployer is restricted only to this type ${process.env.SOAJS_DEPLOYER_TYPE}`);
		process.exit();
	}
}
if (programOptions.step) {
	if (config.deploy.steps[programOptions.type].indexOf(programOptions.step) === -1) {
		log(`SOAJS deployer is not compatible with the provided step ${programOptions.step}`);
		log(`Please choose one of ${config.deploy.steps[programOptions.type].join(', ')}. Exiting ...`);
		process.exit();
	}
}

log('Starting SOAJS Deployer v' + version);

function exitCb() {
	log('Done, exiting ...');
}

function execute(options) {
	switch (programOptions.type) {

		case 'golang':
			deployGolang(options);
			break;

		case 'nginx':
			deployNginx(options);
			break;

		case 'nodejs':
			deployNodejs(options);
			break;
	}

	/**
	 * At this point options has the following
	 * @param options
	 *      step      // the specified step
	 *      paths     // the path of the configuration repository
	 *      config    // config.json content from the configuration repository
	 *
	 */

	function deployGolang(options) {
		utils.repo.getRepo((error, repo) => {
			if (error) {
				log(programOptions.type + ": git error - " + error);
				exitCb();
			}
			else if (repo) {
				options.golang = config.golang;
				options.accelerateClone = false;
				options.git = repo.git;
				const golang = require('./golang');

				if (options.step === 'deploy') {
					golang.deploy(options, exitCb);
				}
				if (options.step === 'install') {
					golang.install(options, exitCb);
				}
				if (options.step === 'run') {
					golang.run(options, exitCb);
				}
			} else {
				log(programOptions.type + ": unable to get repository git information!");
				exitCb();
			}
		});
	}

	function deployNodejs(options) {
		utils.repo.getRepo((error, repo) => {
			if (error) {
				log(programOptions.type + ": git error - " + error);
				exitCb();
			}
			else if (repo) {
				options.nodejs = config.nodejs;
				options.accelerateClone = false;
				options.git = repo.git;
				const nodejs = require('./nodejs');
				if (options.step === 'deploy') {
					nodejs.deploy(options, exitCb);
				}
				if (options.step === 'install') {
					nodejs.install(options, exitCb);
				}
				if (options.step === 'run') {
					nodejs.run(options, exitCb);
				}
			} else {
				log(programOptions.type + ": unable to get repository git information!");
				exitCb();
			}
		});
	}

	function deployNginx(options) {
		options.nginx = config.nginx;
		options.accelerateClone = false;
		const nginx = require('./nginx');
		const certbot = require('./certbot');
		if (options.step === 'deploy') {
			nginx.deploy(options, exitCb);
		}
		if (options.step === 'install') {
			nginx.install(options, exitCb);
		}
		if (options.step === 'run') {
			nginx.run(options, exitCb);
		}
		if (options.step === 'certrenew') {
			certbot.renew(options, exitCb);
		}
		if (options.step === 'certinstall') {
			certbot.install(options, exitCb);
		}
		if (options.step === 'certdryrun') {
			certbot.dryrun(options, exitCb);
		}
	}
}

function deploy() {
	log(`Deploying a new ${programOptions.type} instance ...`);
	let options = { "paths": config.paths };
	options.step = programOptions.step;
	if (options.step === 'deploy') {
		customConfig.deploy(() => {
			customConfig.getConfig((config, repoPath) => {
				options.config = config;
				options.configRepoPath = repoPath;
				execute(options);
			});
		});
	}
	else {
		customConfig.getConfig((config, repoPath) => {
			options.config = config;
			options.configRepoPath = repoPath;
			execute(options);
		});
	}
}

deploy();
