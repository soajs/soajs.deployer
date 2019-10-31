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
	 * Create the upstream configuration nfile
	 * @param options
	 *      {
	 *          location
	 *          ip
	 *          port
	 *          label
	 *      }
	 * @param cb
	 * @returns {*}
	 */
	"upstream": (options, cb) => {
		if (!options.location || !options.ip || !options.port || !options.label) {
			log('Cannot create upstream for SOAJS Gateway, missing configuration: location [' + options.location + '], ip[' + options.ip + '], port[' + options.port + '], and label[' + options.label + ']');
			return cb(false);
		}
		
		let location = path.normalize(options.location + '/' + options.label + '.conf');
		log("Writing upstream.conf @ " + location + " for label: " + options.label);
		let wstream = fs.createWriteStream(location);
		
		wstream.write("upstream " + options.label + " {\n");
		wstream.write("  server " + options.ip + ":" + options.port + ";\n");
		wstream.write("}\n");
		
		wstream.end();
		return cb(true);
	},
	
	/**
	 * Create api.conf configuration file
	 * @param options
	 *      {
	 *          domain
	 *          label
	 *          location
	 *          ssl
	 *      }
	 * @param cb
	 * @returns {*}
	 */
	"api": (options, cb) => {
		if (!options.location || !options.domain || !options.label) {
			log('Cannot create api.conf for SOAJS Gateway, missing configuration: location [' + options.location + '], domain[' + options.domain + '], and label[' + options.label + ']');
			return cb(false);
		}
		let location = path.normalize(options.location + '/' + options.label + '.conf');
		log("Writing  api conf @ " + location);
		let wstream = fs.createWriteStream(location);
		
		if (options.ssl) {
			wstream.write("server {\n");
			wstream.write("  listen               443 ssl;\n");
			wstream.write("  server_name          " + options.domain + ";\n");
			wstream.write("  client_max_body_size 100m;\n");
			wstream.write("  location / {\n");
			wstream.write("    proxy_pass 		    http://" + options.label + ";\n");
			wstream.write("    proxy_set_header   	X-Forwarded-Proto 	    $scheme;\n");
			wstream.write("    proxy_set_header   	X-Forwarded-For 	    $remote_addr;\n");
			wstream.write("    proxy_set_header   	Host             		$http_host;\n");
			wstream.write("    proxy_set_header   	X-NginX-Proxy     	    true;\n");
			wstream.write("    proxy_set_header   	Connection        	    \"\";\n");
			wstream.write("  }\n");
			wstream.write("  ssl_certificate     /opt/soajs/certificates/fullchain.pem;\n");
			wstream.write("  ssl_certificate_key /opt/soajs/certificates/privkey.pem;\n");
			wstream.write("  include             /etc/nginx/ssl.conf;\n");
			wstream.write("  ssl_dhparam         /opt/soajs/certificates/dhparam.pem;\n");
			wstream.write("}\n");
		}
		
		if (options.ssl && options.ssl.redirect) {
			wstream.write("server {\n");
			wstream.write("  listen               80;\n");
			wstream.write("  server_name          " + options.domain + ";\n");
			wstream.write("  client_max_body_size 100m;\n");
			wstream.write("  rewrite ^/(.*) https://" + options.domain + "/$1 permanent;\n");
			wstream.write("}\n");
		} else {
			wstream.write("server {\n");
			wstream.write("  listen               80;\n");
			wstream.write("  server_name          " + options.domain + ";\n");
			wstream.write("  client_max_body_size 100m;\n");
			wstream.write("  location / {\n");
			wstream.write("    proxy_pass 		    http://" + options.label + ";\n");
			wstream.write("    proxy_set_header   	X-Forwarded-Proto 	    $scheme;\n");
			wstream.write("    proxy_set_header   	X-Forwarded-For 	    $remote_addr;\n");
			wstream.write("    proxy_set_header   	Host             		$http_host;\n");
			wstream.write("    proxy_set_header   	X-NginX-Proxy     	    true;\n");
			wstream.write("    proxy_set_header   	Connection        	    \"\";\n");
			wstream.write("  }\n");
			wstream.write("}\n");
		}
		wstream.end();
		return cb(true);
	},
	
	"conf": (envString, cb) => {
		let configuration = null;
		if (envString) {
			try {
				configuration = JSON.parse(envString);
			} catch (e) {
				log('Unable to parse the content of SOAJS Gateway configuration ...');
				log(e);
				return cb(null);
			}
		}
		if (configuration && configuration.domain && configuration.port && configuration.ip) {
			return cb(configuration);
		}
		else {
			return cb(null);
		}
	}
};

module.exports = lib;