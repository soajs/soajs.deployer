#!/usr/bin/env bash

MD5

executeWork(){
	if [ -f /opt/soajs/certificates/secret/fullchain_crt/fullchain-crt ]; then
		pushd /opt/soajs/certificates/secret/
		csplit -f "crt" /opt/soajs/certificates/secret/fullchain_crt/fullchain-crt '/-----BEGIN CERTIFICATE-----/' '{*}'

		if [ -f /opt/soajs/certificates/secret/crt01 ]; then
			openssl x509 -outform PEM -in /opt/soajs/certificates/secret/crt01 -out /opt/soajs/certificates/secret/crt01.pem
		fi
		if [ -f /opt/soajs/certificates/secret/crt02 ]; then
			openssl x509 -outform PEM -in /opt/soajs/certificates/secret/crt02 -out /opt/soajs/certificates/secret/crt02.pem
		fi
		if [ -f /opt/soajs/certificates/secret/crt01.pem ]; then
			if [ -f /opt/soajs/certificates/secret/crt02.pem ]; then
				cat /opt/soajs/certificates/secret/crt01.pem > /opt/soajs/certificates/secret/fullchain.pem
				cat /opt/soajs/certificates/secret/crt02.pem >> /opt/soajs/certificates/secret/fullchain.pem
				mv /opt/soajs/certificates/secret/fullchain.pem /opt/soajs/certificates/fullchain.pem
			fi
		else
			echo $'Unable to create fullchain.pem ...'
		fi
		rm -f crt*

		popd
		echo $'Full chain fullchain.pem created'
	else
		echo $'Unable to find fullchain_crt ...'
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

runCheck(){
	check_md5sums /opt/soajs/certificates/secret/fullchain_crt/fullchain-crt
}

if [ ! -z "${SOAJS_SSL_CONFIG}" ]; then
    echo $'SOAJS_SSL_CONFIG detected ....'

	if [ ! -z "${SOAJS_SSL_SECRET}" ]; then
        echo $'SOAJS_SSL_SECRET detected ....'

		make_md5sums /opt/soajs/certificates/secret/fullchain_crt/fullchain-crt
		$(while true; do runCheck; done;) &
	fi

fi