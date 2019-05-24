/**
 * Controller post (profile) for project
 * author: hoc-anms
 * date up: 20/04/2019
 * date to: ___
 * team: BE-RHP
 */
const Post = require( "../../models/post/Post.model" );
const PostCategory = require( "../../models/post/PostCategory.model" );

const jsonResponse = require( "../../configs/response" );
const secure = require( "../../helpers/utils/secures/jwt" );
const dictionary = require( "../../configs/dictionaries" );

module.exports = {
  /**
   * Get All (query or not)
   * @param req
   * @param res
   * @returns {Promise<*|Promise<any>>}
   */
  "index": async ( req, res ) => {
    let page = null, dataResponse = null;
    const authorization = req.headers.authorization,
      userId = secure( res, authorization );

    if ( req.query._id ) {
      dataResponse = await Post.find( { "_id": req.query._id, "_account": userId } ).populate( { "path": "_categories", "select": "_id title" } ).lean();
    } else if ( req.query._categoryId ) {
      dataResponse = await Post.find( { "_categories": req.query._categoryId } ).populate( { "path": "_categories", "select": "_id title" } ).lean();
    } else if ( req.query._size && req.query._page ) {
      dataResponse = ( await Post.find( { "_account": userId } ).populate( { "path": "_categories", "select": "_id title" } ).lean() ).slice( ( Number( req.query._page ) - 1 ) * Number( req.query._size ), Number( req.query._size ) * Number( req.query._page ) );
    } else if ( req.query._size ) {
      dataResponse = ( await Post.find( { "_account": userId } ).populate( { "path": "_categories", "select": "_id title" } ).lean() ).slice( 0, Number( req.query._size ) );
    } else if ( Object.entries( req.query ).length === 0 && req.query.constructor === Object ) {
      dataResponse = await Post.find( { "_account": userId } ).populate( { "path": "_categories", "select": "_id title" } ).lean();
    }

    if ( req.query._size ) {
      if ( ( await Post.find( { "_account": userId } ) ).length % req.query._size === 0 ) {
        page = Math.floor( ( await Post.find( { "_account": userId } ) ).length / req.query._size );
      } else {
        page = Math.floor( ( await Post.find( { "_account": userId } ) ).length / req.query._size ) + 1;
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
   * Create Post
   * @param req
   * @param res
   * @returns {Promise<*|Promise<any>>}
   */
  "create": async ( req, res ) => {
    const userId = secure( res, req.headers.authorization ),
      findPostCategory = await PostCategory.findOne( { "_account": userId, "title": dictionary.DEFAULT_POSTCATEGORY } ),
      newPost = await new Post( { "title": dictionary.DEFAULT_NAMEPOST, "_account": userId } );

    newPost._categories.push( findPostCategory._id );
    await newPost.save();

    res.status( 200 ).json( jsonResponse( "success", newPost ) );
  },
  /**
   * Update Post
   * @param req
   * @param res
   * @returns {Promise<*|Promise<any>>}
   */
  "update": async ( req, res ) => {

    const userId = secure( res, req.headers.authorization ),
      findPost = await Post.findById( req.query._postId );

    // Check catch when delete campaign
    if ( !findPost ) {
      return res.status( 404 ).json( { "status": "errors.js", "message": "Bài đăng không tồn tại!" } );
    } else if ( findPost._account.toString() !== userId ) {
      return res.status( 405 ).json( { "status": "errors.js", "message": "Bạn không có quyền cho bài đăng này!" } );
    }

    // Check update post if user upload file
    if ( req.files && req.files.length > 0 ) {
      const attachmentsList = req.files.map( ( file ) => {
        if ( file.fieldname === "attachments" && file.mimetype.includes( "image" ) ) {
          return {
            "link": `${process.env.APP_URL}:${process.env.PORT_BASE}/${file.path}`,
            "typeAttachment": 1
          };
        }
      } );

      findPost.attachments = findPost.attachments.concat( attachmentsList );
      await findPost.save();
      return res.status( 201 ).json( jsonResponse( "success", findPost ) );
    }

    // Check validator
    if ( !req.body.title || req.body.title.length === 0 ) {
      return res.status( 403 ).json( { "status": "fail", "title": "Tiêu đề bài đăng không được bỏ trống!" } );
    } else if ( req.body.scrape && /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/gm.test( req.body.scrape ) === false ) {
      return res.status( 403 ).json( { "status": "fail", "scrape": "Dữ liệu không đúng định dạng!" } );
    }

    res.status( 201 ).json( jsonResponse( "success", await Post.findByIdAndUpdate( req.query._postId, { "$set": req.body }, { "new": true } ) ) );
  },
  /**
   * Delete Post
   * @param req
   * @param res
   * @returns {Promise<*|Promise<any>>}
   */
  "delete": async ( req, res ) => {
    // Check if don't use query
    if ( !req.query._postId || req.query._postId === "" ) {
      return res.status( 403 ).json( { "status": "fail", "_postId": "Vui lòng cung cấp query _postId!" } );
    }

    const userId = secure( res, req.headers.authorization ),
      findPost = await Post.findById( req.query._postId );

    // Check catch when delete campaign
    if ( !findPost ) {
      return res.status( 404 ).json( { "status": "errors.js", "message": "Bài đăng không tồn tại!" } );
    } else if ( findPost._account.toString() !== userId ) {
      return res.status( 405 ).json( { "status": "errors.js", "message": "Bạn không có quyền cho bài đăng này!" } );
    }

    // Remove a file attachments in post
    if ( req.query._attachmentId ) {
      const findPostOfAttachment = await Post.findOne( { "attachments._id": req.query._attachmentId } );

      if ( !findPostOfAttachment ) {
        return res.status( 404 ).json( { "status": "errors.js", "message": "Ảnh không tồn tại trong bài đăng này!" } );
      }
      Post.updateOne( { "_id": req.query._postId }, { "$pull": { "attachments": { "_id": req.query._attachmentId } } }, ( err ) => {
        if ( err ) {
          return res.status( 500 ).json( { "status": "errors.js", "message": "Hệ thống xảy ra lỗi trong quá trình xóa" } );
        }
      } );
      return res.status( 200 ).json( jsonResponse( "success", null ) );
    }

    // Remove post
    await Post.findOneAndRemove( { "_id": req.query._postId } );
    res.status( 200 ).json( jsonResponse( "success", null ) );
  }
};
