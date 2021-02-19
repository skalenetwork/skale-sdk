let os = require( "os" );
let fs = require( "fs" );
let path = require( "path" );

const cc = require( "./cc.js" );
const log = require( "./log.js" );
cc.enable( true );
log.addStdout();

const g_w3mod = require( "web3" );
let ethereumjs_tx = require( "ethereumjs-tx" );
let ethereumjs_wallet = require( "ethereumjs-wallet" );
let ethereumjs_util = require( "ethereumjs-util" );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// accept self signed certificates
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const CAT_START_BALANCE = 30000000000000;
const CAT_SENDING_VALUE = 1;

let g_bVerbose = false;

let g_arrAllCats = JSON.parse( JSON.stringify( require( "./all-cats.js" ).arrAllCats ) );

let g_ownerPrivateKey = "";
let g_runIterations = 2000000000;
let g_runInterval = 5000;

let runArguments = process.argv.slice(2);

// provide non default endpoint
if(runArguments.length > 0) {
    console.log("Use provided endpoint.")
    var g_arrNodeURLs = [runArguments[0]];
}
else {
    console.log("Use provided endpoint.")
    var g_arrNodeURLs = [
        // "http://127.0.0.1:15000", "http://127.0.0.2:7100", "http://127.0.0.3:7200", "http://127.0.0.4:7300"
        // "ws://127.0.0.1:15001", "ws://127.0.0.2:15002", "ws://127.0.0.3:15003", "ws://127.0.0.4:15004"
//        "http://127.0.0.1:1234"
//        "ws://127.0.0.1:1233"
        "http://35.180.12.13:1234"
        // "http://127.0.0.2:15100"
        // "http://127.0.0.1:15000" //, "http://127.0.0.2:15100"
        // "http://127.0.0.1:15000", "https://127.0.0.1:15010"
        // "http://127.0.0.1:15000" //, "http://127.0.0.2:15100" //, "https://127.0.0.1:15001", "https://127.0.0.2:15110"
        // "https://127.0.0.1:15010"
        // "https://127.0.0.1:15010" // "https://127.0.0.1:15110"
        // "ws://127.0.0.1:15020" //, "ws://127.0.0.2:15120"
        // "wss://127.0.0.1:15030"
        // "ws://127.0.0.1:15020" //, "wss://127.0.0.1:15030"
        // "wss://for-christine-0.skalenodes.com:10018"
    ];
}

if(runArguments.length > 1) {
    if (runArguments[1] !== "") {
        g_ownerPrivateKey = remove_starting_0x(runArguments[1]);
    }
}

if(runArguments.length > 2) {
    g_runIterations = +runArguments[2];
}

if(runArguments.length > 3) {
    g_runInterval = +runArguments[3];
}

// let g_arrNodeURLs = load_web3_url_array_from_config_json(
//     "/home/serge/Work/SkaleExperimental/skaled-tests/single-node/run-skaled/config0.json",
//     { enableIP4: true, enableIP6: false , enableHTTP: true , enableHTTPS: true , enableWS: true , enableWSS: true }
//     );

let g_arrNodes = [];

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function randomFixedInteger( length ) {
    return Math.floor( Math.pow( 10, length - 1 ) + Math.random() * ( Math.pow( 10, length ) - Math.pow( 10, length - 1 ) - 1 ) );
}

function replaceAll( str, find, replace ) {
    return str.replace( new RegExp( find, "g" ), replace );
}

function fn_address_impl_( w3 ) {
    if ( this.address_ == undefined || this.address_ == null )
        this.address_ = "" + private_key_2_account_address( w3, this.privateKey );
    return this.address_;
}

function ensure_starts_with_0x( s ) {
    if ( s == null || s == undefined || typeof s !== "string" )
        return s;
    if ( s.length < 2 )
        return "0x" + s;
    if ( s[ 0 ] == "0" && s[ 1 ] == "x" )
        return s;
    return "0x" + s;
}

function remove_starting_0x( s ) {
    if ( s == null || s == undefined || typeof s !== "string" )
        return s;
    if ( s.length < 2 )
        return s;
    if ( s[ 0 ] == "0" && s[ 1 ] == "x" )
        return s.substr( 2 );
    return s;
}

