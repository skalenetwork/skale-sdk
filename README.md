# skale-dev-env
skale-dev-env is a collection of tools for setting up local development environment for SKALE chain development.

## Package contents
 1. single-node containerized version of `skaled` deamon;
 2. `skaled-blockchain-explorer` (HTML UI for viewing blockchain);
 3. `skaled-stats-viewer` (HTML UI for monitoring/troubleshooting running skaled).

## Dependencies
On Ubuntu 19.10
```
sudo apt-get update
sudo apt install docker.io
```
Optionally (in case of troubles):
```
sudo service docker start
docker logout
```

On Mac, be sure to install docker.

## How to run

1. Run daemon: `./run.sh`
2. Use either of the folloging as endpoint:
   * `http://127.0.0.1:1234`
   * `ws://127.0.0.1:1233`
3. Set `chainID=54173`
4. Use your wallet with the following test credentials:
```
  Seed phrase: kidney describe moon museum join brave birth detect harsh little hockey turn
  Address: 0x6d80aAC61F6d92c7F4A3c412850474ba963B698E
  Private key: 0x16db936de7342b075849d74a66460007772fab88cf4ab509a3487f23398823d6
```

Important: Only the SKALE Chain owner (`0x6d80a...`) can deploy contracts. To allow any address to deploy, append `"freeContractDeployment": true` to L77 of config.json.in.

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
