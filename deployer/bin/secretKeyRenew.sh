#!/usr/bin/env bash

MD5

executeWork () {
	if [ -f /opt/soajs/certificates/secret/private_key/private-key ]; then
		openssl rsa -outform PEM -in /opt/soajs/certificates/secret/private_key/private-key -out /opt/soajs/certificates/privkey.pem
		echo $'Key privkey.pem created'
	else
		echo $'Unable to find private_key ...'
	fi
}

make_md5sums () {
	local file=${1}
    MD5=$(md5sum "$file" | cut -d ' ' -f 1)
    executeWork
}

check_md5sums () {
	local file=${1}

    local stored_md5sum=${MD5}
    local current_md5sum=$(md5sum "$file" | cut -d ' ' -f 1)
    if [ ${stored_md5sum} != ${current_md5sum} ]
    then
        echo $'SOAJS Secret auto renew for key ....'
        MD5=${current_md5sum}
        executeWork

        if [ -f /opt/soajs/certificates/privkey.pem ]; then
			if [ -f /opt/soajs/certificates/fullchain.pem ]; then
	            echo $'Reloading nginx ....'
				nginx -s reload
			fi
		fi
    fi
    sleep 10s
}

runCheck () {
	check_md5sums /opt/soajs/certificates/secret/private_key/private-key
}

if [ ! -z "${SOAJS_SSL_CONFIG}" ]; then
    echo $'SOAJS_SSL_CONFIG detected ....'

	if [ ! -z "${SOAJS_SSL_SECRET}" ]; then
        echo $'SOAJS_SSL_SECRET detected ....'

		make_md5sums /opt/soajs/certificates/secret/private_key/private-key
		$(while true; do runCheck; done;) &
	fi

fi