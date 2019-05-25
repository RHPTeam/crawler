const { checkUnique } = require( "../../helpers/utils/functions/array" ),
  { searchPost } = require( "../../controllers/core/search.core" ),
  { agent, cookie } = require( "../../databases/cache/facebook" ),
  CronJob = require( "cron" ).CronJob,

  crawler = ( io ) => {
    io.sockets.on( "connection", function( socket ) {

      // Global variables
      let date = new Date(), listPost;

      console.log( `Client IP: ${ socket.id}` );

      // Disconnect listener
      socket.on( "disconnect", function() {
        console.log( "Client disconnected." );
      } );

      // Step 01: Send to zinbee server to get keyword
      // eslint-disable-next-line no-new
      new CronJob( `${ date.getSeconds() + 2 } ${ date.getMinutes() } ${ date.getHours() } * * *`, function() {
        socket.emit( "getKey", "Start sent get key request!" );
      }, null, true, "Asia/Ho_Chi_Minh" );

      // Step 02: Listen from zinbee server to search on facebook all post
      socket.on( "infoCrawl", async ( infoCrawl ) => {

        // Handle search on facebook and get info feed/ post
        listPost = await Promise.all( infoCrawl.keywords.map( async ( keyword ) => {
          let listPostByKeyword;

          // Search post by keyword
          listPostByKeyword = await searchPost( {
            "keyword": keyword,
            "number": 12,
            "cookie": cookie || null,
            "agent": agent
          } );

          // Remove post no content
          listPostByKeyword = listPostByKeyword.filter( ( post ) => post.postID.includes( "photos" ) === false ).filter( ( post ) => post.markup !== "" || post.markup !== null || post.markup !== undefined );

          // Handle like, share and photos
          listPostByKeyword = await Promise.all( listPostByKeyword.map( async ( post ) => {
            post.content = post.markup;
            post.feedId = post.postID;
            post.generate = 1;

            delete post.markup;
            delete post.postID;

            // Like
            if ( post.like === "" ) {
              post.like = 0;
            } else if ( post.like === null || post.like === undefined ) {
              post.like = Math.floor( Math.random() * 200 ) + 1;
            } else if ( post.like.includes( "," ) && post.like.includes( "K" ) ) {
              post.like = ( ( post.like.match( /(\d+,)/g ).toString().replace( ",", "" )[ 0 ] ) * 1000 ) + ( post.like.match( /(,\d+)/g ).toString().replace( ",", "" )[ 0 ] ) * 100;
            } else if ( post.like.includes( "K" ) ) {
              post.like = ( post.like.match( /\d+/g )[ 0 ] ) * 1000;
            } else {
              post.like = ( post.like.match( /\d+/g )[ 0 ] ) * 1;
            }

            // Share
            if ( post.share === "" ) {
              post.share = 0;
            } else if ( post.share === null || post.share === undefined ) {
              post.share = Math.floor( Math.random() * 200 ) + 1;
            } else if ( post.share.includes( "," ) && post.share.includes( "K" ) ) {
              post.share = ( ( post.share.match( /(\d+,)/g ).toString().replace( ",", "" )[ 0 ] ) * 1000 ) + ( post.share.match( /(,\d+)/g ).toString().replace( ",", "" )[ 0 ] ) * 100;
            } else if ( post.share.includes( "K" ) ) {
              post.share = ( post.share.match( /\d+/g )[ 0 ] ) * 1000;
            } else {
              post.share = ( post.share.match( /\d+/g )[ 0 ] ) * 1;
            }

            // Photos
            if ( post.photos.length > 0 ) {
              post.photos = await Promise.all( post.photos.map( ( photo ) => {
                return {
                  "link": photo,
                  "typeAttachment": 1
                };
              } ) );
            }

            return post;
          } ) );

          return listPostByKeyword;
        } ) );

        // Merge nested array
        listPost = listPost.flat( 1 );

        // Remove post exist in database
        if ( infoCrawl.postList.length > 0 ) {
          listPost = listPost.filter( ( post ) => {
            if ( checkUnique( infoCrawl.postList, "feedId", post.feedId ) === true ) {
              return false;
            }
            return true;
          } );
        }

        // Final send response data
        socket.emit( "listPostCrawled", listPost );
      } );

    } );
  };

module.exports = crawler;
