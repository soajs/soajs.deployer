'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */


const async = require("async");
const utils = require('../../utils');
const site = require('./site.js');
const log = require('util').log;
const path = require('path');

let lib = {
	"customDeploy": (options, config, cb) => {
		let env = ((process.env.SOAJS_ENV) ? process.env.SOAJS_ENV.toLowerCase() : 'dev');
		if (options && config && options.config && options.config.setup && options.config.setup[env] && options.config.setup[env][config.content]) {
			if (options.config.setup[env][config.content][config.type]) {
				let sites = options.config.setup[env][config.content][config.type];
				lib.sitesDeploy(options, config, sites, (error) => {
					cb(error);
				});
			} else {
				return cb(null);
			}
		} else {
			return cb(null);
		}
	},
	"sitesDeploy": (options, config, sites, cb) => {
		if (sites && Array.isArray(sites)) {
			let env = ((process.env.SOAJS_ENV) ? process.env.SOAJS_ENV.toLowerCase() : 'dev');
			async.each(sites, (oneSite, callback) => {
				if (!oneSite.git) {
					log(`Unable to find git entry in ${config.type} for ${config.content} ${env}, skipping ...`);
					return callback(null);
				}
				let cloneOptions = {
					"clonePath": options.paths.nginx.site,
					"accelerateClone": options.accelerateClone,
					"git": oneSite.git,
				};
				utils.clone(cloneOptions, (error) => {
					return callback(error, options);
				});
			}, (error) => {
				return cb(error);
			});
		} else {
			return cb(null);
		}
	},
	"customInstall": (options, config, cb) => {
		let env = ((process.env.SOAJS_ENV) ? process.env.SOAJS_ENV.toLowerCase() : 'dev');
		if (options && config && options.config && options.config.setup && options.config.setup[env] && options.config.setup[env][config.content]) {
			if (options.config.setup[env][config.content][config.type]) {
				let sites = options.config.setup[env][config.content][config.type];
				lib.sitesInstall(options, config, sites, (error) => {
					return cb(error);
				});
			} else {
				return cb(null);
			}
		} else {
			return cb(null);
		}
	},
	"sitesInstall": (options, config, sites, cb) => {
		let env = ((process.env.SOAJS_ENV) ? process.env.SOAJS_ENV.toLowerCase() : 'dev');
		if (sites && Array.isArray(sites)) {
			let location = "/sites-enabled/";
			async.each(sites, (oneSite, callback) => {
				if (!oneSite.conf) {
					log(`Unable to find conf entry in ${config.type} for ${config.content} ${env}, skipping ...`);
					return callback(null);
				}
				if (!oneSite.conf.folder) {
					oneSite.conf.folder = "/";
				}
				if (oneSite.git && oneSite.git.repo) {
					oneSite.conf.folder = oneSite.git.repo + "/" + oneSite.conf.folder;
				}
				oneSite.conf.folder = path.join(options.paths.nginx.site, oneSite.conf.folder);
				let siteConfig = {
					"location": path.join(options.paths.nginx.conf, location),
					"root": oneSite.conf.folder,
					"domains": oneSite.conf.domains,
					"ssl": options.sslConfiguration
				};
				if (oneSite.conf.domains) {
					options.sslDomain = options.sslDomain.concat(oneSite.conf.domains);
				}
				site.write(siteConfig);
				return callback(null);
			}, (error) => {
				return cb(error);
			});
		} else {
			return cb(null);
		}
	}
};


module.exports = lib;