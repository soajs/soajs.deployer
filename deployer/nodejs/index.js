'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const log = console.log;
const path = require('path');
const spawn = require('child_process').spawn;

const utils = require('../utils');

let nodejs = {
	
	/**
	 * Function that checks for git environment variables and clones repository
	 * @param  {Object}   options An object that contains params passed to the function
	 *      paths
	 *      nodejs
	 *      accelerateClone
	 *      git { {object} - (the git information)
	 *              token
	 *              provider
	 *              owner
	 *              domain
	 *              repo
	 *              branch (this can also be tag)
	 *              commit
	 *      }
	 *
	 *
	 * @param  {Function} cb      Callback function
	 *
	 */
	init(options, cb) {
		log('Looking for nodejs git repository ...');
		
		let cloneOptions = {
			"clonePath": options.paths.nodejs.path,
			"accelerateClone": options.accelerateClone,
			"git": options.git,
		};
		
		utils.clone(cloneOptions, (error, repoPath) => {
			if (error) {
				throw new Error(error);
			}
			
			cb(repoPath);
		});
	},
	
	
	/**
	 * Function that installs dependencies for a nodejs service
	 * @param  {Object}   options An object that contains params passed to the function
	 *      paths
	 *      nodejs
	 *      git { {object} - (the git information)
	 *              token
	 *              provider
	 *              owner
	 *              domain
	 *              repo
	 *              branch (this can also be tag)
	 *              commit
	 *      }
	 *
	 * @param  {Function} cb      Callback function
	 *
	 */
	installDeps(options, cb) {
		log('Installing nodejs dependencies ...');
		
		if (options && options.git && options.git.repo) {
			if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
				log('WARNING: Environment variable NODE_ENV is not set to "production". This is not recommended in production environments!');
			}
			let repoDirPath = path.join(options.paths.nodejs.path, options.git.repo);
			
			const npm = spawn('npm', ['install'], {stdio: 'inherit', cwd: repoDirPath});
			
			npm.on('data', (data) => {
				log(data.toString());
			});
			npm.on('close', (code) => {
				if (code === 0) {
					log('npm install process exited with code: ' + code);
					return cb();
				}
				else {
					throw new Error('npm install failed, exit code: ' + code);
				}
			});
			
			npm.on('error', (error) => {
				log('An error occured while installing dependencies');
				throw new Error(error);
			});
		} else {
			log('Missing required git information, git repo: [' + options.git.repo + '], exiting ...');
			return cb();
		}
	},
	
	/**
	 * Function that runs a nodejs service
	 * @param  {Object}   options An object that contains params passed to the function
	 *      paths
	 *      nodejs
	 *      git { {object} - (the git information)
	 *              token
	 *              provider
	 *              owner
	 *              domain
	 *              repo
	 *              branch (this can also be tag)
	 *              commit
	 *      }
	 *
	 * @param  {Function} cb      Callback function
	 *
	 */
	run(options, cb) {
		log('Running service ...');
		
		
		if (options && options.git && options.git.repo) {
			if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
				log('WARNING: Environment variable NODE_ENV is not set to "production". This is not recommended in production environments!');
			}
			let repoDirPath = path.join(options.paths.nodejs.path, options.git.repo);
			
			let serviceRun = options.nodejs.main;
			
			let nodeParams = null;
			if (options.nodejs.memory) {
				nodeParams = '--max_old_space_size=';
			}
			let runParams = [];
			if (nodeParams) {
				runParams.push(nodeParams);
			}
			runParams.push(serviceRun);
			
			log('About to run node with:');
			log(runParams);
			log('at: ' + repoDirPath);
			
			const node = spawn('node', runParams, {
				stdio: 'inherit',
				cwd: repoDirPath
			});
			
			node.on('data', (data) => {
				log(data.toString());
			});
			
			node.on('close', (code) => {
				log(`node process exited with code: ${code}`);
				return cb();
			});
			
			node.on('error', (error) => {
				log('An error occured while installing dependencies');
				throw new Error(error);
			});
		} else {
			log('Missing required git information, git repo: [' + options.git.repo + '], exiting ...');
			return cb();
		}
	}
	
};

module.exports = {
	deploy: nodejs.init,
	install: nodejs.installDeps,
	run: nodejs.run
};
