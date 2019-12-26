#!/usr/bin/env bash


certbotRenew(){
    echo $'SOAJS Certbot auto renew ....'
	pushd /opt/soajs/soajs.deployer/deployer/
	node . -T nginx -S certrenew
	popd
}

secretFullchain(){
	if [ -f /opt/soajs/certificates/secret/fullchain_crt/fullchain-crt ]; then

		pushd /opt/soajs/certificates/secret/
		csplit -f "crt" /opt/soajs/certificates/secret/fullchain_crt/fullchain-crt '/-----BEGIN CERTIFICATE-----/' '{*}'
		openssl x509 -outform PEM -in /opt/soajs/certificates/secret/crt01 -out /opt/soajs/certificates/secret/crt01.pem
		openssl x509 -outform PEM -in /opt/soajs/certificates/secret/crt02 -out /opt/soajs/certificates/secret/crt02.pem
		cat /opt/soajs/certificates/secret/crt01.pem > /opt/soajs/certificates/secret/fullchain.pem
		cat /opt/soajs/certificates/secret/crt02.pem >> /opt/soajs/certificates/secret/fullchain.pem
		cp /opt/soajs/certificates/secret/fullchain.pem /opt/soajs/certificates/fullchain.pem
		rm -f crt*
		popd

		echo $'Full chain fullchain.pem created'
	else
		echo $'Unable to find fullchain_crt ...'
	fi
}
secretKey(){
	if [ -f /opt/soajs/certificates/secret/private_key/private-key ]; then
		openssl rsa -outform PEM -in /opt/soajs/certificates/secret/private_key/private-key -out /opt/soajs/certificates/privkey.pem
		echo $'Key privkey.pem created'
	else
		echo $'Unable to find private_key ...'
	fi
}
secretRenew(){
    echo $'SOAJS Secret first run ....'
	pushd /opt/soajs/soajs.deployer/deployer/

	secretFullchain

	secretKey

	popd
}
secretFullchainRenew(){
    echo $'SOAJS Secret auto renew for fullchain ....'
	pushd /opt/soajs/soajs.deployer/deployer/

	secretFullchain

	if [ -f /opt/soajs/certificates/privkey.pem ]; then
		if [ -f /opt/soajs/certificates/fullchain.pem ]; then
            echo $'Reloading nginx ....'
			nginx -s reload
		fi
	fi

	popd
}
secretKeyRenew(){
    echo $'SOAJS Secret auto renew for key ....'
	pushd /opt/soajs/soajs.deployer/deployer/

	secretKey

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
        secretRenew
		$(while inotifywait -e close_write /opt/soajs/certificates/secret/private_key/private-key; do secretKeyRenew; done;) &
		$(while inotifywait -e close_write /opt/soajs/certificates/secret/fullchain_crt/fullchain-crt; do secretFullchainRenew; done;) &
	else
		### Send certbot Emission/Renewal to background
		$(while :; do certbotRenew; sleep 12h; done;) &
	fi

fi

### Start nginx with daemon off as our main pid
service nginx start