function is_valid_ip_port_number( nPort ) {
    if( typeof nPort != "number" )
        return false;
    if( nPort <= 0 )
        return false;
    if( nPort >= 65536 )
        return false;
    return true;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function private_key_2_public_key( w3, keyPrivate ) {
    if ( w3 == null || w3 == undefined || keyPrivate == null || keyPrivate == undefined )
        return "";
    // get a wallet instance from a private key
    const privateKeyBuffer = ethereumjs_util.toBuffer( ensure_starts_with_0x( keyPrivate ) );
    const wallet = ethereumjs_wallet.fromPrivateKey( privateKeyBuffer );
    // get a public key
    const keyPublic = wallet.getPublicKeyString();
    return remove_starting_0x( keyPublic );
}

function public_key_2_account_address( w3, keyPublic ) {
    if ( w3 == null || w3 == undefined || keyPublic == null || keyPublic == undefined )
        return "";
    const hash = w3.utils.sha3( ensure_starts_with_0x( keyPublic ) );
    const strAddress = ensure_starts_with_0x( hash.substr( hash.length - 40 ) );
    return strAddress;
}

function private_key_2_account_address( w3, keyPrivate ) {
    const keyPublic = private_key_2_public_key( w3, keyPrivate );
    const strAddress = public_key_2_account_address( w3, keyPublic );
    return strAddress;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function provider2url( provider ) {
    if( provider == null || provider == undefined )
        return "<N/A>";
    if( "host" in provider && provider.host && typeof provider.host == "string" && provider.host.length > 0 )
        return "" + provider.host;
    if( "connection" in provider && provider.connection && typeof provider.connection == "object"
        && "url" in provider.connection && provider.connection.url && typeof provider.connection.url == "string" && provider.connection.url.length > 0
        )
        return "" + provider.connection.url;
    if( "connection" in provider && provider.connection && typeof provider.connection == "object"
        && "_url" in provider.connection && provider.connection._url && typeof provider.connection._url == "string" && provider.connection._url.length > 0
        )
        return "" + provider.connection.url;
    return "<unknown>";
}


async function sendMoneyFromTo( w3, privateKey, nameFrom, addressFrom, nameTo, addressTo, value, fn ) {
    fn = fn || function() {};
    let strURL = "" + provider2url( w3.currentProvider );
    let strConnectionPrefix = cc.normal("Connection ") + cc.u( strURL ) + cc.normal(" >>> ");
    log.write(
        strConnectionPrefix
        + cc.normal("Will send money from ")
        + cc.attention(nameFrom) + cc.debug("/") + cc.info(addressFrom)
        + cc.normal(" to ")
        + cc.attention(nameTo) + cc.debug("/") + cc.info( addressTo )
        + cc.normal("...") + "\n" );


    let strAddress = addressFrom;

    var isError = false;
    try {
        let gasPrice = parseInt(await w3.eth.getGasPrice());
        if ( g_bVerbose )
            log.write( strConnectionPrefix + cc.debug( "Current " ) + cc.info( "gas price" ) + cc.debug( " = " ) + cc.sunny( gasPrice ) + "\n" );
        if ( g_bVerbose )
            log.write( strConnectionPrefix + cc.notice( "Will call " ) + cc.notice( "w3.eth.getTransactionCount()" ) + cc.notice( "..." ) + "\n" );
        let tcnt = await w3.eth.getTransactionCount( strAddress, null );
        if ( g_bVerbose )
            log.write( strConnectionPrefix + cc.success( "Done" ) + cc.notice( ", got " ) + cc.sunny( tcnt ) + "\n" );
        //
        let rawTx = {
            "nonce": tcnt, // 0x00, ...
            "gasPrice": gasPrice,
            "gasLimit": 30000,
            "to": addressTo,
            //"data": null,
            "value": value
        };
        if ( g_bVerbose )
            log.write( strConnectionPrefix + cc.debug( "...composed " ) + cc.j( rawTx ) + "\n" );
        let tx = new ethereumjs_tx( rawTx );
        // if( g_bVerbose )
        //     log.write( strConnectionPrefix + cc.debug("...ethereum js tx ") + cc.j(tx) + "\n" );
        var key = Buffer.from( privateKey, "hex" ); // convert private key to buffer
        // if( g_bVerbose )
        //     log.write( strConnectionPrefix + cc.debug("...created key ") + cc.j(key) + "\n" );
        tx.sign( key ); // arg is privateKey as buffer
        // if( g_bVerbose )
        //     log.write( strConnectionPrefix + cc.debug("...signed tx ") + cc.j(tx) + "\n" );
        var serializedTx = tx.serialize();
        // if( g_bVerbose )
        //     log.write( strConnectionPrefix + cc.debug("...serialized tx ") + cc.j(serializedTx) + "\n" );
        if ( g_bVerbose )
            log.write( strConnectionPrefix + cc.debug( "Sending signed method call transaction..." ) + "\n" );
        let joReceipt = await w3.eth.sendSignedTransaction( "0x" + serializedTx.toString( "hex" ) );
        if ( g_bVerbose )
            log.write( strConnectionPrefix + cc.debug( "Result receipt: " ) + cc.j( joReceipt ) + "\n" );
        log.write( cc.success( "Done" ) + cc.notice( ", sent" ) + "\n" );
    } catch ( err ) {
        isError = true;
        log.write(
            strConnectionPrefix
            + cc.error("Sending money from ")
            + cc.attention(nameFrom) + cc.debug("/") + cc.info(addressFrom)
            + cc.error(" to ")
            + cc.attention(nameTo) + cc.debug("/") + cc.info( addressTo )
            + cc.error(": ") + cc.warn( err.message ) + "\n" );
        //process.exit( 100 );
    }
    fn( isError );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function normalizePath( strPath ) {
    strPath = strPath.replace( /^~/, os.homedir() );
    strPath = path.normalize( strPath );
    strPath = path.resolve( strPath );
    return strPath;
}

function fileExists( strPath ) {
    try {
        if ( fs.existsSync( strPath ) ) {
            var stats = fs.statSync( strPath );
            if ( stats.isFile() )
                return true;
        }
    } catch ( err ) {}
    return false;
}

function fileLoad( strPath, strDefault ) {
    strDefault = strDefault || "";
    if ( !fileExists( strPath ) )
        return strDefault;
    try {
        let s = fs.readFileSync( strPath );
        return s;
    } catch ( err ) {}
    return strDefault;
}

function fileSave( strPath, s ) {
    try {
        fs.writeFileSync( strPath, s );
        return true;
    } catch ( err ) {}
    return false;
}

function jsonFileLoad( strPath, joDefault, bLogOutput ) {
    if ( bLogOutput == undefined || bLogOutput == null )
        bLogOutput = false;
    joDefault = joDefault || {};
    if ( bLogOutput )
        log.write( cc.normal( "Will load JSON file " ) + cc.info( strPath ) + cc.normal( "..." ) + "\n" );
    if ( !fileExists( strPath ) ) {
        if ( bLogOutput )
            log.write( cc.error( "Cannot load JSON file " ) + cc.info( strPath ) + cc.normal( ", it does not exist" ) + "\n" );
        return joDefault;
    }
    try {
        let s = fs.readFileSync( strPath );
        if ( bLogOutput )
            log.write( cc.normal( "Did loaded content of JSON file " ) + cc.info( strPath ) + cc.normal( ", will parse it..." ) + "\n" );
        let jo = JSON.parse( s );
        if ( bLogOutput )
            log.write( cc.success( "Done, loaded content of JSON file " ) + cc.info( strPath ) + cc.success( "." ) + "\n" );
        return jo;
    } catch ( err ) {
        if ( bLogOutput )
            console.log( cc.fatal( "CRITICAL ERROR:" ) + cc.error( " failed to load JSON file " ) + cc.info( strPath ) + cc.error( ": " ) + cc.warn( err ) );
    }
    return joDefault;
}

function jsonFileSave( strPath, jo, bLogOutput ) {
    if ( bLogOutput == undefined || bLogOutput == null )
        bLogOutput = false;
    if ( bLogOutput )
        log.write( cc.normal( "Will save JSON file " ) + cc.info( strPath ) + cc.normal( "..." ) + "\n" );
    try {
        let s = JSON.stringify( jo, null, 4 );
        fs.writeFileSync( strPath, s );
        if ( bLogOutput )
            log.write( cc.success( "Done, saved content of JSON file " ) + cc.info( strPath ) + cc.success( "." ) + "\n" );
        return true;
    } catch ( err ) {
        if ( bLogOutput )
            console.log( cc.fatal( "CRITICAL ERROR:" ) + cc.error( " failed to save JSON file " ) + cc.info( strPath ) + cc.error( ": " ) + cc.warn( err ) );
    }
    return false;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function load_web3_url_array_from_config_json( strPath, opts ) {
    try {
        opts = opts || {
            enableIP4: true
            , enableIP6: true
            , enableHTTP: true
            , enableHTTPS: true
            , enableWS: true
            , enableWSS: true
        };
        strPath = normalizePath( strPath );
        let joConfig = jsonFileLoad( strPath, {}, true );
        if( !( "skaleConfig" in joConfig
            && "sChain" in joConfig.skaleConfig
            && "nodes" in joConfig.skaleConfig.sChain
            && joConfig.skaleConfig.sChain.nodes.length > 0
            ) )
            throw "Bad configuration file data structure";
        let arr = [];
        let i = 0, cnt = joConfig.skaleConfig.sChain.nodes.length;
        for( i = 0; i < cnt; ++ i ) {
            let joNode = joConfig.skaleConfig.sChain.nodes[ i ];
            if( opts.enableIP4 && "ip" in joNode && typeof joNode.ip == "string" && joNode.ip.length > 0 ) {
                if( opts.enableHTTP && "httpRpcPort" in joNode && is_valid_ip_port_number( joNode.httpRpcPort ) )
                    arr.push( "http://" + joNode.ip + ":" + joNode.httpRpcPort );
                if( opts.enableHTTPS && "httpsRpcPort" in joNode && is_valid_ip_port_number( joNode.httpsRpcPort ) )
                    arr.push( "https://" + joNode.ip + ":" + joNode.httpsRpcPort );
                if( opts.enableWS && "wsRpcPort" in joNode && is_valid_ip_port_number( joNode.wsRpcPort ) )
                    arr.push( "ws://" + joNode.ip + ":" + joNode.wsRpcPort );
                if( opts.enableWSS && "wssRpcPort" in joNode && is_valid_ip_port_number( joNode.wssRpcPort ) )
                    arr.push( "wss://" + joNode.ip + ":" + joNode.wssRpcPort );
            }
            if( opts.enableIP6 && "ip6" in joNode && typeof joNode.ip6 == "string" && joNode.ip6.length > 0 ) {
                if( opts.enableHTTP && "httpRpcPort6" in joNode && is_valid_ip_port_number( joNode.httpRpcPort6 ) )
                    arr.push( "http://[" + joNode.ip6 + "]:" + joNode.httpRpcPort6 );
                if( opts.enableHTTPS && "httpsRpcPort6" in joNode && is_valid_ip_port_number( joNode.httpsRpcPort6 ) )
                    arr.push( "http://[" + joNode.ip6 + "]:" + joNode.httpsRpcPort6 );
                if( opts.enableWS && "wsRpcPort6" in joNode && is_valid_ip_port_number( joNode.wsRpcPort6 ) )
                    arr.push( "http://[" + joNode.ip6 + "]:" + joNode.wsRpcPort6 );
                if( opts.enableWSS && "wssRpcPort6" in joNode && is_valid_ip_port_number( joNode.wssRpcPort6 ) )
                    arr.push( "http://[" + joNode.ip6 + "]:" + joNode.wssRpcPort6 );
            }
        }
        console.log( cc.success("Loaded URLs: ") + cc.j(arr) );
        return arr;
    } catch ( err ) {
        console.log( cc.fatal( "CRITICAL ERROR:" ) + cc.error( " failed to save configuration file " ) + cc.info( strPath ) + cc.error( ": " ) + cc.warn( err ) );
        return [];
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// init nodes
for( idxNode = 0; idxNode < g_arrNodeURLs.length; ++ idxNode ) {
    var strURL = g_arrNodeURLs[ idxNode ];
    log.write( cc.normal("Initializing node ") + cc.info(idxNode) + cc.normal(" with url ") + cc.info( strURL ) + cc.normal("...") + "\n" );
    var u = cc.safeURL( strURL );
    let strProtocol = u.protocol.trim().toLowerCase().replace(":","").replace("/","");
    let joNode = { "strURL": strURL, "url": u, "w3": null };
    joNode.clear_w3 = function() {
        let self = this;
        try { delete self.w3; } catch( err ) {}
        try { delete self.w3ws; } catch( err ) {}
        try { delete self.w3http; } catch( err ) {}
        try { delete self.isWS; } catch( err ) {}
    }
    joNode.get_w3 = function() {
        let self = this;
        if( self.w3 )
            return self.w3;
        if( strProtocol == "ws" || strProtocol == "wss" ) {
            self.isWS = true;
            self.w3ws = new g_w3mod.providers.WebsocketProvider( strURL );
            self.w3 = new g_w3mod( self.w3ws );
        } else {
            self.isWS = false;
            self.w3http = new g_w3mod.providers.HttpProvider( strURL );
            self.w3 = new g_w3mod( self.w3http );
        }
        return self.w3;
    }
    g_arrNodes.push( joNode );
    log.write( cc.success("Done, node ") + cc.info(idxNode) + cc.success(" with url ") + cc.info( strURL ) + cc.success(" initialized.") + "\n" );
}

// refilling cats
async function refill_cats() {
    if (g_ownerPrivateKey !== "") {
        let w3 = g_arrNodes[0].get_w3();
        let ownerAddress = private_key_2_account_address(w3, g_ownerPrivateKey);
        for (idxCat = 0; idxCat < g_arrAllCats.length; ++idxCat) {
            let balance = await w3.eth.getBalance(g_arrAllCats[idxCat].address);
            if (balance < CAT_START_BALANCE) {
                await sendMoneyFromTo(w3, g_ownerPrivateKey, "Owner", ownerAddress,
                    g_arrAllCats[idxCat].name, g_arrAllCats[idxCat].address, CAT_START_BALANCE - balance, null);
            }
        }
    }
}

// init cats
for( idxCat = 0; idxCat < g_arrAllCats.length; ++ idxCat ) {
    log.write( cc.normal("Initializing cat ") + cc.info(idxCat) + cc.normal(" with name ") + cc.info( g_arrAllCats[idxCat].name ) + cc.normal("...") + "\n" );
    g_arrAllCats[idxCat].idxOperation = 0;
    g_arrAllCats[idxCat].idxCat = 0 + idxCat;
    g_arrAllCats[idxCat].getRandomNode = function( ) {
        var idxOP = randomFixedInteger(7) % g_arrNodes.length;
        return g_arrNodes[ idxOP ];
    };
    g_arrAllCats[idxCat].getNodeForOperation = function( idxOP ) {
        if( idxOP == undefined || idxOP < 0 )
            return this.getNodeForOperation( this.idxOperation );
        return g_arrNodes[ idxOP % g_arrNodes.length ];
    };
    g_arrAllCats[idxCat].currentNode = g_arrAllCats[idxCat].getRandomNode();
    var nextCatIndex = ( idxCat + 1 ) % g_arrAllCats.length;
    g_arrAllCats[idxCat].joNextCat = g_arrAllCats[ nextCatIndex ]
    g_arrAllCats[idxCat].sendMoney = function( fn ) {
        let self = this;
        fn = fn || function() {};
        sendMoneyFromTo( self.currentNode.get_w3(), self.private_key, self.name, self.address,
            self.joNextCat.name, self.joNextCat.address, CAT_SENDING_VALUE, fn );
    };
    g_arrAllCats[idxCat].scheduleNextRun = function() {
        let self = this;
        setTimeout( function() { self.run(); }, g_runInterval );
    };
    g_arrAllCats[idxCat].run = function() {
        let self = this;
        log.write( cc.normal("Run step ") + cc.notice(self.idxOperation) + cc.normal(" for cat ") + cc.info(self.idxCat) + cc.normal(" with name ") + cc.info( self.name ) + "\n" );
        self.sendMoney( function( isError ) {
            ++ self.idxOperation;
            if( isError )
                self.currentNode.clear_w3();
            if(self.idxOperation < g_runIterations)
                self.scheduleNextRun();
        } );
    };
    log.write( cc.success("Done, cat ") + cc.info(idxCat) + cc.success(" with name ") + cc.info( g_arrAllCats[idxCat].name ) + cc.success(" initialized for node ") + cc.u(g_arrAllCats[idxCat].currentNode.strURL) + cc.success(".") + "\n" );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// refilling cat wallets
refill_cats().finally(function () {
    for( idxCat = 0; idxCat < g_arrAllCats.length; ++ idxCat )
        g_arrAllCats[idxCat].run();
});


//g_arrAllCats[0].run();

//process.exit( 0 );

//log.write( cc.j( g_arrAllCats ) + "\n" );
//process.exit( 0 );
