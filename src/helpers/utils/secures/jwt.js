const jwt = require( "jsonwebtoken" );

module.exports = ( res, authorization ) => {
  return jwt.verify( authorization, process.env.APP_KEY, ( err, decoded ) => {
    if ( err ) {
      return res.status( 401 ).end();
    }
    return decoded.sub;
  } );
};
