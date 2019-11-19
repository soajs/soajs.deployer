'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const log = require('util').log;

const lib = {
	"get": (ACC_ENV_NAME, REPO_ENV_NAME, cb) => {
		if (process.env[ACC_ENV_NAME]) {
			if (process.env[REPO_ENV_NAME]) {
				let gitAccInfo = null;
				let gitRepoInfo = null;
				try {
					gitAccInfo = JSON.parse(process.env[ACC_ENV_NAME]);
					gitRepoInfo = JSON.parse(process.env[REPO_ENV_NAME]);
				} catch (e) {
					log(e);
					throw new Error('Unable to parse the content of ' + ACC_ENV_NAME + ' or ' + REPO_ENV_NAME + ' ...');
				}
				if (!gitAccInfo || !gitRepoInfo) {
					throw new Error(ACC_ENV_NAME + ' or  ' + REPO_ENV_NAME + ' is empty ...');
				}
				let cloneOptions = {
					"git": {
						"token": gitAccInfo.token,
						"provider": gitAccInfo.provider,
						"owner": gitAccInfo.owner,
						"domain": gitAccInfo.domain,
						"repo": gitRepoInfo.repo,
						"branch": gitRepoInfo.branch,
						"commit": gitRepoInfo.commit
					}
				};
				return cb(null, cloneOptions);
			} else {
				return cb('No repository detected', null);
			}
		} else {
			return cb('No git account detected', null);
		}
	},
	
	"getREPO": (REPO_ENV_NAME) => {
		let cloneOptions = null;
		try {
			let gitRepoInfo = JSON.parse(process.env[REPO_ENV_NAME]);
			if (gitRepoInfo) {
				cloneOptions = {
					"git": {
						"repo": gitRepoInfo.repo,
						"branch": gitRepoInfo.branch,
						"commit": gitRepoInfo.commit
					}
				};
			}
		} catch (e) {
			log(e);
		}
		return cloneOptions;
	},
	"getREPO_OLDSTYLE": (REPO, BRANCH, COMMIT) => {
		let cloneOptions = null;
		if (process.env[REPO] && process.env[BRANCH] && process.env[COMMIT]) {
			cloneOptions = {
				"git": {
					"repo": process.env[REPO],
					"branch": process.env[BRANCH],
					"commit": process.env[COMMIT]
				}
			};
		}
		return cloneOptions;
	},
	"getACC": (ACC_ENV_NAME) => {
		let cloneOptions = null;
		try {
			let gitAccInfo = JSON.parse(process.env[ACC_ENV_NAME]);
			if (gitAccInfo) {
				cloneOptions = {
					"git": {
						"token": gitAccInfo.token,
						"provider": gitAccInfo.provider,
						"owner": gitAccInfo.owner,
						"domain": gitAccInfo.domain
					}
				};
			}
		} catch (e) {
			log(e);
		}
		return cloneOptions;
	},
	"getACC_OLDSTYLE": (TOKEN, PROVIDER, DOMAIN, OWNER) => {
		let cloneOptions = null;
		if (process.env[PROVIDER] && process.env[DOMAIN] && process.env[OWNER]) {
			cloneOptions = {
				"git": {
					"token": process.env.SOAJS_GIT_TOKEN || null,
					"provider": process.env.SOAJS_GIT_PROVIDER,
					"domain": process.env.SOAJS_GIT_DOMAIN,
					"owner": process.env.SOAJS_GIT_OWNER
				}
			};
		}
		return cloneOptions;
	},
	
	"_get": (ACC_ENV_NAME, REPO_ENV_NAME, OLD_STYLE_ENV, cb) => {
		let cloneOptions = null;
		
		if (process.env[ACC_ENV_NAME]) {
			let temp = lib.getACC();
			if (temp) {
				if (!cloneOptions) {
					cloneOptions = {"git": {}};
				}
				cloneOptions.git.token = temp.git.token;
				cloneOptions.git.provider = temp.git.provider;
				cloneOptions.git.domain = temp.git.domain;
				cloneOptions.git.owner = temp.git.owner;
			}
		} else {
			let temp = lib.getACC_OLDSTYLE(OLD_STYLE_ENV.TOKEN, OLD_STYLE_ENV.PROVIDER, OLD_STYLE_ENV.DOMAIN, OLD_STYLE_ENV.OWNER);
			if (temp) {
				if (!cloneOptions) {
					cloneOptions = {"git": {}};
				}
				cloneOptions.git.token = temp.git.token;
				cloneOptions.git.provider = temp.git.provider;
				cloneOptions.git.domain = temp.git.domain;
				cloneOptions.git.owner = temp.git.owner;
			}
		}
		if (process.env[REPO_ENV_NAME]) {
			let temp = lib.getREPO();
			if (temp) {
				if (!cloneOptions) {
					cloneOptions = {"git": {}};
				}
				cloneOptions.git.repo = temp.git.repo;
				cloneOptions.git.branch = temp.git.branch;
				cloneOptions.git.commit = temp.git.commit;
			}
		} else {
			let temp = lib.getREPO_OLDSTYLE(OLD_STYLE_ENV.REPO, OLD_STYLE_ENV.BRANCH, OLD_STYLE_ENV.COMMIT);
			if (temp) {
				if (!cloneOptions) {
					cloneOptions = {"git": {}};
				}
				cloneOptions.git.repo = temp.git.repo;
				cloneOptions.git.branch = temp.git.branch;
				cloneOptions.git.commit = temp.git.commit;
			}
		}
		//Check if repo and owner is there, this is enough to to tell that the needed data is here and good to proceed
		if (cloneOptions && cloneOptions.git && cloneOptions.git.repo && cloneOptions.git.owner) {
			return cb(null, cloneOptions);
		} else {
			return cb(null, null);
		}
	},
	
	"getConfigRepo": (cb) => {
		let ACC_ENV_NAME = "SOAJS_CONFIG_ACC_INFO";
		let REPO_ENV_NAME = "SOAJS_CONFIG_REPO_INFO";
		let OLD_STYLE_ENV = {
			"TOKEN": "SOAJS_CONFIG_REPO_TOKEN",
			"PROVIDER": "SOAJS_CONFIG_REPO_PROVIDER",
			"DOMAIN": "SOAJS_CONFIG_REPO_DOMAIN",
			"OWNER": "SOAJS_CONFIG_REPO_OWNER",
			"REPO": "SOAJS_CONFIG_REPO_NAME",
			"BRANCH": "SOAJS_CONFIG_REPO_BRANCH",
			"COMMIT": "SOAJS_CONFIG_REPO_COMMIT"
		};
		return lib._get(ACC_ENV_NAME, REPO_ENV_NAME, OLD_STYLE_ENV, cb);
	},
	"getRepo": (cb) => {
		let ACC_ENV_NAME = "SOAJS_GIT_ACC_INFO";
		let REPO_ENV_NAME = "SOAJS_GIT_REPO_INFO";
		let OLD_STYLE_ENV = {
			"TOKEN": "SOAJS_GIT_TOKEN",
			"PROVIDER": "SOAJS_GIT_PROVIDER",
			"DOMAIN": "SOAJS_GIT_DOMAIN",
			"OWNER": "SOAJS_GIT_OWNER",
			"REPO": "SOAJS_GIT_REPO",
			"BRANCH": "SOAJS_GIT_BRANCH",
			"COMMIT": "SOAJS_GIT_COMMIT"
		};
		return lib._get(ACC_ENV_NAME, REPO_ENV_NAME, OLD_STYLE_ENV, cb);
	}
};


module.exports = lib;