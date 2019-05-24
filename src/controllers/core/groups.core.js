
/* eslint-disable prefer-arrow-callback */
/* eslint-disable strict */
const request = require( "request" ),
  { linkgraphfacebook } = require( "../../configs/crawl" ),
  { getDtsgFB } = require( "../../helpers/utils/facebook/dtsgfb" ),
  { findSubString } = require( "../../helpers/utils/functions/string" ),
  handle = async ( { cookie, agent, token } ) => {
    return new Promise( ( resolve ) => {
      const option = {
        "method": "POST",
        "url": linkgraphfacebook,
        "headers": {
          "User-Agent": agent,
          "Cookie": cookie
        },
        "form": {
          "__a": "1",
          "__user": findSubString( cookie, "c_user=", ";" ),
          "av": findSubString( cookie, "c_user=", ";" ),
          "fb_dtsg": token,
          "variables": JSON.stringify( { "count": 10000 } ),
          "doc_id": 2034588956654971
        }
      };

      request( option, async function( err, res, body ) {
        if ( !err && res.statusCode === 200 ) {
          // Check conditional url
          let bodyJson = JSON.parse( body ),
            groupListNode = bodyJson.data.viewer.groups_tab.badged_group_list.edges;

          groupListNode = await Promise.all( groupListNode.map( ( node ) => {
            return {
              "groupId": node.node.id,
              "name": node.node.name,
              "profile_picture": node.node.profile_picture.uri
            };
          } ) );

          return resolve( {
            "error": {
              "code": 200,
              "text": null
            },
            "results": groupListNode
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
