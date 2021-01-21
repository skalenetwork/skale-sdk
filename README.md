# SKALE Developer SDK

This is a collection of tools for setting up local containerized single node environment for developing and testing Ethereum dApps on SKALE. It has been tested on both Mac and Ubuntu, and requires Docker. 

It's super fast and easy – minimal setup is required. :muscle: 

Once the container is running, you can use your usual tooling such as Truffle, Remix, Web3, etc. to deploy your Ethereum dApps to the SKALE container.

> :pencil2: This SDK is limited to dApp development on SKALE Chains only. If you need to develop on SKALE Chains with Interchain Messaging Agent, see [SKALE IMA SDK](https://github.com/skalenetwork/skale-ima-sdk).

## Package contents

 1. single-node containerized version of `skaled` deamon;
 2. `skaled-blockchain-explorer` (HTML UI for viewing blockchain);
 3. `skaled-stats-viewer` (HTML UI for monitoring/troubleshooting running skaled).

## Dependencies

### On Ubuntu 19.10

```shell
sudo apt-get update
sudo apt install docker.io
```
Optionally (in case of troubles):

```shell
sudo service docker start
docker logout
```

### On Mac

[Install Docker](https://docs.docker.com/docker-for-mac/install/)

## How to run

1. Clone this repo to your local machine.
2. Run daemon: `./run.sh`.
3. Use either of the following as endpoint:
   * `http://127.0.0.1:1234`
   * `ws://127.0.0.1:1233`
4. Set `chainID=344435` (0x54173).
5. Use your wallet with the following test credentials:
```
  Seed phrase: kidney describe moon museum join brave birth detect harsh little hockey turn
  Address: 0x6d80aAC61F6d92c7F4A3c412850474ba963B698E
  Private key: 0x16db936de7342b075849d74a66460007772fab88cf4ab509a3487f23398823d6
```

> :information_source: Only the SKALE Chain owner (`0x6d80a...`) can deploy contracts. To allow any address to deploy, append `"freeContractDeployment": true` to L77 of config.json.in.

## Additional features
```
Usage:
  run.sh OPTIONS
  run.sh -? | --help

OPTIONS:

  --host -h  Local address to bind to (default: 0.0.0.0)
  --http-port  HTTP port to listen at (default: 1234 or use -1 to disable)
  --ws-port  WebSocket port to listen at (default: 1233 or use -1 to disable)
  --port -p  Same as --http-port
  
  -e --defaultBalanceEther  Amount of Ether to generate on schain owner's address (default: 100)
  -b --blockTime Interval of empty blocks generation (default: 3 sec or use -1 to disable)
  -? --help  Display this help information.
```

### HTML Tools
 * `skaled-blockchain-explorer/ethereum-explorer.html`
 * `skaled-stats-viewer/stats.html`
