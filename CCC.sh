#!/bin/bash

while true; do
	node /root/Projects/ChaauCheungC/checkcheung.js > /root/Projects/ChaauCheungC/log 2>&1
	node /root/Projects/ChaauCheungC/main.js > /root/Projects/ChaauCheungC/log1 2>&1
	sleep 600
done

