#!/usr/bin/env bash


certbotRenew(){
    echo $'SOAJS Certbot auto renew ....'
	pushd /opt/soajs/soajs.deployer/deployer/
	node . -T nginx -S certrenew
	popd
}

if [ ! -z "${SOAJS_SSL_CONFIG}" ]; then
    echo $'SOAJS_SSL_CONFIG detected ....'

	mkdir -p /opt/soajs/certificates/webroot/
	mkdir -p /opt/soajs/certificates/secret/

	if [ ! -f /opt/soajs/certificates/dhparam.pem ]; then
	    openssl dhparam -out /opt/soajs/certificates/dhparam.pem 2048
	fi
	if [ ! -f /opt/soajs/certificates/fullchain.pem ]; then
		openssl genrsa -out /opt/soajs/certificates/privkey.pem 4096
		openssl req -new -key /opt/soajs/certificates/privkey.pem -out /opt/soajs/certificates/cert.csr -nodes -subj "/C=PT/ST=World/L=World/O=World/OU=World/CN=World/emailAddress=team@soajs.org"
		openssl x509 -req -days 365 -in /opt/soajs/certificates/cert.csr -signkey /opt/soajs/certificates/privkey.pem -out /opt/soajs/certificates/fullchain.pem
	fi

	if [ ! -z "${SOAJS_SSL_SECRET}" ]; then
        echo $'SOAJS_SSL_SECRET detected ....'
        /opt/soajs/soajs.deployer/deployer/bin/secretKeyRenew.sh
        /opt/soajs/soajs.deployer/deployer/bin/secretFullchainRenew.sh
	else
		### Send certbot Emission/Renewal to background
		$(while :; do certbotRenew; sleep 12h; done;) &
	fi

fi

### Start nginx with daemon off as our main pid
service nginx start
