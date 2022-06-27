#!/bin/bash
retry=0
while true; do
    HOUR="$(date +'%H')"
    #echo $HOUR
    if [ $HOUR -ge 8 ]; then
	#node /root/Projects/ChaauCheungC/checkcheung.js > /root/Projects/ChaauCheungC/log 2>&1
	node main.js 2>&1 | tee log
    fi
    ret=${PIPESTATUS[0]}
    echo $ret > ret
    if [ $ret -eq 0 ]; then
	sleep $(cat delay)
    	retry=0
    else
	sleep $((60*$retry))
    fi
done

