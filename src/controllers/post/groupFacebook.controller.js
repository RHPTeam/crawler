/* eslint-disable one-var */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-shadow */
/**
 * Controller Group facebook for project
 * author: hoc-anms
 * date up: 24/04/2019
 * date to: ___
 * team: BE-RHP
 */
const GroupFacebook = require( "../../models/post/GroupFacebook.model" );
const Facebook = require( "../../models/Facebook.model" );
const PostGroup = require( "../../models/post/PostGroup.model" );

const { agent } = require( "../../configs/crawl" );
const getAllGroups = require( "../core/groups.core" );
const jsonResponse = require( "../../configs/response" );
const secure = require( "../../helpers/utils/secures/jwt" );

module.exports = {
  /**
   * Get All (query)
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  "index": async ( req, res ) => {
    let dataResponse = null;
    const authorization = req.headers.authorization,
      userId = secure( res, authorization );

    // Handle get all group from mongodb
    if ( req.query._id ) {
      dataResponse = await GroupFacebook.find( { "_id": req.query._id, "_account": userId } ).lean();
      dataResponse = dataResponse[ 0 ];
    } else if ( Object.entries( req.query ).length === 0 && req.query.constructor === Object ) {
      dataResponse = await GroupFacebook.find( { "_account": userId } ).lean();
    }

    res
      .status( 200 )
      .json( jsonResponse( "success", dataResponse ) );

  },
  /**
   * Update all group from facebook strange
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  "update": async ( req, res ) => {
    const authorization = req.headers.authorization,
      userId = secure( res, authorization ),
      facebookList = await Facebook.find( { "_account": userId } ),
      postGroupList = await PostGroup.find( { "_account": userId } );

    // Get all group from facebook and save
    await Promise.all( facebookList.map( async ( facebook ) => {
      const groupList = await getAllGroups( { "cookie": facebook.cookie, agent } );

      // Handle code when fix add other item
      const groupListFixed = groupList.results.map( ( group ) => {
        group._account = userId;
        group._facebook = facebook._id;
        return group;
      } );
      // Delete all group facebook
      const findGroupFacebook = await GroupFacebook.find( { "_facebook": facebook._id } );

      await Promise.all( findGroupFacebook.map( ( groupFacebook ) => {
        groupFacebook.remove();
      } ) );

      // insert group facebook list to database
      await GroupFacebook.insertMany( groupListFixed );

      // Check post group exists old ID
      await Promise.all( postGroupList.map( ( postGroup ) => {
        postGroup._groups.map( async ( group ) => {
          const groupChecked = await GroupFacebook.findOne( { "groupId": group } );

          if ( !groupChecked ) {
            postGroup._groups.splice( indexOf( postGroup._groups.indexOf( group ) ), 1 );
            await postGroup.save();
          }
        } );
      } ) );
    } ) );

    res
      .status( 200 )
      .json( jsonResponse( "success", null ) );
  }
};
