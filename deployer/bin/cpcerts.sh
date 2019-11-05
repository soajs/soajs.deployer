#!/usr/bin/env bash

echo $'Trying to copy certificates ....'

if [ -f "/opt/soajs/certificates/domains" ]; then
	domain=$(cat /opt/soajs/certificates/domains | awk -F, '{ print $1 }')
	if [ -f "/opt/soajs/letsencrypt/live/$domain/privkey.pem" ]; then
        cp "/opt/soajs/letsencrypt/live/$domain/privkey.pem" /opt/soajs/certificates/privkey.pem
        cp "/opt/soajs/letsencrypt/live/$domain/fullchain.pem" /opt/soajs/certificates/fullchain.pem
    else
        echo $'Unable to renew certificate, file not found @ /opt/soajs/letsencrypt/live/'${domain}
	fi
fi