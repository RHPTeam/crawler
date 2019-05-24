/**
 * Controller post categories for project
 * author: hoc-anms
 * updater: trantoan
 * date up: 20/04/2019
 * date to: 02/05/2019
 * team: BE-RHP
 */
const Post = require( "../../models/post/Post.model" );
const PostCategory = require( "../../models/post/PostCategory.model" );

const jsonResponse = require( "../../configs/response" );
const secure = require( "../../helpers/utils/secures/jwt" );
const dictionary = require( "../../configs/dictionaries" );

module.exports = {
  /**
   * Get post auto (query or not)
   * @param req
   * @param res
   * @returns {Promise<*|Promise<any>>}
   */
  "index": async ( req, res ) => {
    let page = null, dataResponse = null;
    const authorization = req.headers.authorization,
      userId = secure( res, authorization );

    if ( req.query._id ) {
      dataResponse = await PostCategory.find( { "_id": req.query._id, "_account": userId } ).lean();
    } else if ( req.query._size && req.query._page ) {
      dataResponse = ( await PostCategory.find( { "_account": userId } ).lean() ).slice( ( Number( req.query._page ) - 1 ) * Number( req.query._size ), Number( req.query._size ) * Number( req.query._page ) );
    } else if ( req.query._size ) {
      dataResponse = ( await PostCategory.find( { "_account": userId } ).lean() ).slice( 0, Number( req.query._size ) );
    } else if ( Object.entries( req.query ).length === 0 && req.query.constructor === Object ) {
      dataResponse = await PostCategory.find( { "_account": userId } ).lean();
    }

    // Check ammout post of auto
    dataResponse = dataResponse.map( async ( item ) => {
      if ( item._account.toString() === userId ) {
        const findPost = await Post.find( { "_account": userId } );

        item.ammout = findPost.filter( ( post ) => post._categories.indexOf( item._id ) > -1 ).length;

        return item;
      }
    } );
    dataResponse = await Promise.all( dataResponse );

    // If get size server will auto paginate and return page ammout
    if ( req.query._size ) {
      if ( ( await PostCategory.find( { "_account": userId } ) ).length % req.query._size === 0 ) {
        page = Math.floor( ( await PostCategory.find( { "_account": userId } ) ).length / req.query._size );
      } else {
        page = Math.floor( ( await PostCategory.find( { "_account": userId } ) ).length / req.query._size ) + 1;
      }

      return res
        .status( 200 )
        .json( jsonResponse( "success", { "results": dataResponse, "page": page } ) );
    }

    // Check when user get one
    if ( req.query._id ) {
      dataResponse = dataResponse[ 0 ];
    }

    res
      .status( 200 )
      .json( jsonResponse( "success", dataResponse ) );
  },
  /**
   * Create Post Category
   * @param req
   * @param res
   * @returns {Promise<*|Promise<any>>}
   */
  "create": async ( req, res ) => {
    // Check validator
    if ( req.body.title === "" ) {
      return res.status( 403 ).json( { "status": "fail", "data": { "title": "Tiêu đề danh mục không được bỏ trống!" } } );
    }

    // Handle create with mongodb
    const userId = secure( res, req.headers.authorization ), objSave = {
        "title": req.body.title,
        "description": req.body.description,
        "_account": userId
      },
      newPostCategory = await new PostCategory( objSave );

    // Save mongodb
    await newPostCategory.save();

    res.status( 200 ).json( jsonResponse( "success", newPostCategory ) );
  },
  /**
   * Update Post Category
   * @param req
   * @param res
   * @returns {Promise<*|Promise<any>>}
   */
  "update": async ( req, res ) => {
    // Check validator
    if ( req.body.title === "" ) {
      return res.status( 403 ).json( { "status": "fail", "data": { "title": "Tiêu đề danh mục không được bỏ trống!" } } );
    }

    const userId = secure( res, req.headers.authorization ),
      findPostCategory = await PostCategory.findById( req.query._categoryId );

    // Check catch when update post categories
    if ( !findPostCategory ) {
      return res.status( 404 ).json( { "status": "errors.js", "message": "Danh mục không tồn tại!" } );
    } else if ( findPostCategory._account.toString() !== userId ) {
      return res.status( 405 ).json( { "status": "errors.js", "message": "Bạn không có quyền cho danh mục này!" } );
    }

    res.status( 201 ).json( jsonResponse( "success", await PostCategory.findByIdAndUpdate( req.query._categoryId, { "$set": req.body }, { "new": true } ) ) );
  },
  /**
   * Delete Post Category
   * @param req
   * @param res
   * @returns {Promise<*|Promise<any>>}
   */
  "delete": async ( req, res ) => {
    const userId = secure( res, req.headers.authorization ),
      findPostCategory = await PostCategory.findById( req.query._categoryId ),
      findPost = await Post.find( { "_account": userId, "_categories": req.query._categoryId } );

    // Check ctach when delete post categories
    if ( !findPostCategory ) {
      return res.status( 404 ).json( { "status": "errors.js", "message": "Danh mục không tồn tại!" } );
    } else if ( findPostCategory.title === dictionary.DEFAULT_POSTCATEGORY ) {
      return res.status( 405 ).json( { "status": "errors.js", "message": "Danh mục mặc định không thể bị xóa!" } );
    }

    // When delete auto which all of post of that auto will deleted
    if ( findPost.length > 0 ) {
      // add to un_ categories
      const unCategory = await PostCategory.findOne( { "_account": userId, "title": dictionary.DEFAULT_POSTCATEGORY } );

      await Promise.all( findPost.map( async ( post ) => {
        post._categories.pull( req.query._categoryId );
        post._categories.push( unCategory._id );
        await post.save();
      } ) );
    }


    await PostCategory.findByIdAndRemove( req.query._categoryId );
    res.status( 200 ).json( jsonResponse( "success", null ) );
  }
};
