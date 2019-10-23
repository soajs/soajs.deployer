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
const console = require('./lib/console.js');
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
		log(data.toString());
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
			options.sslDomain = [];
			cb(null, options);
		}];
		
		installFnArray.push((obj, cb) => {
			if (process.env.SOAJS_GATEWAY_CONFIG) {
				log('Fetching SOAJS Gateway configuration ...');
				gateway.conf(process.env.SOAJS_GATEWAY_CONFIG, (gatewayConf) => {
					obj.gatewayConf = gatewayConf;
					if (obj.gatewayConf && obj.gatewayConf.domain) {
						obj.sslDomain.push(obj.gatewayConf.domain);
					}
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
			if (obj.gatewayConf) {
				if (!process.env.SOAJS_ENV || ['dashboard'].indexOf(process.env.SOAJS_ENV.toLowerCase()) === -1) {
					return cb(null, obj);
				}
				
				log('Update SOAJS console UI with the right ext KEY ...');
				console.updateConfig({
					"location": obj.paths.nginx.site + "soajs.dashboard.ui/",
					"domainPrefix": obj.gatewayConf.domainPrefix,
					"extKey": process.env.SOAJS_EXTKEY
				}, (error, done) => {
					if (done) {
						log('SOAJS console UI updated successfully.');
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
			if (process.env.SOAJS_SSL_CONFIG) {
				let configuration = null;
				try {
					configuration = JSON.parse(process.env.SOAJS_SSL_CONFIG);
				} catch (e) {
					log('Unable to parse the content of SOAJS_SSL_CONFIG ...');
					log(e);
					return cb(null, obj);
				}
				let sslDomainStr = null;
				
				if (!options.sslDomain || !Array.isArray(options.sslDomain)) {
					options.sslDomain = [];
				}
				if (configuration && configuration.domains && Array.isArray(configuration.domains) && configuration.domains.length > 0) {
					sslDomainStr = configuration.domains.join(",");
				}
				if (options.sslDomain.length > 0) {
					if (sslDomainStr) {
						sslDomainStr += "," + options.sslDomain.join(",");
					}
					else {
						sslDomainStr = options.sslDomain.join(",");
					}
				}
				if (!configuration.email) {
					log('Unable to find email in SOAJS_SSL_CONFIG. Skipping ...');
					return cb(null, obj);
				}
				let commands = ['--nginx', '-n', '--agree-tos', '-m', configuration.email];
				if (sslDomainStr) {
					commands.concat (['-d', sslDomainStr]);
					log(`The list of domains to create certifications for is: ${sslDomainStr}`);
				}
				const certbot = spawn('certbot', commands, {stdio: 'inherit'});
				
				certbot.on('data', (data) => {
					log(data.toString());
				});
				
				certbot.on('close', (code) => {
					log(`SSL process exited with code: ${code}`);
					return cb(null, obj);
				});
				certbot.on('error', (error) => {
					log(`SSL process failed with error: ${error}`);
					return cb(error);
				});
			}
			else {
				return cb(null, obj);
			}
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