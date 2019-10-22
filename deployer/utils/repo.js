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
				try {
					let gitAccInfo = JSON.parse(process.env[ACC_ENV_NAME]);
					let gitRepoInfo = JSON.parse(process.env[REPO_ENV_NAME]);
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
					
				} catch (e) {
					log (e);
					throw new Error('Unable to parse the content of ' + ACC_ENV_NAME + ' or ' + REPO_ENV_NAME + ' ...');
				}
			} else {
				return cb('No repository detected', null);
			}
		} else {
			return cb('No git account detected', null);
		}
	}
};

module.exports = lib;