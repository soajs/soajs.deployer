#!/usr/bin/env bash

if [[ -z "${SOAJS_SSL_CONFIG}" ]]; then

	if [[ ! -f /usr/share/nginx/certificates/fullchain.pem ]]; then
	    mkdir -p /usr/share/nginx/certificates
	fi

	if [[ ! -f /usr/share/nginx/certificates/fullchain.pem ]]; then
	    openssl dhparam -out /opt/soajs/certificates/dhparam.pem 2048
		openssl genrsa -out /opt/soajs/certificates/privkey.pem 4096
		openssl req -new -key /opt/soajs/certificates/privkey.pem -out /opt/soajs/certificates/cert.csr -nodes -subj "/C=PT/ST=World/L=World/O=World/OU=World/CN=World/emailAddress=team@soajs.org"
		openssl x509 -req -days 365 -in /opt/soajs/certificates/cert.csr -signkey /opt/soajs/certificates/privkey.pem -out /opt/soajs/certificates/fullchain.pem
	fi

	### Send certbot Emission/Renewal to background
	$(while :; do certbot renew; sleep 12h; done;) &

	### Check for changes in the certificate (i.e renewals or first start) and send this process to background
	mkdir -p /etc/letsencrypt/live/
	$(while inotifywait -e close_write -r /etc/letsencrypt/live/; do nginx -s reload; done) &
fi

### Start nginx with daemon off as our main pid
service nginx start
