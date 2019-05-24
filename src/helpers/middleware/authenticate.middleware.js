const jwt = require( "jsonwebtoken" );

const jsonResponse = require( "../../configs/response" );
const Account = require( "../../models/Account.model" );

/**
 *  The Auth Checker middleware function.
 */

module.exports = ( req, res, next ) => {
  if ( !req.headers.authorization ) {
    return res
      .status( 404 )
      .json( jsonResponse( "Cookie của bạn không được tìm thấy!", null ) );
  }
  const token = req.headers.authorization;

  return jwt.verify( token, process.env.APP_KEY, ( err, decoded ) => {
    if ( err ) {
      return res.status( 401 ).end();
    }
    const email = decoded.sub;

    return Account.findOne( { "email": email }, ( userErr, user ) => {
      if ( userErr || !user ) {
        return res.status( 401 ).end();
      }
      return next();
    } );
  } );
};
