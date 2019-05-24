/**
 * Create route User for project
 * author: hoc-anms
 * date: 20/04/2019
 * team: BE-RHP
 */
const router = require( "express-promise-router" )();
const secure = require( "../../helpers/utils/secures/jwt" );
const AccountController = require( "../../controllers/account.controller" );

// Handle save image
const fs = require( "fs-extra" );
const multer = require( "multer" ),
  storage = multer.diskStorage( {
    "destination": ( req, file, cb ) => {
      const userId = secure( file, req.headers.authorization ),
        path = `./uploads/users/person/${userId}`;

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
  .post( upload.single( "file" ), AccountController.upload )
  .get( AccountController.index )
  .patch( AccountController.update )
  .put( AccountController.deleteUser );
router.route( "/admin" ).patch( AccountController.updateExpire );
router.route( "/active" ).post( AccountController.active );
router.route( "/change-password" ).patch( AccountController.changePassword );

module.exports = router;
