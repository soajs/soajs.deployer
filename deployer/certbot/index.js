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


let certbot = {
	
	"readDomains": (options, cb) => {
		let filePath = path.join(options.paths.nginx.cert, "domains");
		fs.readFile(filePath, (error, fileData) => {
			if (error) {
				log(`An error occurred while reading ${filePath} ...`);
				return cb(error, null);
			}
			return cb(null, fileData);
		});
	},
	
	"renew": (options, cb) => {
		let commands = ['renew'];
		
		const certbotProcess = spawn('certbot', commands, {stdio: 'inherit'});
		
		certbotProcess.on('data', (data) => {
			log(data.toString());
		});
		
		certbotProcess.on('close', (code) => {
			log(`Certbot renew process exited with code: ${code}`);
			return cb(null);
		});
		certbotProcess.on('error', (error) => {
			log(`Certbot renew process failed with error: ${error}`);
			return cb(null);
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
				return cb(null, options);
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
				
				log(`The list of domains to create certifications for is: ${sslDomainStr}`);
				let commands = ['certonly', '--nginx', '--config-dir', '/opt/soajs/letsencrypt', '-n', '--agree-tos', '-m', configuration.email, '--expand', '-d', sslDomainStr];
				if (configuration.redirect) {
					commands.push("--redirect");
				}
				
				const certbotProcess = spawn('certbot', commands, {stdio: 'inherit'});
				
				certbotProcess.on('data', (data) => {
					log(data.toString());
				});
				
				certbotProcess.on('close', (code) => {
					log(`Certbot install process exited with code: ${code}`);
					return cb(null);
				});
				certbotProcess.on('error', (error) => {
					log(`Certbot install process failed with error: ${error}`);
					return cb(null);
				});
			});
		}
		else {
			return cb(null);
		}
	},
	"dryrun": (options, cb) => {
		
		return cb(null);
	}
};

module.exports = {
	renew: certbot.renew,
	install: certbot.install,
	dryrun: certbot.dryrun
};