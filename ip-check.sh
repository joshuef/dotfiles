#!/bin/bash

CURRENT_IP="${HOME}/current-ip";
IP=$(curl ipinfo.io/ip)

if [ ! -f "${CURRENT_IP}" ]; then

    echo "$IP" > "$CURRENT_IP"
fi

DIFF=$(diff ~/current-ip <(echo "$IP"))
if [ "$IP" ]
then

    if [ "$DIFF" = "" ]
    then
        :
    elif [ "$DIFF" != "" ]
    then
       # mv /PATH/TO/SCRIPT/currentip.txt /PATH/TO/SCRIPT/oldip.txt
        echo "$IP" > "$CURRENT_IP"
        echo "$IP" | mail -s "Casa IP Change" joshuef@gmail.com
    fi
else
    :
fi


