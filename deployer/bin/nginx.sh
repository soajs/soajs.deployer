#!/usr/bin/env bash

if [[ -z "${SOAJS_SSL_CONFIG}" ]]; then
	### Send certbot Emission/Renewal to background
	$(while :; do certbot renew; sleep 12h; done;) &

	### Check for changes in the certificate (i.e renewals or first start) and send this process to background
	mkdir -p /etc/letsencrypt/live/
	$(while inotifywait -e close_write -r /etc/letsencrypt/live/; do nginx -s reload; done) &
fi

### Start nginx with daemon off as our main pid
nginx -g "daemon off;"
