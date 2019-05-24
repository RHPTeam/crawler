/**
 * Controller help categories for project
 * author: hoc-anms
 * updater:
 * date up: 15/05/2019
 * date to:
 * team: BE-RHP
 */

const BlogHelp = require( "../../models/help/BlogHelp.model" );
const HelpCategory = require( "../../models/help/HelpCategory.model" );
const Account = require( "../../models/Account.model" );

const jsonResponse = require( "../../configs/response" );
const secure = require( "../../helpers/utils/secures/jwt" );

module.exports = {
  /**
   * Get category help (all or query)
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
      dataResponse = await HelpCategory.find( { "_id": req.query._id, "_account": userId } ).lean();
      dataResponse = dataResponse[ 0 ];
    } else if ( Object.entries( req.query ).length === 0 && req.query.constructor === Object ) {
      dataResponse = await HelpCategory.find( { "_account": userId } ).lean();
    }

    res
      .status( 200 )
      .json( jsonResponse( "success", dataResponse ) );
  },
  /**
   * create category help
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  "create": async ( req, res ) => {
    // Check validator
    if ( req.body.title === "" || !req.body.title ) {
      return res.status( 403 ).json( { "status": "fail", "data": { "title": "Tiêu đề blog không được bỏ trống!" } } );
    }

    // Handle create with mongodb
    const userId = secure( res, req.headers.authorization ), objSave = {
        "title": req.body.title,
        "_account": userId
      },
      newHelpCategory = await new HelpCategory( objSave );

    // Save mongodb
    await newHelpCategory.save();
    if ( req.body.parent ) {
      const findHelpCategory = await HelpCategory.findOne( { "_id": req.body.parent } );

      newHelpCategory.parent = req.body.parent;
      newHelpCategory.level = findHelpCategory.level + 1;
      await newHelpCategory.save();
    }

    res.status( 200 ).json( jsonResponse( "success", newHelpCategory ) );
  },
  /**
   * Update category help
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  "update": async ( req, res ) => {
    // Check validator
    if ( req.body.title === "" || !req.body.title ) {
      return res.status( 403 ).json( { "status": "fail", "data": { "title": "Tiêu đề danh mục help không được bỏ trống!" } } );
    }

    const userId = secure( res, req.headers.authorization ),
      findHelpCategory = await HelpCategory.findById( req.query._categoryId );

    // Check catch when update post categories
    if ( !findHelpCategory ) {
      return res.status( 404 ).json( { "status": "errors.js", "message": "Danh mục help không tồn tại!" } );
    } else if ( findHelpCategory._account.toString() !== userId ) {
      return res.status( 405 ).json( { "status": "errors.js", "message": "Bạn không có quyền cho danh mục này!" } );
    }
    if ( req.body.parent ) {
      const findParentHelpCategory = await HelpCategory.findOne( { "_id": req.body.parent } );

      if ( findHelpCategory.level < findParentHelpCategory.level ) {
        return res.status( 403 ).json( { "status": "fail", "data": { "title": "Bạn không thể cập nhật danh mục nhỏ cấp hơn!" } } );
      }
      findHelpCategory.parent = req.body.parent;
      findHelpCategory.level = findParentHelpCategory.level + 1;
      await findHelpCategory.save();
    }
    if ( req.body._blogHelp ) {
      req.body.vote = req.body._blogHelp.concat( findHelpCategory._blogHelp );
    }

    res.status( 201 ).json( jsonResponse( "success", await HelpCategory.findByIdAndUpdate( req.query._categoryId, { "$set": req.body }, { "new": true } ) ) );

  },
  /**
   * Delete category help
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  "delete": async ( req, res ) => {
    const userId = secure( res, req.headers.authorization ),
      findHelpCategory = await HelpCategory.findById( req.query._categoryId ),
      findAccount = await Account.findOne( { "_id": userId } );
    // Check ctach when delete help categories

    if ( !findHelpCategory ) {
      return res.status( 404 ).json( { "status": "errors.js", "message": "Danh mục không tồn tại!" } );
    }
    if ( !findAccount ) {
      return res.status( 404 ).json( { "status": "errors.js", "message": "Người dùng không tồn tại!" } );
    }

    // When delete auto which all of help of that auto will deleted
    await Promise.all( findHelpCategory._blogHelp.map( async ( blogHelp ) => {
      let findBlogHelp = await BlogHelp.findOne( { "_id": blogHelp } );

      if ( findBlogHelp ) {
        await findBlogHelp.remove();
      }
    } ) );
    await HelpCategory.findByIdAndRemove( req.query._categoryId );
    res.status( 200 ).json( jsonResponse( "success", null ) );
  }
};
