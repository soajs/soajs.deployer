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
	 *          root
	 *          location
	 *      }
	 * @param cb
	 * @returns {*}
	 */
	"write": (options) => {
		if (options && options.domains && Array.isArray(options.domains)) {
			options.domain = options.domains.join(" ");
		}
		if (!options.location || !options.domain || !options.root) {
			log('Cannot create site configuration, missing information: location [' + options.location + '], domain[' + options.domain + '], and root[' + options.root + ']');
			return (false);
		}
		log('Writing ' + options.domain + '.conf in ' + options.location);
		let wstream = fs.createWriteStream(path.normalize(options.location + '/' + options.domains[0] + '.conf'));
		
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
		wstream.write("}\n");
		
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
					if (options && options.git && options.git.repo) {
						configuration[i].folder = options.git.repo + "/" + configuration[i].folder;
					}
					configuration[i].folder = path.join(options.paths.nginx.site, configuration[i].folder);
					lib.write({
						"location": path.join(options.paths.nginx.conf, location),
						"root": configuration[i].folder,
						"domains": configuration[i].domains
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
				if (options && options.git && options.git.repo) {
					configuration.folder = options.git.repo + "/" + configuration.folder;
				}
				configuration.folder = path.join(options.paths.nginx.site, configuration.folder);
				lib.write({
					"location": path.join(options.paths.nginx.conf, location),
					"root": configuration.folder,
					"domain": configuration.domain,
					"git": options.git
				});
				options.sslDomain.push(configuration.domain);
			}
			return cb();
		}
	}
};

module.exports = lib;