'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */


const log = require('util').log;
const fs = require('fs');
const path = require('path');

let lib = {
	
	/**
	 * Create api.conf configuration file
	 * @param options
	 *      {
	 *          domain
	 *          domains
	 *          root
	 *          location
	 *          ssl
	 *      }
	 * @param cb
	 * @returns {*}
	 */
	"write": (options) => {
		let oneDomain = null;
		if (options && options.domains && Array.isArray(options.domains)) {
			options.domain = options.domains.join(" ");
			oneDomain = options.domains[0];
		}
		if (!options.location || !options.domain || !options.root) {
			log('Cannot create site configuration, missing information: location [' + options.location + '], domain[' + options.domain + '], and root[' + options.root + ']');
			return (false);
		}
		if (!oneDomain) {
			oneDomain = options.domain;
		}
		log('Writing ' + options.domain + '.conf in ' + options.location);
		let wstream = fs.createWriteStream(path.normalize(options.location + '/' + oneDomain + '.conf'));
		
		wstream.write("server {\n");
		if (options.ssl) {
			wstream.write("  listen               443 ssl;\n");
			wstream.write("  server_name          " + options.domain + ";\n");
			wstream.write("  client_max_body_size 100m;\n");
			wstream.write("  index  index.html index.htm;\n");
			wstream.write("  location / {\n");
			wstream.write("    root  " + options.root + ";\n");
			wstream.write("    sendfile       off;\n");
			wstream.write("    try_files $uri $uri/ /index.html;\n");
			wstream.write("  }\n");
			wstream.write("  ssl_certificate     " + options.paths.nginx.cert + "fullchain.pem;\n");
			wstream.write("  ssl_certificate_key " + options.paths.nginx.cert + "privkey.pem;\n");
			wstream.write("  include             /etc/nginx/ssl.conf;\n");
			wstream.write("  ssl_dhparam         " + options.paths.nginx.cert + "dhparam.pem;\n");
			
			// to be able to renew the certificate
			if (options.ssl.redirect) {
				wstream.write("  location /.well-known/acme-challenge/ {\n");
				wstream.write("    root " + options.paths.nginx.cert + "webroot/;\n");
				wstream.write("  }\n");
			}
			
			wstream.write("}\n");
		}
		
		if (options.ssl && options.ssl.redirect) {
			wstream.write("server {\n");
			wstream.write("  listen               80;\n");
			wstream.write("  server_name          " + options.domain + ";\n");
			wstream.write("  client_max_body_size 100m;\n");
			wstream.write("  rewrite ^/(.*) https://" + oneDomain + "/$1 permanent;\n");
			wstream.write("}\n");
		} else {
			wstream.write("server {\n");
			wstream.write("  listen               80;\n");
			wstream.write("  server_name          " + options.domain + ";\n");
			wstream.write("  client_max_body_size 100m;\n");
			wstream.write("  index  index.html index.htm;\n");
			wstream.write("  location / {\n");
			wstream.write("    root  " + options.root + ";\n");
			wstream.write("    sendfile       off;\n");
			wstream.write("    try_files $uri $uri/ /index.html;\n");
			wstream.write("  }\n");
			
			// to be able to renew the certificate
			if (options.ssl) {
				wstream.write("  location /.well-known/acme-challenge/ {\n");
				wstream.write("    root " + options.paths.nginx.cert + "webroot/;\n");
				wstream.write("  }\n");
			}
			
			wstream.write("}\n");
		}
		wstream.end();
		return (true);
	},
	
	"process": (configuration, options, cb) => {
		let location = "/sites-enabled/";
		if (configuration && Array.isArray(configuration)) {
			for (let i = 0; i < configuration.length; i++) {
				if (configuration[i].domains && Array.isArray(configuration[i].domains)) {
					if (!configuration[i].folder) {
						configuration[i].folder = "/";
					}
					if (configuration[i] && configuration[i].repo) {
						configuration[i].folder = configuration[i].repo + "/" + configuration[i].folder;
					}
					configuration[i].folder = path.join(options.paths.nginx.site, configuration[i].folder);
					lib.write({
						"location": path.join(options.paths.nginx.conf, location),
						"root": configuration[i].folder,
						"domains": configuration[i].domains,
						"ssl": options.sslConfiguration,
						"paths": options.paths
					});
					options.sslDomain = options.sslDomain.concat(configuration[i].domain);
				}
			}
			return cb();
		} else {
			if (configuration && configuration.domain) {
				if (!configuration.folder) {
					configuration.folder = "/";
				}
				if (configuration && configuration.repo) {
					configuration.folder = configuration.repo + "/" + configuration.folder;
				}
				configuration.folder = path.join(options.paths.nginx.site, configuration.folder);
				lib.write({
					"location": path.join(options.paths.nginx.conf, location),
					"root": configuration.folder,
					"domain": configuration.domain,
					"ssl": options.sslConfiguration,
					"paths": options.paths
				});
				options.sslDomain.push(configuration.domain);
			}
			return cb();
		}
	}
};

module.exports = lib;