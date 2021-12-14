'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const utils = require('./utils');
const path = require('path');
const log = console.log;
const config = require('./config.js');

const lib = {
	"deploy": (cb) => {
		log('Looking for configuration repository settings ...');
		utils.repo.getConfigRepo((error, repo) => {
			if (!repo) {
				log('Configuration repository not found');
				cb();
			}
			else {
				let cloneOptions = {
					"clonePath": config.paths.deployer.tmp,
					"accelerateClone": false,
					"git": repo.git
				};
				utils.clone(cloneOptions, (error, repoPath) => {
					if (error) {
						throw new Error(error);
					}
					
					cb(repoPath);
				});
			}
		});
	},
	"getConfig": (cb) => {
		log('Try to load custom configuration ...');
		utils.repo.getConfigRepo((error, repo) => {
			if (!repo) {
				log('Custom configuration not found');
				cb();
			}
			else {
				let customConfig = null;
				let repoPath = path.normalize(config.paths.deployer.tmp + repo.git.repo);
				try {
					if (repoPath) {
						customConfig = require(path.join(repoPath, 'config.json'));
					}
					cb(customConfig, repoPath);
				}
				catch (e) {
					log('Unable to load config.json from configuration repository ...');
					throw new Error(e);
				}
			}
		});
	}
};

module.exports = lib;
