# soajs.deployer
SOAJS deployer runs inside your docker image and helps you deploy from source code and run your application

### SOAJS deployer paths:
Path | Description
--- | -----
/opt/soajs/soajs.deployer | The location of soajs deployer inside the image |
/opt/soajs/soajs.deployer/deployer | The working directory |
/opt/soajs/tmp | the temp directory that deployer use while executing |

### Environment variables

#### Source code repository
These environment variables works for Nodejs and Golang

NOTE: if provider is equal to bitbucket then the domain can by bitbucket.org for SaaS or the domain for your enterprise bitbucket installation

ENV Variable | Description | Default | Example
--- | ----- | :---: | ---
SOAJS_GIT_ACC_INFO | A stringified JSON object | null | '{"token":null,"provider":"bitbucket","owner":"soajs","domain":"bitbucket.org"}'
SOAJS_GIT_REPO_INFO | A stringified JSON object | null | '{"repo":"soajs.deployer.example.config","branch":"master","commit":null}'

### Golang
The deployment path of golang source code is @[/go/src/REPO] where [REPO] is the value set @ SOAJS_GIT_REPO_INFO

### Nodejs
The deployment path of nodejs source code is @[/opt/soajs/node_modules/REPO] where [REPO] is the value set @ SOAJS_GIT_REPO_INFO

ENV Variable | Description | Default | Example
--- | ----- | :---: | ---
SOAJS_NODEJS_MEMORY | Controle nodejs max_old_space_size the number of megabytes allowed | null | 4096
SOAJS_SRV_MAIN | The main file for nodejs application | . | app.js

#### Configuration repository
SOAJS deployer allows you to add a configuration content from a git repository. This repository has a working example [https://github.com/soajs/soajs.deployer.example.config]

ENV Variable | Description | Default | Example
--- | ----- | :---: | ---
SOAJS_ENV | The environment where you are deploying | dev |
SOAJS_CONFIG_ACC_INFO | A stringified JSON object | null | '{"token":null,"provider":"github","owner":"soajs","domain":"github.com"}'
SOAJS_CONFIG_REPO_INFO | A stringified JSON object | null | '{"repo":"soajs.deployer.example.config","branch":"master","commit":null}'

#### NGINX
The configuration path of nginx is /etc/nginx/, if you have a custom location you can set the SOAJS_NX_LOC
Please note that there is no need to do any configuration regarding SSL, it is done automatically when you set SOAJS_SSL_CONFIG

ENV Variable | Description | Default | Example
--- | ----- | :---: | ---
SOAJS_GATEWAY_CONFIG | A stringified JSON object. domainPrefix only needed for dashboard env to update the console UI configuration with SOAJS_EXTKEY | null | '{"ip":"","port":"4000","domain:"api.mydomain.com","domainPrefix":"api"}'
SOAJS_SITES_CONFIG | A stringified JSON object | null | '["git":{"token":null,"provider":"bitbucket","owner":"soajs","domain":"bitbucket.org","repo":"soajs.deployer.example.config","branch":"master","commit":null},"conf":{"domains:["www.mydomain.com", "mydomain.com"],"folder":"/"}]'
SOAJS_SSL_CONFIG | A stringified JSON object. domains is an array of extra domains to create SSL certifications for | null | '{"email":"me@ddd.com","domains":["www.d1.com","www.d2.com"]}'
SOAJS_NX_LOC | Do not set this if you do not know what you are doing | /etc/nginx/ | 
SOAJS_EXTKEY | The tenant external key to use | null |

#### SOAJS
ENV Variable | Description | Default | Example
--- | ----- | :---: | ---
SOAJS_ENV | The environment where you are deploying | dev | dev
SOAJS_PROFILE_LOC | The profile location. this is needed when you deploy a soajs service | /opt/soajs/profiles/ |
SOAJS_REGISTRY_API | Where is the gateway of this env to fetch registry from. this is needed when you deploy a service behind SOAJS Gateway | BLANK | "192.168.5.1:5000"

### License
*Copyright SOAJS All Rights Reserved.*

Use of this source code is governed by an Apache license that can be found in the LICENSE file at the root of this repository.
