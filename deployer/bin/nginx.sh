#!/usr/bin/env bash


certbotRenew(){
    echo $'SOAJS Certbot auto renew ....'
	if [ -f "/opt/soajs/certificates/domains" ]; then
		local domain=$(cat /opt/soajs/certificates/domains | awk -F, '{ print $1 }')
		if [ -f "/opt/soajs/letsencrypt/live/$domain/privkey.pem" ]; then
			certbot renew
	        cp "/opt/soajs/letsencrypt/live/$domain/privkey.pem" /opt/soajs/certificates/privkey.pem
	        cp "/opt/soajs/letsencrypt/live/$domain/fullchain.pem" /opt/soajs/certificates/fullchain.pem
	    else
	        echo $'Unable to renew certificate, file not found @ /opt/soajs/letsencrypt/live/'${domain}
		fi
	fi
}

if [ ! -z "${SOAJS_SSL_CONFIG}" ]; then
    echo $'SOAJS_SSL_CONFIG detected ....'

	if [ ! -f /opt/soajs/certificates/fullchain.pem ]; then
	    mkdir -p /opt/soajs/certificates
	fi

	if [ ! -f /opt/soajs/certificates/fullchain.pem ]; then
	    openssl dhparam -out /opt/soajs/certificates/dhparam.pem 2048
		openssl genrsa -out /opt/soajs/certificates/privkey.pem 4096
		openssl req -new -key /opt/soajs/certificates/privkey.pem -out /opt/soajs/certificates/cert.csr -nodes -subj "/C=PT/ST=World/L=World/O=World/OU=World/CN=World/emailAddress=team@soajs.org"
		openssl x509 -req -days 365 -in /opt/soajs/certificates/cert.csr -signkey /opt/soajs/certificates/privkey.pem -out /opt/soajs/certificates/fullchain.pem
	fi

	### Send certbot Emission/Renewal to background
	$(while :; do certbotRenew; sleep 12h; done;) &

	### Check for changes in the certificate (i.e renewals or first start) and send this process to background
	$(while inotifywait -e close_write /opt/soajs/certificates; do nginx -s reload; done) &
fi

### Start nginx with daemon off as our main pid
service nginx start
