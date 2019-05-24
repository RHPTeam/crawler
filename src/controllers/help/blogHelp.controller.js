/**
 * Controller blogs help for project
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
const convertUnicode = require( "../../helpers/utils/functions/unicode" );

module.exports = {
  /**
   * Get blog help (all or query)
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
      dataResponse = await BlogHelp.find( { "_id": req.query._id, "_account": userId } ).populate( { "path": "_helpCategory", "select": "_id title" } ).lean();
      dataResponse = dataResponse[ 0 ];
    } else if ( Object.entries( req.query ).length === 0 && req.query.constructor === Object ) {
      dataResponse = await BlogHelp.find( { "_account": userId } ).populate( { "path": "_helpCategory", "select": "_id title" } ).lean();
    }

    res
      .status( 200 )
      .json( jsonResponse( "success", dataResponse ) );
  },
  /**
   * Create blog help
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  "create": async ( req, res ) => {
    // Check validator
    if ( req.body.title === "" || !req.body.title ) {
      return res.status( 403 ).json( { "status": "fail", "data": { "title": "Tiêu đề blog không được bỏ trống!" } } );
    } else if ( req.body.content === undefined || req.body.content.length === 0 ) {
      return res.status( 403 ).json( { "status": "fail", "data": { "content": "Nội dung blog không được bỏ trống!" } } );
    }

    // Handle create with mongodb
    const userId = secure( res, req.headers.authorization ), objSave = {
        "title": req.body.title,
        "content": req.body.content,
        "_account": userId
      },
      newBlogHelp = await new BlogHelp( objSave );

    // Save mongodb
    await newBlogHelp.save();

    if ( req.body._helpCategory ) {
      const findHelpCategory = await HelpCategory.findOne( { "_id": req.body._helpCategory } );

      newBlogHelp._helpCategory = req.body._helpCategory;
      await newBlogHelp.save();
      findHelpCategory._blogHelp.push( newBlogHelp._id );
      await findHelpCategory.save();
    }

    res.status( 200 ).json( jsonResponse( "success", newBlogHelp ) );
  },
  /**
   * Update blog help
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  "update": async ( req, res ) => {
    // Check validator
    if ( req.body.title === "" || !req.body.title ) {
      return res.status( 403 ).json( { "status": "fail", "data": { "title": "Tiêu đề bài viết không được bỏ trống!" } } );
    }

    const userId = secure( res, req.headers.authorization ),
      findBlogHelp = await BlogHelp.findById( req.query._helpId ).lean();

    // Check catch when update post categories
    if ( !findBlogHelp ) {
      return res.status( 404 ).json( { "status": "errors.js", "message": "Bài viết không tồn tại!" } );
    } else if ( findBlogHelp._account.toString() !== userId ) {
      return res.status( 405 ).json( { "status": "errors.js", "message": "Bạn không có quyền cho bài viết này!" } );
    }
    if ( req.body.vote ) {
      await Promise.all( findBlogHelp.vote.map( ( vote ) => {
        delete vote._id;
      } ) );
      req.body.vote = req.body.vote.concat( findBlogHelp.vote );
    }
    if ( req.body._helpCategory ) {
      const findNewHelpCategory = await HelpCategory.findOne( { "_id": req.body._helpCategory } );

      if ( findBlogHelp._helpCategory ) {
        const findHelpCategory = await HelpCategory.findOne( { "_id": findBlogHelp._helpCategory } );

        findHelpCategory._blogHelp.pull( findBlogHelp._id );
        await findHelpCategory.save();
      }
      findNewHelpCategory._blogHelp.push( findBlogHelp._id );
      await findNewHelpCategory.save();
    }
    res.status( 201 ).json( jsonResponse( "success", await BlogHelp.findByIdAndUpdate( req.query._helpId, { "$set": req.body }, { "new": true } ) ) );

  },
  "searchBlog": async ( req, res ) => {
    const userId = secure( res, req.headers.authorization ),
      findBlogHelp = await BlogHelp.find( {} ),
      findAccount = await Account.findOne( { "_id": userId } );


    if ( !findAccount ) {
      return res.status( 404 ).json( { "status": "errors.js", "message": "Người dùng không tồn tại!" } );
    }
    let dataResponse = findBlogHelp.filter( ( blog ) => convertUnicode( blog.title.toLowerCase() ).toString().includes( convertUnicode( req.query._title.toLowerCase() ).toString() ) );

    if ( req.query._type === "full" ) {
      return res.status( 200 ).json( jsonResponse( "success", dataResponse ) );
    }

    res.status( 200 ).json( jsonResponse( "success", dataResponse.slice( 0, 6 ) ) );
  },
  /**
   * Delete blog help
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  "delete": async ( req, res ) => {
    const userId = secure( res, req.headers.authorization ),
      findBlogHelp = await BlogHelp.findById( req.query._helpId ),
      findHelpCategory = await HelpCategory.find( {} ),
      findAccount = await Account.findOne( { "_id": userId } );

    // Check ctach when delete help categories
    if ( !findBlogHelp ) {
      return res.status( 404 ).json( { "status": "errors.js", "message": "Bài viết không tồn tại!" } );
    }
    if ( !findAccount ) {
      return res.status( 404 ).json( { "status": "errors.js", "message": "Người dùng không tồn tại!" } );
    }

    // When delete auto which all of help category of that auto will deleted
    if ( findHelpCategory.length > 0 ) {
      if ( findHelpCategory._blogHelp !== undefined && findHelpCategory._blogHelp.indexOf( req.query._helpId ) > -1 ) {
        findHelpCategory._blogHelp.pull( req.query()._helpId );
        await findHelpCategory.save();
      }
    }

    await BlogHelp.findByIdAndRemove( req.query._helpId );
    res.status( 200 ).json( jsonResponse( "success", null ) );
  }
};
