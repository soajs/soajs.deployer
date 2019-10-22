'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const log = require('util').log;
const spawn = require('child_process').spawn;
const utils = require('../utils');
const async = require("async");
const gateway = require('./lib/gateway.js');
const site = require('./lib/site.js');
const sites = require('./lib/sites.js');

/**
 * Function that runs nginx service and prints logs to stdout
 * @param  {Function} cb Callback Function
 *
 */
function startNginx(cb) {
	const nginx = spawn('service', ['nginx', 'start'], {stdio: 'inherit'});
	
	nginx.on('data', (data) => {
		console.log(data.toString());
	});
	
	nginx.on('close', (code) => {
		log(`Nginx process exited with code: ${code}`);
		return cb();
	});
	nginx.on('error', (error) => {
		log(`Nginx process failed with error: ${error}`);
		return cb(error);
	});
}

const exp = {
	
	"deploy": (options, cb) => {
		let installFnArray = [(cb) => {
			cb(null, options);
		}];
		installFnArray.push((obj, cb) => {
			if (obj.git) {
				let cloneOptions = {
					"clonePath": obj.paths.nginx.site,
					"accelerateClone": obj.accelerateClone,
					"git": obj.git,
				};
				utils.clone(cloneOptions, (error) => {
					cb(error, obj);
				});
			} else {
				log('Skipping site repo no git information found ...');
			}
		});
		installFnArray.push((obj, cb) => {
			let config = {
				"content": 'nginx',
				"type": 'sites'
			};
			sites.deploy(obj, config, (error) => {
				return cb(error, obj);
			});
		});
		async.waterfall(installFnArray, (err) => {
			if (err) {
				throw err;
			}
			return cb();
		});
	},
	"install": (options, cb) => {
		let installFnArray = [(cb) => {
			cb(null, options);
		}];
		
		installFnArray.push((obj, cb) => {
			if (process.env.SOAJS_GATEWAY_CONFIG) {
				log('Fetching SOAJS Gateway configuration ...');
				gateway.conf(process.env.SOAJS_GATEWAY_CONFIG, (gatewayConf) => {
					obj.gatewayConf = gatewayConf;
					return cb(null, obj);
				});
			} else {
				return cb(null, obj);
			}
		});
		installFnArray.push((obj, cb) => {
			if (obj.gatewayConf) {
				log('Creating SOAJS Gateway needed upstream ...');
				gateway.upstream({
					"location": obj.paths.nginx.conf + "/conf.d/",
					"ip": obj.gatewayConf.ip,
					"port": obj.gatewayConf.port,
					"label": obj.nginx.label
				}, (done) => {
					if (done) {
						log('Upstream created successfully.');
					}
					return cb(null, obj);
				});
			} else {
				return cb(null, obj);
			}
		});
		installFnArray.push((obj, cb) => {
			if (obj.gatewayConf) {
				log('Creating SOAJS Gateway needed api.conf ...');
				gateway.api({
					"location": obj.paths.nginx.conf + "/sites-enabled/",
					"domain": obj.gatewayConf.domain,
					"label": obj.nginx.label
				}, (done) => {
					if (done) {
						log('api.conf created successfully.');
					}
					return cb(null, obj);
				});
			} else {
				return cb(null, obj);
			}
		});
		installFnArray.push((obj, cb) => {
			if (process.env.SOAJS_SITE_CONFIG) {
				let configuration = null;
				try {
					configuration = JSON.parse(process.env.SOAJS_SITE_CONFIG);
				} catch (e) {
					log('Unable to parse the content of SOAJS_SITE_CONFIG ...');
					log(e);
					return cb(null, obj);
				}
				site.process(configuration, obj, () => {
					return cb(null, obj);
				});
			}
			else {
				return cb(null, obj);
			}
		});
		installFnArray.push((obj, cb) => {
			let config = {
				"content": 'nginx',
				"type": 'sites-enabled',
				"target": obj.paths.nginx.conf + "/sites-enabled/"
			};
			utils.import(options, config, (error) => {
				if (error) {
					throw new Error(error);
				}
				return cb(null, obj);
			});
		});
		installFnArray.push((obj, cb) => {
			let config = {
				"content": 'nginx',
				"type": 'nginx.conf',
				"target": obj.paths.nginx.conf
			};
			utils.import(options, config, (error) => {
				if (error) {
					throw new Error(error);
				}
				return cb(null, obj);
			});
		});
		installFnArray.push((obj, cb) => {
			let config = {
				"content": 'nginx',
				"type": 'sites'
			};
			sites.install(obj, config, (error) => {
				
				return cb(error, obj);
			});
		});
		installFnArray.push((obj, cb) => {
			// certbot
			
			return cb(null, obj);
		});
		async.waterfall(installFnArray, (err) => {
			if (err) {
				throw err;
			}
			return cb();
		});
	},
	"run": (options, cb) => {
		// Start nginx
		startNginx(cb);
	}
};

//module.exports = exp;
module.exports = {
	deploy: exp.deploy,
	install: exp.install,
	run: exp.run
};