const cc = require( "./cc.js" );
const log = require( "./log.js" );
cc.enable( true );
log.addStdout();

const g_w3mod = require( "web3" );
let ethereumjs_tx = require( "ethereumjs-tx" );
let ethereumjs_wallet = require( "ethereumjs-wallet" );
let ethereumjs_util = require( "ethereumjs-util" );

let g_bVerbose = true;

let strURL = "http://127.0.0.1:15000"; // "ws://127.0.0.1:15030"

var u = cc.safeURL( strURL );
let strProtocol = u.protocol.trim().toLowerCase().replace(":","").replace("/","");
let w3 = null;
let isWS = false;
if( strProtocol == "ws" || strProtocol == "wss" ) {
    isWS = true;
    let w3ws = new g_w3mod.providers.WebsocketProvider( strURL );
    w3 = new g_w3mod( w3ws );
} else {
    isWS = false;
    let w3http = new g_w3mod.providers.HttpProvider( strURL );
    w3 = new g_w3mod( w3http );
}
// now we have global variable w3 initialized

async function sendMoneyFromTo( w3, privateKey, nameFrom, addressFrom, nameTo, addressTo, fn ) {
    fn = fn || function() {};
    log.write( cc.normal("Sending money from ")
        + cc.attention(nameFrom) + cc.debug("/") + cc.info(addressFrom)
        + cc.normal(" to ")
        + cc.attention(nameTo) + cc.debug("/") + cc.info( addressTo )
        + cc.normal("...") + "\n" );


    let strAddress = addressFrom;

    var isError = false;
    try {
        let gasPrice = await w3.eth.getGasPrice();
        if ( g_bVerbose )
            log.write( cc.debug( "Current " ) + cc.info( "gas price" ) + cc.debug( " = " ) + cc.sunny( gasPrice ) + "\n" );
        if ( g_bVerbose )
            log.write( cc.notice( "Will call " ) + cc.notice( "w3.eth.getTransactionCount()" ) + cc.notice( "..." ) + "\n" );
        let tcnt = await w3.eth.getTransactionCount( strAddress, null );
        if ( g_bVerbose )
            log.write( cc.success( "Done" ) + cc.notice( ", got " ) + cc.sunny( tcnt ) + "\n" );
        //
        let rawTx = {
            "nonce": tcnt, // 0x00, ...
            "gasPrice": gasPrice, // 1, //w3.gasPrice,
            "gasLimit": 3000000,
            "gas": 3000000,
            "to": addressTo,
            //"data": null,
            "value": 1000
        };
        if ( g_bVerbose )
            log.write( cc.debug( "...composed " ) + cc.j( rawTx ) + "\n" );
        let tx = new ethereumjs_tx( rawTx );
        // if( g_bVerbose )
        //     log.write( cc.debug("...ethereum js tx ") + cc.j(tx) + "\n" );
        var key = Buffer.from( privateKey, "hex" ); // convert private key to buffer
        // if( g_bVerbose )
        //     log.write( cc.debug("...created key ") + cc.j(key) + "\n" );
        tx.sign( key ); // arg is privateKey as buffer
        // if( g_bVerbose )
        //     log.write( cc.debug("...signed tx ") + cc.j(tx) + "\n" );
        var serializedTx = tx.serialize();
        // if( g_bVerbose )
        //     log.write( cc.debug("...serialized tx ") + cc.j(serializedTx) + "\n" );
        if ( g_bVerbose )
            log.write( cc.debug( "Sending signed method call transaction..." ) + "\n" );
        let joReceipt = await w3.eth.sendSignedTransaction( "0x" + serializedTx.toString( "hex" ) );
        if ( g_bVerbose )
            log.write( cc.debug( "Result receipt: " ) + cc.j( joReceipt ) + "\n" );
        log.write( cc.success( "Done" ) + cc.notice( ", sent" ) + "\n" );
    } catch ( err ) {
        isError = true;
        log.write( cc.error("Sending money from ")
            + cc.attention(nameFrom) + cc.debug("/") + cc.info(addressFrom)
            + cc.error(" to ")
            + cc.attention(nameTo) + cc.debug("/") + cc.info( addressTo )
            + cc.error(": ") + cc.warn( err.message ) + "\n" );
        //process.exit( 100 );
    }
    fn( isError );
}












let catFrom = {
    private_key: "1016316fe598b437cfd518c02f67467385b018e61fd048325c7e7c9e5e07cd2a",
    address: "0xa68f946090c600eda6f139783077ee802afeb990",
    type: "rich cat",
    balance: "1000000000000000000000000000000",
    name: "Aldo",
    gender: "male",
    public_key: "bfb1bf43d3c6951923b2ab348593c7ae34fc5dcac757d0785f57c3f82ca43a741c709fe4a58053eb676b6f82fff247805808796892acec408c279af7aa93e54e"
};
let catTo = {
    private_key: "14e7e34f77749217477a6c36ddff3f5b5f217c67782dd7cc4ec4c0f9997f968b",
    address: "0x88fd5e01078629cc194c933d9631b9448fe10b1d",
    type: "rich cat",
    balance: "1000000000000000000000000000000",
    name: "Bear",
    gender: "male",
    public_key: "1ba2bfbd7f4c9251c4cd88ce31fbef66f0d6855a98fafff8fbfe3b6bcb37d26bdbf31adba8030b56264e4336824023badb4861cd15293b7d124168ddd15763aa"
};

sendMoneyFromTo( w3, catFrom.private_key, catFrom.name, catFrom.address, catTo.name, catTo.address, function() {
    log.write( cc.success( "Money sent, exiting..." ) + "\n" );
    process.exit( 0 );
} );



