/* eslint-disable no-nested-ternary */
const {
    linkGetIdPost,
    linkGetPreviewScrape,
    linkUploadImage,
    linkUploadFeed,
    formDataPost,
    scrapeSharePost
  } = require( "../../../configs/crawl" ),
  {
    callbackGetIdPostSuccess,
    downloadImageFail,
    getIdPostSuccess,
    handleImageSuccess,
    requestGetIdPost,
    requestGetPreviewScrapeFail,
    requestMissInfo,
    requestNewFeedFail,
    writeFileImageFail
  } = require( "../../../configs/errors" ),
  {
    converSourceUnix,
    convertUnicodeToCharacter,
    findSubString
  } = require( "../functions/string" ),
  fs = require( "fs" ),
  request = require( "request" ),
  download = require( "download" ),
  randomstring = require( "randomstring" ),
  generateObjectVariablesFacebook = ( { cookie, feed } ) => {
    if ( feed.color === undefined ) {
      delete feed.color;
    }
    const variables = {
      "client_mutation_id": "825c85ea-68e2-436e-9f7c-ed4b514fec3a",
      "actor_id": findSubString( cookie, "c_user=", ";" ),
      "input": {
        "actor_id": findSubString( cookie, "c_user=", ";" ),
        "client_mutation_id": "f83d7659-623a-474b-9a7b-1bf4ed66c60f",
        "source": "WWW",
        "audience": { "web_privacyx": "300645083384735" },
        "message": { "text": feed.content, "ranges": [] },
        "with_tags_ids": [],
        "multilingual_translations": [],
        "camera_post_context": {
          "deduplication_id": "ed7e5149-a986-43db-9d02-b158174f2ab8",
          "source": "composer"
        },
        "composer_entry_time": 154,
        "composer_session_events_log": { "composition_duration": 128 },
        "direct_share_status": "NOT_SHARED",
        "sponsor_relationship": "WITH",
        "web_graphml_migration_params": {
          "is_also_posting_video_to_feed": false,
          "target_type": "feed",
          "xhpc_composerid": "rc.js_xc",
          "xhpc_context": "profile",
          "xhpc_publish_type": "FEED_INSERT"
        }
      }
    };

    // Check location post new feed on facebook (Include: Timeline, Group, Page)
    if ( feed.location ) {
      // Check timeline
      if ( feed.location.type === 0 ) {
        // Do something
      }
      // Check group
      if ( feed.location.type === 1 ) {
        variables.input.audience = { "to_id": feed.location.value };
      }
      // Check page
      if ( feed.location.type === 2 ) {
        // eslint-disable-next-line camelcase
        variables.input.actor_id = feed.location.value;
        variables.input.audience = { "privacy": { "base_state": "EVERYONE" } };
      }
    }

    // Check if feed use photo
    if ( feed.photos && feed.photos.length > 0 ) {
      variables.input.attachments = feed.photos.map( ( photo ) => {
        return {
          "photo": {
            "id": photo,
            "tags": []
          }
        };
      } );
    }

    // Check scrape which add attachment scrape_link
    if ( feed.scrape ) {
      if ( feed.scrape.link.includes( "facebook.com" ) ) {
        variables.input.attachments = [
          {
            "link": {
              "share_scrape_data": JSON.stringify( {
                "share_type": feed.scrape.type,
                "share_params": feed.scrape.params,
                "shared_from_post_id": feed.scrape.shared_from_post_id
              } )
            }
          }
        ];
      } else {
        variables.input.attachments = [
          {
            "link": {
              "share_scrape_data": JSON.stringify( {
                "share_type": scrapeSharePost.youtubelink,
                "share_params": {
                  "urlInfo": {
                    "canonical": feed.scrape.link,
                    "final": feed.scrape.link,
                    "user": feed.scrape.link
                  },
                  "favicon":
                    "https://www.youtube.com/yts/img/favicon_144-vfliLAfaB.png",
                  "external_author": feed.scrape.external_author,
                  "iframe": [],
                  "title": feed.scrape.title,
                  "summary": feed.scrape.summary,
                  "images_sorted_by_dom": [ feed.scrape.thumbnail ],
                  "ranked_images": {
                    "images": [ feed.scrape.thumbnail ],
                    "ranking_model_version": 11,
                    "specified_og": true
                  },
                  "medium": 106,
                  "url": feed.scrape.link,
                  "global_share_id": feed.scrape.global_share_id,
                  "url_scrape_id": feed.scrape.url_scrape_id,
                  "hmac": feed.scrape.hmac
                }
              } )
            }
          }
        ];
      }
    }

    // Check if feed use text format
    if ( feed.color ) {
      // eslint-disable-next-line camelcase
      variables.input.text_format_preset_id = feed.color;
    }

    // Check if feed use tags
    if ( feed.tags ) {
      // eslint-disable-next-line camelcase
      variables.input.with_tags_ids = feed.tags;
    }

    // Check if feed use check-in
    if ( feed.place ) {
      // eslint-disable-next-line camelcase
      variables.input.explicit_place_id = feed.place;
    }

    // Check if feed use activity
    if ( feed.activity ) {
      // eslint-disable-next-line camelcase
      variables.input.inline_activities = [
        {
          "taggable_activity_id": feed.activity.type,
          "object_id": feed.activity.id,
          "object_text": ""
        }
      ];
    }

    return variables;
  },
  getIdPostFacebook = ( { cookie, agent, token, location, privacy, type, storyID } ) => {
    return new Promise( ( resolve ) => {
      const option = {
        "method": "POST",
        "url": linkGetIdPost( findSubString( cookie, "c_user=", ";" ) ),
        "headers": {
          "Cookie": cookie,
          "User-Agent": agent,
          "Accept": "/",
          "Connection": "keep-alive"
        },
        "form": {
          "story_id": storyID,
          "__user": findSubString( cookie, "c_user=", ";" ),
          "__a": "1",
          "fb_dtsg": token,
          "data[web_graphml_migration_params][xhpc_composerid]":
            "rc.u_ps_fetchstream_3_4_1",
          "data[is_local_dev_platform_app_instance]": "false",
          "data[is_page_recommendation]": "false"
        }
      };

      // Change audience case: timeline, group, fanpage
      if ( type === 0 ) {
        option.form[ "data[audience][web_privacyx]" ] = privacy;
      } else if ( type === 1 ) {
        option.form[ "data[audience][to_id]" ] = location.value;
      } else if ( type === 2 ) {
        option.form[ "data[audience][privacy][base_state]" ] = "everyone";
      }

      request( option, ( err, res, body ) => {
        if ( !err && res.statusCode === 200 ) {
          let postID = null;

          if ( type === 0 ) {
            postID = findSubString( body, '"privacy_fbid":"', '"' );
          } else if ( type === 1 ) {
            postID = findSubString( body, "post_id=", "&" );
          } else if ( type === 2 ) {
            postID = findSubString( body, '"contentID":"', '"' );
          }
          return resolve( {
            "errors": getIdPostSuccess,
            "results": {
              "postID": postID
            }
          } );
        }
        return resolve( {
          "errors": requestGetIdPost,
          "results": null
        } );
      } );
    } );
  };

