/* eslint-disable one-var */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-shadow */
/**
 * Controller page facebook for project
 * author: hoc-anms
 * date up: 24/04/2019
 * date to: ___
 * team: BE-RHP
 */
const PageFacebook = require( "../../models/post/PageFacebook.model" );
const Facebook = require( "../../models/Facebook.model" );
const PostGroup = require( "../../models/post/PostGroup.model" );

const { agent } = require( "../../configs/crawl" );
const getAllPages = require( "../core/pages.core" );
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

    // Handle get all page from mongodb
    if ( req.query._id ) {
      dataResponse = await PageFacebook.find( { "_id": req.query._id, "_account": userId } ).lean();
      dataResponse = dataResponse[ 0 ];
    } else if ( Object.entries( req.query ).length === 0 && req.query.constructor === Object ) {
      dataResponse = await PageFacebook.find( { "_account": userId } ).lean();
    }

    res
      .status( 200 )
      .json( jsonResponse( "success", dataResponse ) );
  },
  /**
   * Update all page from facebook strange
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  "update": async ( req, res ) => {
    const authorization = req.headers.authorization,
      userId = secure( res, authorization ),
      facebookList = await Facebook.find( { "_account": userId } ),
      postGroupList = await PostGroup.find( { "_account": userId } );

    // Get all page from facebook and save
    await Promise.all( facebookList.map( async ( facebook ) => {
      const pageList = await getAllPages( { "cookie": facebook.cookie, agent } );

      // Handle code when fix add other item
      const pageListFixed = pageList.results.map( ( page ) => {
        return {
          "pageId": page.page_id,
          "name": page.page_display_name,
          "profile_picture": page.page_image_src,
          "_account": userId,
          "_facebook": facebook._id
        };
      } );
      // Delete all page facebook
      const findPageFacebook = await PageFacebook.find( { "_facebook": facebook._id } );

      await Promise.all( findPageFacebook.map( ( pageFacebook ) => {
        pageFacebook.remove();
      } ) );

      // insert page facebook list to database
      await PageFacebook.insertMany( pageListFixed );

      // Check post group exists old ID
      await Promise.all( postGroupList.map( ( postGroup ) => {
        postGroup._pages.map( async ( page ) => {
          const pageChecked = await PageFacebook.findOne( { "pageId": page } );

          if ( !pageChecked ) {
            postGroup._pages.splice( indexOf( postGroup._pages.indexOf( page ) ), 1 );
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
