'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const config = {
	
	"deploy": {
		"types": ['nginx', 'nodejs', 'golang', 'certbot'],
		"steps": {
			'nginx': ['deploy', 'install', 'run', 'certinstall', 'certrenew', 'certdryrun'],
			'nodejs': ['deploy', 'install', 'run'],
			'golang': ['deploy', 'install', 'run']
		}
	},
	
	"paths": {
		"deployer": {
			"src": "/opt/soajs/soajs.deployer/deployer/",
			"tmp": "/opt/soajs/tmp/"
		},
		"golang": {
			"path": '/go/src/'
		},
		"nodejs": {
			"path": '/opt/soajs/node_modules/'
		},
		"nginx": {
			"consoleRepo": "soajs.dashboard.ui",
			"site": '/opt/soajs/site/',
			"conf": process.env.SOAJS_NX_LOC || '/etc/nginx/',
			"cert": '/opt/soajs/certificates/',
			"letsencrypt": "/opt/soajs/certificates/letsencrypt/"
		}
	},
	
	"nodejs": {
		"memory": process.env.SOAJS_SRV_MEMORY,
		"main": process.env.SOAJS_SRV_MAIN || '.'
	},
	"golang": {},
	
	"nginx": {
		"label": "soajsgateway"
	}
};

module.exports = config;
