'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const spawn = require('child_process').spawn;
const log = console.log;
const rimraf = require('rimraf');
const path = require("path");
const fs = require('fs');

const cloner = {
	
	/**
	 * Function that clones a git repositroy
	 * @param  {Object}   options An object that contains params passed to the function
	 *      accelerateClone {boolean} - (accelerate clone by setting the --depth to 1)
	 *      clonePath {string} - (the path of the folder where to clone)
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
	 *
	 * @param  {Function} cb      Callback function
	 *
	 */
	clone(options, cb) {
		if (!options.git) {
			log('Repository git information are missing, skipping ...');
			return cb();
		}
		if (options.git.provider !== 'github' && options.git.provider !== 'bitbucket') {
			log('Only github & bitbucket are supported for now, skipping ...');
			return cb();
		}
		
		if (!options.git.owner || !options.git.repo || !options.git.domain || !options.git.branch) {
			log('Repository information are missing, skipping ...');
			return cb();
		}
		if (!options.clonePath) {
			throw new Error(`ERROR: No clone path specified, you need to specify where to download the contents of the repository!`);
		}
		
		let cloneUrl = '';
		if (options.git.token) {
			log('Cloning from ' + options.git.provider + ' private repository ...');
			
			if (options.git.provider === 'github') {
				cloneUrl = `https://${options.git.token}@${options.git.domain}/${options.git.owner}/${options.git.repo}.git`;
			}
			else if (options.git.provider === 'bitbucket') {
				if (options.git.domain === 'bitbucket.org') {
					cloneUrl = `https://x-token-auth:${options.git.token}@${options.git.domain}/${options.git.owner}/${options.git.repo}.git`;
				} else {
					cloneUrl = `https://${options.git.token}@${options.git.domain}/scm/${options.git.owner}/${options.git.repo}.git`;
				}
			}
		}
		else {
			log('Cloning from ' + options.git.provider + ' public repository ...');
			cloneUrl = `https://${options.git.domain}/${options.git.owner}/${options.git.repo}.git`;
		}
		
		let fnContinue = (repoPath) => {
			log(`Cloning ${options.git.owner}/${options.git.repo} from ${options.git.branch} branch, in progress ...`);
			
			let gitCommands = ['clone', '--progress', '--branch', options.git.branch];
			if (options.accelerateClone) {
				gitCommands = gitCommands.concat(['--depth', '1']);
			}
			gitCommands = gitCommands.concat([cloneUrl, repoPath]);
			
			const clone = spawn('git', gitCommands, {stdio: 'inherit'});
			
			clone.on('error', (error) => {
				log(`Clone process failed with error: ${error}`);
				throw new Error(error);
			});
			clone.on('data', (data) => {
				log(data.toString());
			});
			clone.on('close', (code) => {
				if (code === 0) {
					log(`Cloning repository ${options.git.owner}/${options.git.repo} was successful, exit code: ${code}`);
					
					if (!options.accelerateClone && options.git.commit && options.git.commit !== '') {
						log(`Detected custom commit provided, switching head to commit ${options.git.commit}`);
						let commit = spawn("git", ['reset', '--hard', options.git.commit], {
							stdio: 'inherit',
							cwd: repoPath
						});
						commit.on('error', (error) => {
							log(`Switching HEAD to commit ${options.git.commit} Failed`);
							log(error);
						});
						commit.on('data', (data) => {
							log(data.toString());
						});
						commit.on('close', function (code) {
							if (code === 0) {
								log(`Repository HEAD switched to commit ${options.git.commit}`);
								return cb(null, repoPath);
							}
							else {
								log(`ERROR: Switch HEAD to commit exited with code: ${code}, check clone logs`);
								return cb(null, repoPath);
							}
						});
					}
					else {
						return cb(null, repoPath);
					}
				}
				else {
					throw new Error(`ERROR: Clone exited with code: ${code}, check clone logs`);
				}
			});
		};
		
		let repoPath = path.normalize(options.clonePath + options.git.repo);
		if (fs.existsSync(repoPath)) {
			rimraf(repoPath, (error) => {
				if (error) {
					throw new Error(error);
				}
				fnContinue(repoPath);
			});
		} else {
			fnContinue(repoPath);
		}
	}
};

module.exports = {
	clone: cloner.clone
};
