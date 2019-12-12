#!/usr/bin/env bash


certbotRenew(){
    echo $'SOAJS Certbot auto renew ....'
	pushd /opt/soajs/soajs.deployer/deployer/
	node . -T nginx -S certrenew
	popd
}

secretRenew(){
    echo $'SOAJS Secret auto renew ....'
	pushd /opt/soajs/soajs.deployer/deployer/

	if [ -f /opt/soajs/certificates/secret/fullchain_crt ]; then
		openssl x509 -outform PEM -in /opt/soajs/certificates/secret/fullchain_crt -out /opt/soajs/certificates/fullchain.pem
		echo $'Full chain fullchain.pem created'
	else
		echo $'Unable to find fullchain_crt ...'
	fi

	if [ -f /opt/soajs/certificates/secret/private_key ]; then
		openssl rsa -outform PEM -in /opt/soajs/certificates/secret/private_key -out /opt/soajs/certificates/privkey.pem
		echo $'Key privkey.pem created'
	else
		echo $'Unable to find private_key ...'
	fi

	if [ -f /opt/soajs/certificates/privkey.pem ]; then
		if [ -f /opt/soajs/certificates/fullchain.pem ]; then
            echo $'Reloading nginx ....'
			nginx -s reload
		fi
	fi
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
		$(while inotifywait -e close_write /opt/soajs/certificates/secret/.; do secretRenew; done;) &
	else
		### Send certbot Emission/Renewal to background
		$(while :; do certbotRenew; sleep 12h; done;) &
	fi

fi

### Start nginx with daemon off as our main pid
service nginx start
