const jsonResponse = require( "../../configs/response" );

export default function permit( ...allowed ) {
  const isAllowed = ( role ) => allowed.indexOf( role ) > -1;

  return ( req, res, next ) => {
    if ( req.user && isAllowed( req.user.role ) ) {
      next();
    } else {
      res.status( 403 ).json( jsonResponse( "Bạn không có quyền truy cập!", null ) );
    }
  };
}
