const { checkUnique } = require( "../../helpers/utils/functions/array" ),
  { searchPost } = require( "../../controllers/core/search.core" ),
  { agent, cookie } = require( "../../databases/cache/facebook" ),
  request = require( "axios" ),
  CronJob = require( "cron" ).CronJob,

  // Function handle crawl post facebook
  crawlPostFacebook = async ( infoCrawl ) => {
    // Handle search on facebook and get info feed/ post
    let listPost = await Promise.all( infoCrawl.keywords.map( async ( keyword ) => {
      let listPostByKeyword;

      // Search post by keyword
      listPostByKeyword = await searchPost( {
        "keyword": keyword,
        "number": 50,
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
    if ( infoCrawl.data.length > 0 ) {
      listPost = listPost.filter( ( post ) => {
        if ( checkUnique( infoCrawl.data, "feedId", post.feedId ) === true ) {
          return false;
        }
        return true;
      } );
    }

    return listPost;
  };


( async () => {
  new CronJob( "1 * * * * *", async function() {
    let dataResponseFromFacebook, dataResponseStatusFromMainServer;

    console.log( "Thread 01: Starting request get all keywords" );

    const listInfoRes = await request( {
      "method": "get",
      "url": `${process.env.APP_MAIN_URL}/api/v1/keywords/sync`
    } );

    console.log( "Thread 01: Finnish request!" );

    console.log( "Thread 02: Starting request crawler to facebook!" );
    dataResponseFromFacebook = await crawlPostFacebook( listInfoRes.data );
    console.log( "Thread 02: Finnish request crawler to facebook!" );

    console.log( "Thread 03: Starting request save data to main server!" );
    dataResponseStatusFromMainServer = await request( {
      "method": "patch",
      "url": `${process.env.APP_MAIN_URL}/api/v1/posts/sync`,
      "data": dataResponseFromFacebook
    } );
    console.log( "Thread 03: Finnish request save data to main server!" );

    if ( dataResponseStatusFromMainServer.data.status !== "success" ) {
      console.log( "ERROR: Error crashed from main server in insertMany!" );
    }

    console.log( "CLOSED: Finnish scrape data from facebook. Waiting next 1 minutes..." );

  }, null, true, "Asia/Ho_Chi_Minh", null, true );
} )();
