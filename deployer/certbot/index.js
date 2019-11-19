'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const fs = require('fs');
const path = require('path');
const log = require('util').log;
const spawn = require('child_process').spawn;

function datesEqual(a, b) {
	return !(a > b || b > a);
}

let certbot = {
	"reloadNginx": (cb) => {
		let commands = ['-s', 'reload'];
		const process = spawn('nginx', commands, {stdio: 'inherit'});
		
		process.on('data', (data) => {
			log(data.toString());
		});
		process.on('close', (code) => {
			log(`Nginx reload process exited with code: ${code}`);
			return cb(null);
		});
		process.on('error', (error) => {
			log(`Nginx reload process failed with error: ${error}`);
			return cb(null);
		});
	},
	"readDomains": (options, cb) => {
		let filePath = path.join(options.paths.nginx.cert, "domains");
		fs.readFile(filePath, 'utf8', (error, fileData) => {
			if (error) {
				log(`An error occurred while reading ${filePath} ...`);
				return cb(error, null);
			}
			return cb(null, fileData);
		});
	},
	"renew": (options, cb) => {
		certbot.readDomains(options, (error, sslDomainStr) => {
			if (!sslDomainStr) {
				log('Unable to find any domain. Skipping ...');
				return cb(null);
			}
			let firstDomain = sslDomainStr.split(",");
			fs.stat(options.paths.nginx.letsencrypt + "live/" + firstDomain[0] + "/privkey.pem", (error, stats) => {
				if (!error && stats) {
					certbot.install(options, cb);
				}
				else {
					log('Nothing to renew. Skipping ...');
					return cb(null);
				}
			});
		});
	},
	"install": (options, cb) => {
		if (process.env.SOAJS_SSL_CONFIG) {
			let configuration = null;
			try {
				configuration = JSON.parse(process.env.SOAJS_SSL_CONFIG);
			} catch (e) {
				log('Unable to parse the content of SOAJS_SSL_CONFIG ...');
				log(e);
				return cb(null);
			}
			
			certbot.readDomains(options, (error, sslDomainStr) => {
				if (!configuration.email) {
					log('Unable to find email in SOAJS_SSL_CONFIG. Skipping ...');
					return cb(null);
				}
				if (!sslDomainStr) {
					log('Unable to find any domain. Skipping ...');
					return cb(null);
				}
				
				let firstDomain = sslDomainStr.split(",");
				fs.stat(options.paths.nginx.letsencrypt + "live/" + firstDomain[0] + "/privkey.pem", (error, stats) => {
					log(`The list of domains to create certifications for is: ${sslDomainStr}`);
					let commands = ['certonly', '--webroot', '-w', '/opt/soajs/certificates/webroot/', '--config-dir', '/opt/soajs/letsencrypt', '-n', '--agree-tos', '-m', configuration.email, '--expand', '-d', sslDomainStr];
					
					if (options.dryrun) {
						commands.push('--dry-run');
					}
					
					const certbotProcess = spawn('certbot', commands, {stdio: 'inherit'});
					
					certbotProcess.on('data', (data) => {
						log(data.toString());
					});
					
					certbotProcess.on('close', (code) => {
						log(`Certbot install process exited with code: ${code}`);
						if (code === 0 && !(options.dryrun)) {
							fs.stat(options.paths.nginx.letsencrypt + "live/" + firstDomain[0] + "/privkey.pem", (newerror, newstats) => {
								if (!error && !newerror && newstats && stats) {
									if (!datesEqual(newstats.ctime, stats.ctime)) {
										log('Copying new certificate ....');
										fs.copyFileSync(options.paths.nginx.letsencrypt + "live/" + firstDomain[0] + "/privkey.pem", options.paths.nginx.cert + "privkey.pem");
										fs.copyFileSync(options.paths.nginx.letsencrypt + "live/" + firstDomain[0] + "/fullchain.pem", options.paths.nginx.cert + "fullchain.pem");
										certbot.reloadNginx (cb);
									} else {
										log('Keeping existing certificate .... nothing copy!');
									}
									return cb(null);
								} else {
									return cb(null);
								}
							});
						} else {
							return cb(null);
						}
					});
					certbotProcess.on('error', (error) => {
						log(`Certbot install process failed with error: ${error}`);
						return cb(null);
					});
				});
			});
		}
		else {
			return cb(null);
		}
	},
	"dryrun": (options, cb) => {
		options.dryrun = true;
		certbot.install(options, cb);
	}
};

module.exports = {
	renew: certbot.renew,
	install: certbot.install,
	dryrun: certbot.dryrun
};