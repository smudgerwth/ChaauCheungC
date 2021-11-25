#!/bin/bash

while true; do
    HOUR="$(date +'%H')"
    echo $HOUR
    if [ $HOUR -ge 8 ]; then
	#node /root/Projects/ChaauCheungC/checkcheung.js > /root/Projects/ChaauCheungC/log 2>&1
	node /root/Projects/ChaauCheungC/main.js > /root/Projects/ChaauCheungC/log1 2>&1
    fi
    sleep 700
done

