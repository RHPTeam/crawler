/* eslint-disable no-unused-vars */
module.exports = ( cookie ) => {
  return cookie.split( "\n" ).map( ( _e ) => {
    const objResult = {};

    cookie
      .split( ";" )
      .filter( ( e ) => {
        if ( e.trim().length > 0 ) {
          return e;
        }
      } )
      .map( ( e ) => {
        objResult[ e.split( "=" )[ 0 ].trim() ] = e.split( "=" )[ 1 ].trim();
      } );
    return objResult;
  } );
};
