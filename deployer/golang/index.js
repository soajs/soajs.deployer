'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const log = require('util').log;
const path = require('path');
const spawn = require('child_process').spawn;

const utils = require('../utils');

let golang = {
	
	/**
	 * Function that checks for git environment variables and clones repository
	 * @param  {Object}   options An object that contains params passed to the function
	 *      paths
	 *      golang
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
		log('Looking for golang git repository ...');
		
		let cloneOptions = {
			"clonePath": options.paths.golang.path,
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
	 * Function that installs dependencies for a golang service
	 * @param  {Object}   options An object that contains params passed to the function
	 *      paths
	 *      golang
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
		log('Installing golang dependencies ...');
		
		if (options && options.git && options.git.repo) {
			
			let repoDirPath = path.join(options.paths.golang.path, options.git.repo);
			const get = spawn('go', ['get', '-v', './...'], {stdio: 'inherit', cwd: repoDirPath});
			
			get.on('data', (data) => {
				log(data.toString());
			});
			
			get.on('close', (code) => {
				if (code === 0) {
					log('go get install process exited with code: ' + code);
					return cb();
				} else {
					throw new Error('go get install failed, exit code: ' + code);
				}
			});
			
			get.on('error', (error) => {
				log('An error occurred while installing dependencies');
				throw new Error(error);
			});
		}
		else {
			log('Missing required git information, git repo: [' + options.git.repo + '], exiting ...');
			return cb();
		}
	},
	
	/**
	 * Function that runs a golang service
	 * @param  {Object}   options An object that contains params passed to the function
	 *      paths
	 *      golang
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
			
			let repoDirPath = path.join(options.paths.golang.path, options.git.repo);
			
			const go = spawn(options.git.repo, [], {stdio: 'inherit', cwd: repoDirPath});
			
			go.on('data', (data) => {
				log(data.toString());
			});
			
			go.on('close', (code) => {
				log('go process exited with code: ' + code);
				return cb();
			});
			
			go.on('error', (error) => {
				log('An error occurred while running service');
				throw new Error(error);
			});
		} else {
			log('Missing required git information, git repo: [' + options.git.repo + '], exiting ...');
			return cb();
		}
	}
	
};

module.exports = {
	deploy: golang.init,
	install: golang.installDeps,
	run: golang.run
};
