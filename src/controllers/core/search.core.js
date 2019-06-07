/* eslint-disable strict */
// eslint-disable-next-line no-unused-vars
const htmlDecode = require( "ent/decode" ),
  cheerio = require( "cheerio" ),
  request = require( "request" ),
  { post, postsSearch } = require( "../../configs/crawl" ),
  { getDtsgAg } = require( "../../helpers/utils/facebook/dtsgfb" ),
  { findSubString } = require( "../../helpers/utils/functions/string" ),
  getPost = ( { cookie, agent, id } ) => {
    return new Promise( ( resolve ) => {
      const option = {
        "method": "GET",
        "url": post( id ),
        "headers": {
          "User-Agent": agent,
          "Cookie": cookie
        }
      };

      request( option, ( err, res, body ) => {
        if ( !err && res.statusCode === 200 ) {

          let $ = cheerio.load( body ),
            pageCase = $( "div.permalinkPost" ).find( "div.userContentWrapper" ),
            photos = [];

          // other
          if ( pageCase.length > 0 ) {
            $( "div.permalinkPost" )
              .find( "div.userContentWrapper" )
              .find( "a[rel*='theater']" )
              .each( function() {
                photos.push( $( this ).attr( "data-ploi" ) );
              } );

            resolve( {
              "error": {
                "code": 200,
                "text": null
              },
              "results": {
                "content": htmlDecode( $( "div.permalinkPost" )
                  .find( "div.userContentWrapper" )
                  .find( "div.userContent" )
                  .html().replace( /(<br \/>)|(<br>)/gm, "\n" ).replace( /(<\/p>)|(<\/div>)/gm, "\n" ).replace( /(<([^>]+)>)/gm, "" ) ),
                "photos": photos.filter( ( photo ) => photo !== undefined )
              }
            } );
          }

          // profile
          $( "div.hidden_elem" )
            .find( "code" )
            .each( function() {
              let tempDOM = $( this ).html(),
                tempText = findSubString( tempDOM, "<!--", "-->" );

              if ( tempText.includes( 'role="feed"' ) ) {
                $ = cheerio.load( tempText, { "decodeEntities": false } );
                $( "div" )
                  .find( "div.userContentWrapper" )
                  .find( "a[rel*='theater']" )
                  .each( function() {
                    photos.push( $( this ).attr( "data-ploi" ) );
                  } );
              }
            } );

          resolve( {
            "error": {
              "code": 200,
              "text": null
            },
            "results": {
              "content": htmlDecode( $( "div" )
                .find( "div.userContent" )
                .html().replace( /(<br \/>)|(<br>)/gm, "\n" ).replace( /(<\/p>)|(<\/div>)/gm, "\n" ).replace( /(<([^>]+)>)/gm, "" ) ),
              "photos": photos.filter( ( photo ) => photo !== undefined )
            }
          } );

        }

        resolve( {
          "error": {
            "code": 404,
            "text": "Link crawl đã bị thay đổi hoặc thất bại trong khi request!"
          },
          "results": []
        } );
      } );
    } );
  },
  getAllPostBySearch = ( { cookie, agent, url } ) => {
    return new Promise( ( resolve ) => {
      const option = {
        "method": "GET",
        "url": url,
        "headers": {
          "User-Agent": agent,
          "Cookie": cookie
        }
      };

      request( option, async ( err, res, body ) => {
        if ( !err && res.statusCode === 200 ) {
          let $ = cheerio.load( body ),
            results = [];

          $( "div[data-module-result-type='story']" )
            .children( "div" )
            .each( async function() {
              let postID = null,
                like = 0,
                share = 0,
                // eslint-disable-next-line no-unused-vars
                postInfo = null,
                pointID = $( this )
                  .find( "a[data-sigil='feed-ufi-trigger']" )
                  .attr( "href" );

              // ID
              if ( pointID !== undefined ) {
                postID = findSubString( pointID, "&id=", "&" );

                if ( pointID.includes( "story_fbid=" ) ) {
                  postID = findSubString( pointID, "story_fbid=", "&" );
                } else if ( pointID.includes( "?fbid=" ) ) {
                  postID = findSubString( pointID, "?fbid=", "&" );
                }
              }

              // Like
              like = $( this )
                .find(
                  "div[data-sigil='reactions-sentence-container'] > div:nth-child(2)"
                )
                .text();

              // Comment
              share = $( this ).find( "span[data-sigil='comments-token']" ).next().text();

              if ( share === undefined ) {
                share = "0";
              }

              results.push( {
                "postID": postID,
                "like": like,
                "share": share
              } );

              if ( postID === null || like === undefined ) {
                results.pop();
              }
            } );

          results = await Promise.all( results.map( async ( result ) => {
            postInfo = await getPost( { cookie, agent, "id": result.postID } );

            return {
              "postID": result.postID,
              "like": result.like,
              "share": result.share,
              "content": postInfo.results.content,
              "photos": postInfo.results.photos
            };
          } ) );

          resolve( {
            "error": {
              "code": 200,
              "text": null
            },
            "results": results
          } );
        }

        resolve( {
          "error": {
            "code": 404,
            "text": "Link crawl đã bị thay đổi hoặc thất bại trong khi request!"
          },
          "results": []
        } );
      } );
    } );
  };

module.exports = {
  "searchPost": async ( { keyword, number, cookie, agent } ) => {
    let token = await getDtsgAg( { cookie, agent } ),
      results = [],
      page = 0;

    if ( token === false ) {
      return {
        "error": {
          "code": 405,
          "text": "Cookie hết hạn, thử lại bằng cách cập nhật cookie mới!"
        },
        "results": []
      };
    }

    // Check number to generate page to post facebook
    if ( number % 12 === 0 ) {
      page = number / 12;
    } else {
      page = parseInt( number / 12 + 1 );
    }

    // Get post by page with size = 12
    for ( let i = 1; i <= page; i++ ) {
      const url = postsSearch( keyword, token, i ),
        data = await getAllPostBySearch( { cookie, agent, url } );

      results = results.concat( data.results );
    }

    return results;
  }
};
