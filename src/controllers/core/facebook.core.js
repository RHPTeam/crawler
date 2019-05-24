const {
  linkGetActionTypeLoader,
  linkGetItemActionTypeLoader,
  linkGetAllFriends,
  linkSearchPlaces
} = require( "../../configs/crawl" );
const { getDtsgAg } = require( "../../helpers/utils/facebook/dtsgfb" );
const { findSubString } = require( "../../helpers/utils/functions/string" );

const cheerio = require( "cheerio" ),
  request = require( "request" );

module.exports = {
  "checkLogin": ( { cookie, agent } ) => {
    return new Promise( ( resolve ) => {
      const option = {
        "method": "GET",
        "url": "https://www.facebook.com",
        "headers": {
          "Cookie": cookie,
          "User-Agent": agent
        }
      };

      request( option, ( err, res, body ) => {
        if ( !err && res.statusCode === 200 ) {
          if ( body.includes( "https://www.facebook.com/login" ) ) {
            resolve( {
              "error": {
                "code": 405,
                "text": "Cookie hết hạn, thử lại bằng cách cập nhật cookie mới!"
              },
              "results": []
            } );
          } else {
            resolve( {
              "error": {
                "code": 200,
                "text": null
              },
              "results": null
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
  "getAllActionTypeLoader": ( { cookie, agent } ) => {
    return new Promise( async ( resolve ) => {
      const token = await getDtsgAg( { cookie, agent } ),
        option = {
          "method": "GET",
          "url": linkGetActionTypeLoader(
            token,
            findSubString( cookie, "c_user=", ";" )
          ),
          "headers": {
            "Cookie": cookie,
            "User-Agent": agent
          }
        };

      request( option, ( err, res, body ) => {
        if ( !err && res.statusCode === 200 ) {
          const bodyJson = JSON.parse( body.replace( "for (;;);", "" ) );

          return resolve( {
            "error": {
              "code": 200,
              "text": null
            },
            "results": bodyJson.payload.entries
          } );
        }
        return resolve( {
          "error": {
            "code": 404,
            "text": "Link crawl đã bị thay đổi hoặc thất bại trong khi request!"
          },
          "results": []
        } );
      } );
    } );
  },
  "getAllItemActionTypeLoader": ( { cookie, agent, item } ) => {
    return new Promise( async ( resolve ) => {
      const token = await getDtsgAg( { cookie, agent } ),
        option = {
          "method": "GET",
          "url": linkGetItemActionTypeLoader(
            token,
            findSubString( cookie, "c_user=", ";" ),
            item
          ),
          "headers": {
            "Cookie": cookie,
            "User-Agent": agent
          }
        };

      request( option, ( err, res, body ) => {
        if ( !err && res.statusCode === 200 ) {
          const bodyJson = JSON.parse( body.replace( "for (;;);", "" ) );

          return resolve( {
            "error": {
              "code": 200,
              "text": null
            },
            "results": bodyJson.payload.entries
          } );
        }
        return resolve( {
          "error": {
            "code": 404,
            "text": "Link crawl đã bị thay đổi hoặc thất bại trong khi request!"
          },
          "results": []
        } );
      } );
    } );
  },
  "getAllFriends": ( { cookie, agent } ) => {
    return new Promise( async ( resolve ) => {
      const token = await getDtsgAg( { cookie, agent } ),
        option = {
          "method": "GET",
          "url": linkGetAllFriends( token, findSubString( cookie, "c_user=", ";" ) ),
          "headers": {
            "Cookie": cookie,
            "User-Agent": agent
          }
        };

      request( option, ( err, res, body ) => {
        if ( !err && res.statusCode === 200 ) {
          const bodyJson = JSON.parse( body.replace( "for (;;);", "" ) );

          return resolve( {
            "error": {
              "code": 200,
              "text": null
            },
            "results": bodyJson.payload.entries
          } );
        }
        return resolve( {
          "error": {
            "code": 404,
            "text": "Link crawl đã bị thay đổi hoặc thất bại trong khi request!"
          },
          "results": []
        } );
      } );
    } );
  },
  "getUserInfo": ( { cookie, agent } ) => {
    return new Promise( ( resolve ) => {
      const option = {
        "method": "GET",
        "url": `https://m.facebook.com/${findSubString( cookie, "c_user=", ";" )}`,
        "headers": {
          "User-Agent": agent,
          "Cookie": cookie
        }
      };

      request( option, ( err, res, body ) => {
        if ( !err && res.statusCode === 200 ) {
          const $ = cheerio.load( body );

          if ( body.includes( "https://www.facebook.com/login" ) ) {
            return resolve( {
              "error": {
                "code": 405,
                "text": "Cookie hết hạn, thử lại bằng cách cập nhật cookie mới!"
              },
              "results": []
            } );
          }
          return resolve( {
            "error": {
              "code": 200,
              "text": null
            },
            "results": {
              "id": findSubString( cookie, "c_user=", ";" ),
              "fullName": $( "title" ).text(),
              "thumbSrc": `http://graph.facebook.com/${findSubString(
                cookie,
                "c_user=",
                ";"
              )}/picture?type=large`,
              "profileUrl": `https://www.facebook.com/${findSubString(
                cookie,
                "c_user=",
                ";"
              )}`
            }
          } );
        }
        return resolve( {
          "error": {
            "code": 404,
            "text": "Link crawl đã bị thay đổi hoặc thất bại trong khi request!"
          },
          "results": []
        } );
      } );
    } );
  },
  "searchPlaces": ( { cookie, agent, keyword, number } ) => {
    return new Promise( async ( resolve ) => {
      const token = await getDtsgAg( { cookie, agent } ),
        option = {
          "method": "GET",
          "url": linkSearchPlaces(
            findSubString( cookie, "c_user=", ";" ),
            token,
            keyword,
            number
          ),
          "headers": {
            "Cookie": cookie,
            "User-Agent": agent
          }
        };

      request( option, ( err, res, body ) => {
        if ( !err && res.statusCode === 200 ) {
          const bodyJson = JSON.parse( body.replace( "for (;;);", "" ) );

          return resolve( {
            "error": {
              "code": 200,
              "text": null
            },
            "results": bodyJson.payload.entries
          } );
        }
        return resolve( {
          "error": {
            "code": 404,
            "text": "Link crawl đã bị thay đổi hoặc thất bại trong khi request!"
          },
          "results": []
        } );
      } );
    } );
  }
};
