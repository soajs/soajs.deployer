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
		"types": ['nginx', 'nodejs', 'golang'],
		"steps": ['deploy', 'install', 'run']
	},
	
	"paths": {
		"deployer": {
			"src": "/opt/soajs/deployer/",
			"tmp": "/opt/soajs/tmp/"
		},
		"golang": {
			"path": '/go/src/'
		},
		"nodejs": {
			"path": '/opt/soajs/node_modules/'
		},
		"nginx": {
			"site": '/opt/soajs/site/',
			"conf": process.env.SOAJS_NX_LOC || '/etc/nginx/'
		}
	},
	
	"nodejs": {
		"memory": process.env.SOAJS_NODEJS_MEMORY,
		"main": process.env.SOAJS_SRV_MAIN || '.'
	},
	"golang": {},
	
	"nginx": {
		"label": "soajsgateway"
	}
};

module.exports = config;
