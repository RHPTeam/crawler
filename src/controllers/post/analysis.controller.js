/**
 * Analysis for project
 * author: sky albert
 * updater: _________
 * date up: 14/05/2019
 * date to: _________
 * team: BE-RHP
 */
const Campaign = require( "../../models/post/Campaign.model" );
const GroupFacebook = require( "../../models/post/GroupFacebook.model" );
const PageFacebook = require( "../../models/post/PageFacebook.model" );
const Post = require( "../../models/post/Post.model" );

const jsonResponse = require( "../../configs/response" );
const secure = require( "../../helpers/utils/secures/jwt" );

module.exports = {
  "statistic": async ( req, res ) => {
    const authorization = req.headers.authorization,
      userId = secure( res, authorization ),
      campaignList = await Campaign.find( { "_account": userId } ).lean(),
      groupList = await GroupFacebook.find( { "_account": userId } ).lean(),
      pageList = await PageFacebook.find( { "_account": userId } ).lean(),
      postList = await Post.find( { "_account": userId } ).lean();

    res.status( 200 ).json( jsonResponse( "success", {
      "campaign": campaignList.length,
      "group": groupList.length,
      "page": pageList.length,
      "post": postList.length
    } ) );
  },
  "statisticCampaign": async ( req, res ) => {
    const authorization = req.headers.authorization,
      userId = secure( res, authorization ),
      statisticList = [];

    for ( let i = 0; i <= 6; i++ ) {
      const dateActive = new Date( ( new Date() ).setDate( ( new Date() ).getDate() - i ) ),
        dateActiveBehind = new Date( ( new Date() ).setDate( ( new Date() ).getDate() - i ) );

      dateActive.setHours( 0, 0, 0, 0 );
      dateActiveBehind.setHours( 23, 59, 59, 999 );

      // eslint-disable-next-line one-var
      const campaignList = await Campaign.find( { "_account": userId, "started_at": {
        "$gte": dateActive,
        "$lte": dateActiveBehind
      } } ).lean();

      statisticList.push( {
        "date": dateActive,
        "amount": campaignList.length
      } );
    }

    res.status( 200 ).json( jsonResponse( "success", statisticList ) );
  },
  "statisticPost": async ( req, res ) => {
    const authorization = req.headers.authorization,
      userId = secure( res, authorization ),
      statisticList = [];

    for ( let i = 0; i <= 4; i++ ) {
      const start = new Date( ( new Date() ).setDate( ( new Date() ).getDate() - i ) ),
        end = new Date( ( new Date() ).setDate( ( new Date() ).getDate() - i ) );

      start.setHours( 0, 0, 0, 0 );
      end.setHours( 23, 59, 59, 999 );

      // eslint-disable-next-line one-var
      const postList = await Post.find( { "_account": userId, "created_at": {
        "$gte": start,
        "$lte": end
      } } );

      statisticList.push( {
        "date": start,
        "amount": postList.length,
        "recommend": Math.floor( Math.random() * 10 ) + 7
      } );
    }

    for ( let i = 1; i <= 2; i++ ) {
      const start = new Date( ( new Date() ).setDate( ( new Date() ).getDate() + i ) );

      start.setHours( 0, 0, 0, 0 );
      statisticList.unshift( {
        "date": start,
        "amount": 0,
        "recommend": Math.floor( Math.random() * 10 ) + 6
      } );
    }

    res.status( 200 ).json( jsonResponse( "success", statisticList.reverse() ) );
  }
};
