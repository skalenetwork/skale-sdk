#!/usr/bin/env bash

IPS=()
while read line ; do
        IPS+=($line)
done <ips.txt

NUM_NODES=${#IPS[@]}
echo $NUM_NODES

for IP in ${IPS[*]} #:0:11}
do

	I=$((I+1))
	echo $I
#	echo $IP
	CUR_URL="http://$IP:1234"
  echo $CUR_URL
## Get Block Number
#	curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' $CUR_URL

## Turn off broadcast
#	curl -X POST --data '{"jsonrpc":"2.0","method":"debug_pauseBroadcast","params":[true],"id":1}' $CUR_URL
CONT=skale-ci-$I-0
echo $CONT
ssh -i ~/.ssh/ash_sydney.pem -o "StrictHostKeyChecking no" ubuntu@$IP <<- ****
sudo docker stop $CONT

****
echo "Skaled restarted on $IP"

done