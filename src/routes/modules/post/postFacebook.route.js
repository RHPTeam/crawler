/**
 * Create route post facebook for project
 * author: hocpv
 * date: 24/04/2019
 * team: BE-RHP
 */
const router = require( "express-promise-router" )();
const secure = require( "../../../helpers/utils/secures/jwt" );
const PostFacebookController = require( "../../../controllers/post/postFacebook.controller" );
// Handle save image
const fs = require( "fs-extra" );
const multer = require( "multer" ),
  storage = multer.diskStorage( {
    "destination": ( req, file, cb ) => {
      const userId = secure( file, req.headers.authorization ),
        path = `./uploads/post_facebook/person/${userId}`;

      fs.mkdirsSync( path );
      cb( null, path );
    },
    "filename": ( req, file, cb ) => {
      cb(
        null,
        `${new Date().toISOString().replace( /:|\./g, "" )}-${file.originalname}`
      );
    }
  } ),
  upload = multer( {
    "storage": storage,
    "limits": {
      "fileSize": 1024 * 1024 * 5
    },
    "fileFilter": function( req, file, cb ) {
      if ( !file.originalname.match( /\.(jpg|jpeg|png|gif|JPG|JPEG|PNG|GIF)$/ ) ) {
        return cb( new Error( "Only image files are allowed!" ) );
      }
      cb( null, true );
    }
  } );

router
  .route( "/" )
  .get( PostFacebookController.index )
  .post( PostFacebookController.create )
  .patch( upload.array( "attachments", 20 ), PostFacebookController.update )
  .delete( PostFacebookController.delete );

router
  .route( "/search" )
  .post( PostFacebookController.search );
module.exports = router;
