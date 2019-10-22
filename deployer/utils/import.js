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
const async = require('async');
const log = require('util').log;
const handlebars = require("handlebars");

handlebars.registerHelper('for', function (from, to, incr, block) {
	let accum = '';
	
	for (let i = from; i < to; i += incr) {
		accum += block.fn(i);
	}
	
	return accum;
});

handlebars.registerHelper('inc', function (value) {
	return parseInt(value) + 1;
});

handlebars.registerHelper('concat', function (str1, str2) {
	return str1 + str2;
});

handlebars.registerHelper('equals', function (str1, str2) {
	return (str1 === str2);
});

handlebars.registerHelper('env', function (env) {
	return process.env[env];
});

handlebars.registerHelper('lessthan', function (index, length) {
	return (index < length);
});

const importer = {
	
	/**
	 * Function that fetches a config repository for any user defined custom files
	 * @param  {Object}   options An object that contains params passed to the function
	 *      content: type of the files being imported [nginx | logstash | etc...]
	 *      type: sub-type as defined in the config repo json file, depends on content
	 *      target: target directory where files should be written after being processed
	 * @param  {Function} cb      Callback function
	 *
	 */
	"get": (options, config, cb) => {
		let env = ((process.env.SOAJS_ENV) ? process.env.SOAJS_ENV.toLowerCase() : 'dev');
		if (options && config && options.config && options.config.setup && options.config.setup[env] && options.config.setup[env][config.content]) {
			
			log(`Fetching ${config.content} ${config.type} files ...`);
			config.import = {};
			
			if (options.config.setup[env][config.content][config.type] && options.config.setup[env][config.content][config.type].path) {
				config.import.path = path.join(options.configRepoPath, options.config.setup[env][config.content][config.type].path);
			}
			
			if (config.import.path) {
				log(JSON.stringify(options, null, 2));
				// check access to specified custom file/directory path
				fs.access(config.import.path, fs.constants.F_OK || fs.constants.R_OK || fs.constants.W_OK, (error) => {
					if (error) {
						log(`${config.content}/${config.type} detected but not reachable ...`);
						log(`Unable to get ${config.content}, make sure the path specified in the config.json file is correct and that the folder/file exists ...`);
						throw new Error(error);
					}
					
					// detect whether import path points to a file or directory
					fs.stat(config.import.path, (error, stats) => {
						if (error) {
							log(`${config.content}/${config.type} detected but not reachable ...`);
							log(`Unable to get ${config.content}, make sure the path specified in the config.json file is correct and that the folder/file exists ...`);
							throw new Error(error);
						}
						
						config.import.isDirectory = stats.isDirectory();
						config.import.files = [];
						
						// build a list that contains the file name or folder contents
						if (config.import.isDirectory) {
							// read directory contents and push them to files array
							config.import.path = path.join(config.import.path, '/');
							fs.readdir(config.import.path, (error, files) => {
								if (error) {
									log(`Unable to read the content of ${config.content}/${config.type} directory ${config.import.path}, aborting ...`);
									throw new Error(error);
								}
								
								// forward to read()
								config.import.files = files;
								return importer.read(options, config, cb);
							});
						} else {
							// set config.import.path to the directory that contains the file and push the filename to the files array
							config.import.files.push(path.basename(config.import.path));
							config.import.path = path.dirname(config.import.path);
							// forward to read()
							return importer.read(options, config, cb);
						}
					});
				});
			} else {
				log(`No files of type: ${config.content}/${config.type} detected, proceeding ...`);
				return cb();
			}
		} else {
			return cb();
		}
	},
	
	/**
	 * Function that reads custom files from a given directory and passes them to another function to be processed
	 * @param  {Object}   options An object that contains params passed to the function
	 * @param  {Function} cb      Callback function
	 *
	 */
	"read": (options, config, cb) => {
		log(`Reading ${config.content}/${config.type} file(s) ...`);
		
		// read the contents of all custom files and pass them to the 'process' function
		async.map(config.import.files, (oneFile, callback) => {
			let onePath = path.join(config.import.path, oneFile);
			
			fs.readFile(onePath, (error, fileData) => {
				if (error) {
					log(`An error occurred while reading ${onePath} ...`);
					return callback(error);
				}
				
				return callback(null, {name: oneFile, data: fileData});
			});
		}, (error, importData) => {
			if (error) {
				throw new Error(error);
			}
			// forward to process()
			config.import.data = {files: importData};
			return importer.process(options, config, cb);
		});
	},
	
	/**
	 * Function that processes the contents of custom files, searches for placeholders and replaces them if applicable
	 * @param  {Object}   options An object that contains params passed to the function
	 * @param  {Function} cb      Callback function
	 *
	 */
	"process": (options, config, cb) => {
		log(`Processing ${config.content}/${config.type} file(s) ...`);
		
		// before processing, filter out empty files if any
		async.filter(config.import.data.files, (oneFile, callback) => {
			return callback(null, oneFile.data);
		}, (error, validFiles) => {
			// render files using handlebars
			async.map(validFiles, (oneValidFile, callback) => {
				let fileData = oneValidFile.data.toString('utf8');
				let fileTmpl = handlebars.compile(fileData);
				let render = fileTmpl(process.env);
				
				return callback(null, {name: oneValidFile.name, data: render});
			}, (error, renderedFiles) => {
				// forward to write()
				config.import.data = {files: renderedFiles};
				return importer.write(options, config, cb);
			});
		});
	},
	
	/**
	 * Function that writes processed custom files to the target directory
	 * @param  {Object}   options An object that contains params passed to the function
	 * @param  {Function} cb      Callback function
	 *
	 */
	"write": (options, config, cb) => {
		log(`Writing ${config.content}/${config.type} file(s) ...`);
		
		async.each(config.import.data.files, (oneFile, callback) => {
			let filePath = path.join(config.target, oneFile.name);
			fs.writeFile(filePath, oneFile.data, (error) => {
				if (error) {
					log(`An error occured while writing ${filePath}, skipping file ...`);
					return callback(error);
				}
				
				return callback();
			});
		}, (error) => {
			if (error) {
				throw new Error(error);
			}
			
			log(`${config.content}/${config.type} files were loaded successfully, DONE`);
			return cb();
		});
	}
	
};

module.exports = {
	import: importer.get
};
