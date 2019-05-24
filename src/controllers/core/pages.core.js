/* eslint-disable prefer-arrow-callback */
/* eslint-disable strict */
const request = require( "request" ),
  { findSubString } = require( "../../helpers/utils/functions/string" ),
  { getDtsgFB } = require( "../../helpers/utils/facebook/dtsgfb" ),
  { pages } = require( "../../configs/crawl" ),
  handle = ( { cookie, agent, token } ) => {
    return new Promise( ( resolve ) => {
      const option = {
        "method": "POST",
        "url": pages,
        "headers": {
          "Cookie": cookie,
          "User-Agent": agent
        },
        "form": {
          "__user": findSubString( cookie, "c_user=", ";" ),
          "__a": "1",
          "fb_dtsg": token
        }
      };

      request( option, function( _err, _res, body ) {
        if ( body.includes( "https://www.facebook.com/login" ) ) {
          resolve( {
            "error": {
              "code": 405,
              "text": "Cookie hết hạn, thử lại bằng cách cập nhật cookie mới!"
            },
            "results": []
          } );
        } else {
          let bodyJson = JSON.parse( findSubString( body, "for (;;);" ) );

          resolve( {
            "error": {
              "code": 200,
              "text": null
            },
            "results": bodyJson.payload.items[ 0 ].sections
          } );
        }
      } );
    } );
  };

module.exports = async ( { cookie, agent } ) => {
  // Get token which can next do anymonre
  const token = await getDtsgFB( { cookie, agent } );

  // Check conditional request
  if ( token === false ) {
    return {
      "error": {
        "code": 405,
        "text": "Cookie hết hạn, thử lại bằng cách cập nhật cookie mới!"
      },
      "results": []
    };
  }
  return await handle( { cookie, agent, token } );
};
