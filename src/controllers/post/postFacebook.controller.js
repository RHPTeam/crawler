/**
 * Controller post facebook for project
 * author: hoc-anms
 * updater: sky albert
 * date up: 24/04/2019
 * date to: 11/05/2019
 * team: BE-RHP
 */
const PostFacebook = require( "../../models/post/PostFacebook.model" );

const jsonResponse = require( "../../configs/response" );
const dictionary = require( "../../configs/dictionaries" );
const secure = require( "../../helpers/utils/secures/jwt" );
const decodeRole = require( "../../helpers/utils/secures/role" );

module.exports = {
  /**
   * Get All (query)
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  "index": async ( req, res ) => {
    if ( req.headers.cfr === undefined ) {
      return res.status( 405 ).json( { "status": "errors.js", "message": "Không thể xác thực được quyền của bạn!" } );
    }

    let page = null, dataResponse = null;
    const authorization = req.headers.authorization,
      role = req.headers.cfr,
      userId = secure( res, authorization );

    if ( decodeRole( role, 10 ) !== 1 && decodeRole( role, 10 ) !== 2 ) {
      return res.status( 405 ).json( { "status": "errors.js", "message": "Bạn không có quyền cho chức năng này!" } );
    }

    if ( req.query._id ) {
      dataResponse = await PostFacebook.find( { "_id": req.query._id } ).populate( { "path": "_account", "select": "_id name" } ).lean();
    } else if ( req.query._size && req.query._page ) {
      dataResponse = ( await PostFacebook.find( {} ).sort( { "share": "desc", "vote": "desc", "like": "desc" } ).populate( { "path": "_account", "select": "_id name" } ).lean() ).slice( ( Number( req.query._page ) - 1 ) * Number( req.query._size ), Number( req.query._size ) * Number( req.query._page ) );
    } else if ( req.query._size ) {
      dataResponse = ( await PostFacebook.find( {} ).sort( { "share": "desc", "vote": "desc", "like": "desc" } ).populate( { "path": "_account", "select": "_id name" } ).lean() ).slice( 0, Number( req.query._size ) );
    } else if ( Object.entries( req.query ).length === 0 && req.query.constructor === Object ) {
      dataResponse = await PostFacebook.find( req.query ).sort( { "share": "desc", "vote": "desc", "like": "desc" } ).populate( { "path": "_account", "select": "_id name" } ).lean();
    }

    if ( req.query._size ) {
      if ( ( await PostFacebook.find( { "_account": userId } ) ).length % req.query._size === 0 ) {
        page = Math.floor( ( await PostFacebook.find( {} ) ).length / req.query._size );
      } else {
        page = Math.floor( ( await PostFacebook.find( {} ) ).length / req.query._size ) + 1;
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
   * Add new post
   * @param req
   * @param res
   * @returns {Promise<*|Promise<any>>}
   */
  "create": async ( req, res ) => {
    if ( req.headers.cfr === undefined ) {
      return res.status( 405 ).json( { "status": "errors.js", "message": "Không thể xác thực được quyền của bạn!" } );
    }

    const userId = secure( res, req.headers.authorization ),
      role = req.headers.cfr;

    if ( decodeRole( role, 10 ) !== 1 && decodeRole( role, 10 ) !== 2 ) {
      return res.status( 405 ).json( { "status": "errors.js", "message": "Bạn không có quyền cho chức năng này!" } );
    }
    // eslint-disable-next-line one-var
    const newPostFacebook = new PostFacebook( { "title": dictionary.DEFAULT_NAMEPOST, "_account": userId } );

    newPostFacebook.save();

    res.status( 200 ).json( jsonResponse( "success", newPostFacebook ) );
  },
  /**
   * update post facebook
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  "update": async ( req, res ) => {
    if ( req.headers.cfr === undefined ) {
      return res.status( 405 ).json( { "status": "errors.js", "message": "Không thể xác thực được quyền của bạn!" } );
    }
    const role = req.headers.cfr,
      findPost = await PostFacebook.findById( req.query._postFacebookId );

    if ( decodeRole( role, 10 ) !== 1 && decodeRole( role, 10 ) !== 2 ) {
      return res.status( 405 ).json( { "status": "errors.js", "message": "Bạn không có quyền cho chức năng này!" } );
    }

    // Check catch
    if ( !findPost ) {
      return res.status( 404 ).json( { "status": "errors.js", "message": "Bài đăng không tồn tại!" } );
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

    res.status( 201 ).json( jsonResponse( "success", await PostFacebook.findByIdAndUpdate( req.query._postFacebookId, { "$set": req.body }, { "new": true } ) ) );
  },
  /**
   * Delete post facebook
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  "delete": async ( req, res ) => {
    // Check if don't use query
    if ( req.query._postFacebookId === undefined && req.query._postFacebookId === "" ) {
      return res.status( 403 ).json( { "status": "fail", "_postFacebookId": "Vui lòng cung cấp query _postFacebookId!" } );
    }
    if ( req.headers.cfr === undefined ) {
      return res.status( 405 ).json( { "status": "errors.js", "message": "Không thể xác thực được quyền của bạn!" } );
    }
    const role = req.headers.cfr,
      findPostFacebook = await PostFacebook.findById( req.query._postFacebookId );

    if ( decodeRole( role, 10 ) !== 1 && decodeRole( role, 10 ) !== 2 ) {
      return res.status( 405 ).json( { "status": "errors.js", "message": "Bạn không có quyền cho chức năng này!" } );
    }

    // Check catch when delete campaign
    if ( !findPostFacebook ) {
      return res.status( 404 ).json( { "status": "errors.js", "message": "Bài đăng không tồn tại!" } );
    }

    // Remove a file attachments in post
    if ( req.query._attachmentId ) {
      const findPostOfAttachment = await PostFacebook.findOne( { "attachments._id": req.query._attachmentId } );

      if ( !findPostOfAttachment ) {
        return res.status( 404 ).json( { "status": "errors.js", "message": "Ảnh không tồn tại trong bài đăng này!" } );
      }
      PostFacebook.updateOne( { "_id": req.query._postFacebookId }, { "$pull": { "attachments": { "_id": req.query._attachmentId } } }, ( err ) => {
        if ( err ) {
          return res.status( 500 ).json( { "status": "errors.js", "message": "Hệ thống xảy ra lỗi trong quá trình xóa" } );
        }
      } );
      return res.status( 200 ).json( jsonResponse( "success", null ) );
    }

    // Remove postFacebook
    await findPostFacebook.remove();
    res.status( 200 ).json( jsonResponse( "success", null ) );
  },
  /**
   * Search engine
   * @param req
   * @param res
   * @returns {Promise<*>}
   */
  "search": async ( req, res ) => {
    if ( req.query.keyword === undefined ) {
      return res.status( 404 ).json( { "status": "fail", "keyword": "Vui lòng cung cấp từ khóa để tìm kiếm!" } );
    }


    let page = null, dataResponse = null, data = ( await PostFacebook.find( { "$text": { "$search": req.query.keyword, "$language": "none" } } ).sort( { "share": "desc", "vote": "desc", "like": "desc" } ).lean() );

    if ( req.query._size && req.query._page ) {
      dataResponse = data.slice( ( Number( req.query._page ) - 1 ) * Number( req.query._size ), Number( req.query._size ) * Number( req.query._page ) );
    } else if ( req.query._size ) {
      dataResponse = data.slice( 0, Number( req.query._size ) );
    }

    if ( req.query._size ) {
      if ( data.length % req.query._size === 0 ) {
        page = Math.floor( data.length / req.query._size );
      } else {
        page = Math.floor( data.length / req.query._size ) + 1;
      }
    }

    return res
      .status( 200 )
      .json( jsonResponse( "success", { "results": dataResponse, "page": page } ) );
  }
};
