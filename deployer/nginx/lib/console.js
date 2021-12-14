'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */


const log = console.log;
const fs = require('fs');

let lib = {
	
	"updateConfig": (options, cb) => {
		if (!options.extKey || options.extKey === '') {
			log('Unable to find SOAJS_EXTKEY environment variable skipping!');
			return cb(null, false);
		}
		if (!options.domainPrefix || options.domainPrefix === '') {
			log('Unable to find domainPrefix skipping!');
			return cb(null, false);
		}
		
		let customSettings = {
			api: options.domainPrefix,
			key: options.extKey
		};
		customSettings = "let customSettings = " + JSON.stringify(customSettings, null, 2) + ";";
		
		fs.writeFile(options.location + "settings.js", customSettings, {'encoding': 'utf8'}, (error) => {
			if (error) {
				log("Error:", error);
			}
			return cb(null, true);
		});
	}
};

module.exports = lib;
