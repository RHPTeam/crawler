const { agent } = require( "../configs/crawl" );
const { categorizedTextFormatPresets } = require( "../databases/cache/facebook" );
const pagesCore = require( "./core/pages.core" );
const groupsCore = require( "./core/groups.core" );
const { searchPost } = require( "./core/search.core" );
const { getAllActionTypeLoader, getAllItemActionTypeLoader, getAllFriends, getUserInfo, searchPlaces } = require( "./core/facebook.core" );
const { createPost, getPost } = require( "./core/posts.core" ),
  CronJob = require( "cron" ).CronJob;

module.exports = {
  "createPost": async ( req, res ) => {
    const result = await createPost( {
      "cookie": req.body.cookie || null,
      "agent": agent,
      "feed": req.body.feed ? req.body.feed : null
    } );

    return res.send( result );
  },
  "getAllActionTypeLoader": async ( req, res ) => {
    const result = await getAllActionTypeLoader( {
      "cookie": req.body.cookie || null,
      "agent": agent
    } );

    return res.status( 200 ).json( result );
  },
  "getAllItemActionTypeLoader": async ( req, res ) => {
    const result = await getAllItemActionTypeLoader( {
      "cookie": req.body.cookie || null,
      "agent": agent,
      "item": req.params.id
    } );

    return res.status( 200 ).json( result );
  },
  "getAllGroups": async ( req, res ) => {
    const result = await groupsCore( {
      "cookie": req.body.cookie || null,
      "agent": agent
    } );

    return res.send( result );
  },
  "getAllPages": async ( req, res ) => {
    const result = await pagesCore( {
      "cookie": req.body.cookie || null,
      "agent": agent
    } );

    return res.send( result );
  },
  "getAllFriends": async ( req, res ) => {
    const result = await getAllFriends( {
      "cookie": req.body.cookie || null,
      "agent": agent
    } );

    return res.status( 200 ).json( result );
  },
  "getAllTextFormatPresets": async ( _req, res ) => {
    res.status( 200 ).json( {
      "errors": {
        "code": 200,
        "text": "Lấy dữ liệu thư viện nền bài đăng trên facebook thành công!"
      },
      "results": categorizedTextFormatPresets
    } );
  },
  "getPost": async ( req, res ) => {
    const result = await getPost( {
      "cookie": req.body.cookie || null,
      "agent": agent,
      "id": req.params.id
    } );

    return res.send( result );
  },
  "getUserInfo": async ( req, res ) => {
    const result = await getUserInfo( {
      "cookie": req.body.cookie || null,
      "agent": agent
    } );

    res.status( 200 ).json( result );
  },
  "searchGroups": async () => {},
  "searchPages": async () => {},
  "searchPlaces": async ( req, res ) => {
    const result = await searchPlaces( {
      "keyword": req.query.keyword ? req.query.keyword : null,
      "number": req.query.number ? req.query.number : 15,
      "cookie": req.body.cookie || null,
      "agent": agent
    } );

    return res.status( 200 ).json( result );
  },
  "searchPosts": async ( req, res ) => {
    const result = await searchPost( {
      "keyword": req.query.keyword,
      "number": req.query.number,
      "cookie": req.body.cookie || null,
      "agent": agent
    } );

    return res.send( result );
  },
  "testCronSchedule": ( ) => {
    console.log( "Hello from test cron schedule!" );
    console.log( 1 );
    let cronList = {};

    cronList.one = new CronJob( "5 1 * * * *", function () {
      console.log( "Cron from 01!" );
    }, true, "Asia/Ho_Chi_Minh" );

    console.log( cronList.one );
  }
};
