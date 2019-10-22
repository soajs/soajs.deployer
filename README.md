# soajs.deployer

soajs deployer runs inside your docker image and helps you deploy from source code and run your application

### SOAJS deployer paths:

Path | Description
--- | -----
/opt/soajs/soajs.deployer | The location of soajs deployer inside the image |
/opt/soajs/soajs.deployer/deployer | The working directory |
/opt/soajs/tmp | the temp directory that deployer use while executing |

### Environment variables

SOAJS deployer allows you to add a configuration content from a git repository. This repository has a working example [https://github.com/soajs/soajs.deployer.example.config]
#### Configuration repository
ENV Variable | Description | Default | Example
--- | ----- | :---: | ---
SOAJS_CONFIG_ACC_INFO | A stringified JSON object | null | '{"token":null,"provider":"github","owner":"soajs","domain":"github.com"}'
SOAJS_CONFIG_REPO_INFO | A stringified JSON object | null | '{"repo":"soajs.deployer.example.config","branch":"master","commit":null}'

#### Source code repository
ENV Variable | Description | Default | Example
--- | ----- | :---: | ---
SOAJS_GIT_ACC_INFO | A stringified JSON object | null | '{"token":null,"provider":"bitbucket","owner":"soajs","domain":"bitbucket.org"}'
SOAJS_GIT_REPO_INFO | A stringified JSON object | null | '{"repo":"soajs.deployer.example.config","branch":"master","commit":null}'
NOTE: if provider is equal to bitbucket then the domain can by bitbucket.org for SaaS or the domain for your enterprise bitbucket installation

### Golang
The deployment path of golang source code is @[/go/src/REPO] where [REPO] is the value set @ SOAJS_GIT_REPO_INFO

### Nodejs
The deployment path of nodejs source code is @[/opt/soajs/node_modules/REPO] where [REPO] is the value set @ SOAJS_GIT_REPO_INFO

ENV Variable | Description | Default | Example
--- | ----- | :---: | ---
SOAJS_NODEJS_MEMORY | Controle nodejs max_old_space_size the number of megabytes allowed | null | 4096
SOAJS_SRV_MAIN | The main file for nodejs application | [.] | app.js

#### NGINX
ENV Variable | Description | Default | Example
--- | ----- | :---: | ---
SOAJS_GATEWAY_CONFIG | A stringified JSON object | null | '{"ip":"","port":"4000","domain:"api.mydomain.com"}'
SOAJS_SITE_CONFIG | A stringified JSON object | null | '{"domain:"www.mydomain.com","folder":"/"}' or '[{"domain:"www.mydomain.com","folder":"/www"},{"domain:"sub.mydomain.com","folder":"/sub"}]'





#### NGINX
ENV Variable | Description | Default | Example
--- | ----- | :---: | ---
SOAJS_NX_SITE_DOMAIN | This is the domain for site |  |
SOAJS_NX_SITE_PATH | This is the path where to deploy the static content | [/opt/soajs/site] |
SOAJS_NX_SITE_HTTPS | This is to turn on or off HTTPS: [0 - 1] | [0] |
SOAJS_NX_SITE_HTTP_REDIRECT | This is to redirect HTTP to HTTPS: [0 - 1] | [0] |
SOAJS_NX_DOMAIN | This is the master domain | [soajs.org] |
SOAJS_NX_CUSTOM_SSL | This is to specify user-provided certificates: [0 - 1]| [0] |
SOAJS_NX_SSL_CERTS_LOCATION | This is to specify the location of user-provided certificates | [/etc/soajs/ssl] |
SOAJS_NX_OS | The OS. Default [ubuntu] |  |
SOAJS_NX_SSL_SECRET | This is to specify the name of user-provided kubernetes secret that contains certificates | |

#### NGINX for SOAJS gateway
ENV Variable | Description | Default | Example
--- | ----- | :---: | ---
SOAJS_NX_API_DOMAIN | This is the domain for API | [api.soajs.org] |
SOAJS_NX_API_HTTPS | This is to turn on or off HTTPS: [0 - 1] | [0] |
SOAJS_NX_API_HTTP_REDIRECT | This is to redirect HTTP to HTTPS: [0 - 1] | [0] |
SOAJS_NX_CONTROLLER_NB | This is a integer | [1] |
SOAJS_NX_CONTROLLER_IP_N | This is the IP for every controller |  | SOAJS_NX_CONTROLLER_IP_1

#### MONGO for SOAJS profile
ENV Variable | Description | Default | Example
--- | ----- | :---: | ---
SOAJS_MONGO_RSNAME | This is the name of mongo replica | [rs_soajs] |
SOAJS_MONGO_NB | This is the number of Mongo instance(s) | [1]
SOAJS_MONGO_IP_N | This is the IP for every Mongo instance(s) |  | SOAJS_MONGO_IP_1
SOAJS_MONGO_PORT_N | This is the port for evert Mongo instance(s) | [27017] | SOAJS_MONGO_PORT_1
SOAJS_MONGO_USERNAME | This is the username for credentials |  |
SOAJS_MONGO_PASSWORD | This is the password for credentials |  |
SOAJS_MONGO_SSL | This is to turn on SSL | [false] |
SOAJS_MONGO_PREFIX | The database prefix | [""] |
SOAJS_MONGO_AUTH_DB | The database for credential | [admin] |

#### GITHUB
ENV Variable | Description | Default | Example
--- | ----- | :---: | ---
SOAJS_GIT_PROVIDER | This is the GIT account provider name | [github] |
SOAJS_GIT_DOMAIN | This is the GIT account domain | [github.com] |
SOAJS_GIT_OWNER | This is the GIT account owner name |  |
SOAJS_GIT_REPO | This is the GIT repo name |  |
SOAJS_GIT_BRANCH | This is the GIT repo branch | [master] |
SOAJS_GIT_TOKEN | This is the GIT account token |  |
SOAJS_GIT_ACC | | |

#### GITHUB for SOAJS console
ENV Variable | Description | Default | Example
--- | ----- | :---: | ---
SOAJS_GIT_PATH | This is the path of where the ui code exists in the GIT repo | [/] |
SOAJS_GIT_DASHBOARD_BRANCH | This is the GIT repo branch for soajs.dashboard.UI | [ master] |
SOAJS_GIT_PORTAL_BRANCH | This is the GIT repo branch for soajs.portal.ui | [ master] |
SOAJS_EXTKEY | The tenant external key to use |  |

#### NODEJS
ENV Variable | Description | Default | Example
--- | ----- | :---: | ---
SOAJS_SRV_MEMORY | defines a custom value for nodejs memory limit | [null] |
SOAJS_SRV_MAIN | The main file | [.] |

#### SOAJS
ENV Variable | Description | Default | Example
--- | ----- | :---: | ---
SOAJS_ENV | The environment where you are deploying | [dev] |
SOAJS_PROFILE_LOC | The profile location | [/opt/soajs/FILES/profiles/] |
SOAJS_DEPLOY_ACC | Use the soajs dependencies available on the image | [null] |
SOAJS_HA_NAME | Use the soajs dependencies available on the image | [BLANK] |
SOAJS_REGISTRY_API | Use the soajs dependencies available on the image | [BLANK] |

### License
*Copyright SOAJS All Rights Reserved.*

Use of this source code is governed by an Apache license that can be found in the LICENSE file at the root of this repository.