module.exports = {
  "createNewFeed": ( { cookie, agent, token, feed } ) => {
    return new Promise( ( resolve ) => {
      const option = {
        "method": "POST",
        "url": linkUploadFeed,
        "headers": {
          "Cookie": cookie,
          "User-Agent": agent,
          "Accept": "/",
          "Connection": "keep-alive"
        },
        "form": {
          "variables": JSON.stringify(
            generateObjectVariablesFacebook( { cookie, feed } )
          ),
          "__user": findSubString( cookie, "c_user=", ";" ),
          "fb_dtsg": token,
          "__a": "1"
        }
      };

      console.log( option );

      request( option, async ( err, res, body ) => {
        if ( !err && res.statusCode === 200 ) {
          const bodyJson = JSON.parse( body.replace( "for (;;);", "" ) ).payload;

          if ( bodyJson.errors ) {
            return resolve( {
              "errors": {
                "code": 8188,
                "text": bodyJson.errors[ 0 ].description
              },
              "results": null
            } );
          } else if ( bodyJson.data.story_create ) {
            // Get ID post from id hash preview of facebook
            const result = await getIdPostFacebook( {
              cookie,
              agent,
              token,
              "location": feed.location,
              "privacy": feed.privacy,
              "type": feed.location.type,
              "storyID": bodyJson.data.story_create.story.id
            } );

            if ( result.errors.code !== 200 ) {
              return resolve( {
                "error": {
                  "code": result.errors.code,
                  "text": result.errors.text
                },
                "results": null
              } );
            }

            return resolve( {
              "error": callbackGetIdPostSuccess,
              "results": {
                "postID": result.results.postID,
                "type": feed.location.type === 0 ? "timeline" : feed.location.type === 1 ? "group" : feed.location.type === 2 ? "page" : null
              }
            } );
          } else if ( bodyJson === undefined ) {
            return resolve( {
              "errors": requestMissInfo,
              "results": null
            } );
          }
        }
        return resolve( {
          "errors": requestNewFeedFail,
          "results": null
        } );
      } );
    } );
  },
  "getPreviewScrape": ( { cookie, agent, token, scrape } ) => {
    return new Promise( ( resolve ) => {
      const option = {
        "method": "POST",
        "url": linkGetPreviewScrape(
          findSubString( cookie, "c_user=", ";" ),
          scrape
        ),
        "headers": {
          "Cookie": cookie,
          "User-Agent": agent,
          "Accept": "/",
          "Connection": "keep-alive",
          "Content-type": "application/x-www-form-urlencoded"
        },
        "form": {
          "fb_dtsg": token,
          "__user": findSubString( cookie, "c_user=", ";" ),
          "__a": "1"
        }
      };

      request( option, async ( err, res, body ) => {
        if ( !err && res.statusCode === 200 ) {
          if ( scrape.includes( "facebook.com" ) ) {
            const attachmentConfigText = findSubString(
              body,
              '"attachmentConfig":{',
              "},"
            );

            return resolve( {
              "errors": {
                "code": 200,
                "text": "Lấy thông tin từ link facebook chia sẻ thành công!"
              },
              "results": {
                "link": scrape,
                "type": findSubString( attachmentConfigText, '"type":', "," ),
                "params": findSubString(
                  attachmentConfigText,
                  '"params":[',
                  "],"
                ).split( "," ),
                "shared_from_post_id": findSubString(
                  attachmentConfigText,
                  '"shared_from_post_id":'
                )
              }
            } );
          }
          return resolve( {
            "errors": {
              "code": 200,
              "text": "Lấy thông tin từ link chia sẻ thành công!"
            },
            "results": {
              "link": scrape,
              "title": convertUnicodeToCharacter(
                findSubString( body, '"title":"', '"' )
              ),
              "summary": convertUnicodeToCharacter(
                findSubString( body, '"summary":"', '"' )
              ).replace( /\\\//gi, "/" ),
              "external_author": findSubString(
                body,
                '"external_author":"',
                '"'
              ).replace( /\\\//gi, "/" ),
              "thumbnail": findSubString( body, '"images":["', '"' ).replace(
                /\\\//gi,
                "/"
              ),
              "global_share_id": findSubString( body, '"global_share_id":', "," ),
              "url_scrape_id": findSubString( body, '"url_scrape_id":"', '"' ),
              "hmac": findSubString( body, '"hmac":"', '"' )
            }
          } );
        }
        return resolve( {
          "errors": requestGetPreviewScrapeFail,
          "results": null
        } );
      } );
    } );
  },
  "handleImageUpload": ( url ) => {
    return new Promise( ( resolve ) => {
      const urlFixed = converSourceUnix( url );

      download( urlFixed )
        .then( ( data ) => {
          const pathFileImage = `${__dirname}/${randomstring.generate()}.png`;

          fs.writeFileSync( pathFileImage, data, ( err ) => {
            if ( err ) {
              return resolve( {
                "error": writeFileImageFail,
                "results": null
              } );
            }
          } );
          return resolve( {
            "error": handleImageSuccess,
            "results": pathFileImage
          } );
        } )
        .catch( ( error ) => {
          if ( error.name === "RequestError" ) {
            return resolve( {
              "error": downloadImageFail,
              "results": null
            } );
          }
        } );
    } );
  },
  "uploadImage": ( { cookie, agent, token, path, av } ) => {
    return new Promise( ( resolve ) => {
      const option = {
        "method": "POST",
        "url": linkUploadImage( token, findSubString( cookie, "c_user=", ";" ), av ),
        "headers": {
          "User-Agent": agent,
          "Cookie": cookie,
          "Accept": "/",
          "Connection": "keep-alive",
          "Content-Type": "multipart/form-data"
        },
        "formData": {
          "target_id": findSubString( cookie, "c_user=", ";" ),
          "profile_id": findSubString( cookie, "c_user=", ";" ),
          "farr": fs.createReadStream( path ),
          "source": formDataPost.source,
          "upload_id": formDataPost.upload_id,
          "waterfallxampp": formDataPost.waterfallxapp
        }
      };

      request( option, ( err, res, body ) => {
        if ( !err && res.statusCode === 200 ) {
          return resolve( findSubString( body, '"photoID":"', '"' ) );
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
