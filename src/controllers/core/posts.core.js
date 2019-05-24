/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
/* eslint-disable strict */
const cheerio = require( "cheerio" ),
  fs = require( "fs" ),
  request = require( "request" ),
  { post, mpost } = require( "../../configs/crawl" ),
  { getDtsgFB, getFullDtsgFB } = require( "../../helpers/utils/facebook/dtsgfb" ),
  {
    createNewFeed,
    getPreviewScrape,
    handleImageUpload,
    uploadImage
  } = require( "../../helpers/utils/facebook/facebook" ),
  { findSubString } = require( "../../helpers/utils/functions/string" ),
  getPost = ( { cookie, agent, url, id } ) => {
    return new Promise( ( resolve ) => {
      const option = {
        "method": "GET",
        "url": url,
        "headers": {
          "User-Agent": agent,
          "Cookie": cookie
        }
      };

      /**
       * When id of post appear effect background text. Handle duplicate text.
       * When id of post is new member of group. Handle get like
       */

      request( option, ( err, res, body ) => {
        if ( !err && res.statusCode === 200 ) {
          let $ = cheerio.load( body, { "decodeEntities": false } ),
            pageCase = $( "div.permalinkPost" ).find( "div.userContentWrapper" ),
            images = [];

          if ( url === post( id ) ) {
            // Check two case: profile, page
            if ( pageCase.length > 0 ) {
              // Get images in post ( Note: if post have one images, system will navigation undefined to get images link full ( current version has only get max which is 5 images )
              $( "div.permalinkPost" )
                .find( "div.userContentWrapper" )
                .find( "a[rel*='theater']" )
                .each( function() {
                  images.push( $( this ).attr( "data-ploi" ) );
                } );
              return resolve( {
                "results": {
                  "content": $( "div.permalinkPost" )
                    .find( "div.userContentWrapper" )
                    .find( "div.userContent" )
                    .html(),
                  "text": $( "div.permalinkPost" )
                    .find( "div.userContentWrapper" )
                    .find( "div.userContent" )
                    .text(),
                  "images": images.filter( ( image ) => image !== undefined )
                },
                "next": true
              } );
            }
            // Check two case: profile
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
                      images.push( $( this ).attr( "data-ploi" ) );
                    } );
                }
              } );
            return resolve( {
              "results": {
                "content": $( "div" )
                  .find( "div.userContent" )
                  .html(),
                "text": $( "div" )
                  .find( "div.userContent" )
                  .text(),
                "images": images.filter( ( image ) => image !== undefined )
              },
              "next": true
            } );
          }
          // Get like and share by m.facebook.com ( Note: When use browser facebook.com which must get ajax link )
          // Check if DOM change it
          $( "div.hidden_elem" )
            .find( "code" )
            .each( function() {
              let tempDOM = $( this ).html(),
                tempText = findSubString( tempDOM, "<!--", "-->" );

              if ( tempText.includes( 'data-sigil="m-mentions-expand"' ) ) {
                $ = cheerio.load( tempText, { "decodeEntities": false } );
              }
            } );

          return resolve( {
            "results": {
              "like": parseInt(
                $( "div" )
                  .find( "div[id*='sentence_']" )
                  .find( "div[aria-label]" )
                  .text()
              ),
              "share": parseInt(
                $( "div" )
                  .find( "span[data-sigil='feed-ufi-sharers']" )
                  .text()
                  .replace( /\D+/g, "" )
              )
            },
            "next": false
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

module.exports = {
  "createPost": async ( { cookie, agent, feed } ) => {
    const tokenFull = await getFullDtsgFB( { cookie, agent } ),
      token = tokenFull.value,
      privacy = tokenFull.privacy,
      feedObject = {};

    // Check if user upload image or paste link image
    if ( feed.photos ) {
      // Case 01: When user post images to facebook
      const sources = feed.photos.map( async ( image ) => {
        // Assign variables when handle link photos
        let photoID = null;

        // Check source image extension
        const path = await handleImageUpload( image );

        // Check download fail
        if ( path.errors.code === 1023 ) {
          return;
        }
        // Check write file issues
        if ( path.errors.code === 1024 ) {
          return;
        }

        // Assign variable for "av" author vendor | 0: timeline, 1: group, 2: page
        if ( feed.location.type === 0 || feed.location.type === 1 ) {
          feedObject.privacy = findSubString( cookie, "c_user=", ";" );
        } else if ( feed.location.type === 2 ) {
          feedObject.privacy = feed.location.value;
        }

        // Get photo ID from facebook return by crawl
        photoID = await uploadImage( {
          cookie,
          agent,
          token,
          "path": path.results,
          "av": feedObject.privacy
        } );

        await fs.unlinkSync( path.results );
        return photoID;
      } );

      feedObject.photos = await Promise.all( sources );
    }

    // Check if user want scrape / share something
    if ( feed.scrape ) {
      // Check case if user use link of youtube which system will redirect and make full thumbnail
      if ( feed.scrape.includes( "youtube.com" ) ) {
        feed.scrape = feed.scrape.replace( "youtube.com", "youtubefb.com" );
      }
      const resultPreviewScrape = await getPreviewScrape( {
        cookie,
        agent,
        token,
        "scrape": feed.scrape
      } );

      feedObject.scrape = resultPreviewScrape.results;
    }

    // Check if user change privacy of feed
    feedObject.privacy = privacy;

    // Pass data from original object of client
    feedObject.activity = feed.activity;
    feedObject.color = feed.color;
    feedObject.content = feed.content;
    feedObject.location = feed.location;
    feedObject.place = feed.place;
    feedObject.tags = feed.tags;

    // Upload post to facebook
    return await createNewFeed( {
      cookie,
      agent,
      token,
      "feed": feedObject
    } );
  },
  "getPost": async ( { cookie, agent, id } ) => {
    let token = await getDtsgFB( { cookie, agent } ),
      results = [],
      url = post( id ),
      getInfoPost = async ( { cookie, agent } ) => {
        const data = await getPost( { cookie, agent, url, id } );

        results = results.concat( data.results );
        if ( data.next === true ) {
          url = mpost( id );
          return await getInfoPost( { cookie, agent } );
        }
        return {
          "error": {
            "code": 200,
            "text": null
          },
          "data": {
            "id": id,
            "content": results[ 0 ].content,
            "text": results[ 0 ].text,
            "images": results[ 0 ].images,
            "like": results[ 1 ].like,
            "share": results[ 1 ].share
          }
        };
      };

    if ( token === false ) {
      return {
        "error": {
          "code": 405,
          "text": "Cookie hết hạn, thử lại bằng cách cập nhật cookie mới!"
        },
        "results": []
      };
    }
    return await getInfoPost( { cookie, agent } );
  }
};
