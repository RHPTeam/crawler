/* eslint-disable strict */
const request = require( "request" ),
  { findSubString } = require( "../functions/string" );

module.exports = {
  "getDtsgFB": ( { cookie, agent } ) => {
    return new Promise( ( resolve ) => {
      const option = {
        "method": "GET",
        "url": "https://www.facebook.com",
        "headers": {
          "Cookie": cookie,
          "User-Agent": agent,
          "Accept": "/",
          "Connection": "keep-alive"
        }
      };

      request( option, ( err, res, body ) => {
        if ( !err && res.statusCode === 200 ) {
          if ( body.includes( "https://www.facebook.com/login" ) ) {
            resolve( false );
          } else {
            resolve( findSubString( body, 'name="fb_dtsg" value="', '"' ) );
          }
        } else {
          resolve( {
            "error": {
              "code": 404,
              "text": "Link crawl đã bị thay đổi hoặc thất bại trong khi request!"
            },
            "results": []
          } );
        }
      } );
    } );
  },
  "getFullDtsgFB": ( { cookie, agent } ) => {
    return new Promise( ( resolve ) => {
      const option = {
        "method": "GET",
        "url": "https://www.facebook.com",
        "headers": {
          "Cookie": cookie,
          "User-Agent": agent,
          "Accept": "/",
          "Connection": "keep-alive"
        }
      };

      request( option, ( err, res, body ) => {
        if ( !err && res.statusCode === 200 ) {
          if ( body.includes( "https://www.facebook.com/login" ) ) {
            resolve( false );
          } else {
            resolve( {
              "value": findSubString( body, 'name="fb_dtsg" value="', '"' ),
              "privacy": findSubString( body, 'name="privacyx" value="', '"' )
            } );
          }
        } else {
          resolve( {
            "error": {
              "code": 404,
              "text": "Link crawl đã bị thay đổi hoặc thất bại trong khi request!"
            },
            "results": []
          } );
        }
      } );
    } );
  },
  "getDtsgAg": ( { cookie, agent } ) => {
    return new Promise( ( resolve ) => {
      const option = {
        "method": "GET",
        "url": "https://www.facebook.com",
        "headers": {
          "Cookie": cookie,
          "User-Agent": agent,
          "Accept": "/",
          "Connection": "keep-alive"
        }
      };

      request( option, ( err, res, body ) => {
        if ( !err && res.statusCode === 200 ) {
          if ( body.includes( "https://www.facebook.com/login" ) ) {
            resolve( false );
          } else {
            resolve( findSubString( body, '"async_get_token":"', '"' ) );
          }
        } else {
          resolve( {
            "error": {
              "code": 404,
              "text": "Link crawl đã bị thay đổi hoặc thất bại trong khi request!"
            },
            "results": []
          } );
        }
      } );
    } );
  }
};
