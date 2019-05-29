const bodyParser = require( "body-parser" );
const fs = require( "fs" );
const cors = require( "cors" );
const http = require( "http" );
const https = require( "https" );
const express = require( "express" ),
  app = express(),
  logger = require( "morgan" );
const api = require( "./src/routes" );

let server = null, io = null;

if ( process.env.APP_ENV === "production" ) {
  const options = {
    "pfx": fs.readFileSync( process.env.HTTPS_URL ),
    "passphrase": process.env.HTTPS_PASSWORD
  };

  server = https.createServer( options, app );
} else {
  server = http.createServer( app );
}

app.set( "port", process.env.PORT_BASE );

app.use( cors() );
app.use( bodyParser.json( { "limit": "500MB", "extended": true } ) );
app.use( bodyParser.urlencoded( { "limit": "500MB", "extended": true } ) );
app.use( logger( "tiny" ) );
// file image local
app.use( "/uploads", express.static( "uploads" ) );
app.use( "/api/v1", api );
app.use( "/", ( req, res ) => res.send( "API running!" ) );

// listen a port
server.listen( process.env.PORT_BASE, () => {
  console.log( `Api server running on ${process.env.APP_URL}:${process.env.PORT_BASE}` );
} );

require( "./src/microservices/crawler" );


module.exports = app;
