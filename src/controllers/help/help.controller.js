/**
 * Controller blogs help for project
 * author: hoc-anms
 * updater:
 * date up: 15/05/2019
 * date to:
 * team: BE-RHP
 */
const Help = require( "../../models/help/Help.model" );
// eslint-disable-next-line no-unused-vars
/* eslint camelcase: ["error", {properties: "never"}]*/
const Account = require( "../../models/Account.model" );


const jsonResponse = require( "../../configs/response" );
const secure = require( "../../helpers/utils/secures/jwt" );

module.exports = {
  /**
   * Get help (all or query)
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  "index": async ( req, res ) => {
    let dataResponse = null;
    const authorization = req.headers.authorization,
      userId = secure( res, authorization ),
      findAccount = await Account.findOne( { "_id": userId } );

    if ( !findAccount ) {
      return res.status( 404 ).json( { "status": "errors.js", "message": "Người dùng không tồn tại!" } );
    }

    // Handle get all group from mongodb
    if ( req.query._id ) {
      dataResponse = await Help.find( { "_id": req.query._id } ).populate( { "path": "popular_blog", "select": "_id title" } ).lean();
      dataResponse = dataResponse[ 0 ];
    } else if ( Object.entries( req.query ).length === 0 && req.query.constructor === Object ) {
      dataResponse = await Help.find( {} ).populate( { "path": "popular_blog", "select": "_id title" } ).populate( { "path": "popular_section", "select": "_id title" } ).lean();
    }

    res
      .status( 200 )
      .json( jsonResponse( "success", dataResponse ) );
  },
  /**
   * Update help
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  "update": async ( req, res ) => {
    const userId = secure( res, req.headers.authorization ),
      findHelp = await Help.findOne( { "_id": req.query._id } ),
      findAccount = await Account.findOne( { "_id": userId } );


    if ( !findAccount ) {
      return res.status( 404 ).json( { "status": "errors.js", "message": "Người dùng không tồn tại!" } );
    }
    if ( findHelp.popular_blog.length > 5 ) {
      return res.status( 404 ).json( { "status": "errors.js", "message": "Qua so luong bai viet, hay xoa nhung bai viet da ton tai de them" } );
    }

    if ( req.body.popular_blog && req.body.popular_blog.length <= 5 ) {
      findHelp.popular_blog = [];
      await findHelp.save();
      req.body.popular_blog.map( async ( blog ) => {
        await findHelp.popular_blog.push( blog );
      } );
      await findHelp.save();
    }
    if ( req.body.popular_section && req.body.popular_section.length <= 5 ) {
      findHelp.popular_section = [];

      await findHelp.save();
      req.body.popular_section.map( async ( blog ) => {
        findHelp.popular_section.push( blog );
      } );
      await findHelp.save();

    }

    res.status( 201 ).json( jsonResponse( "success", findHelp ) );

  }
};
