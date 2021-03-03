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

ssh -i ~/.ssh/ash_paris.pem -o "StrictHostKeyChecking no" ubuntu@$IP <<- ****
cd 1node-cat-cycle
nohup node cat-cycle.js &> output_cats.log &
****
echo "Cats started on $IP"

done