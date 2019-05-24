/**
 * Create route page facebook for project
 * author: hocpv
 * date: 24/04/2019
 * team: BE-RHP
 */
const router = require( "express-promise-router" )();
const PageFacebookController = require( "../../../controllers/post/pageFacebook.controller" );

router
  .route( "/" )
  .get( PageFacebookController.index )
  .patch( PageFacebookController.update );
module.exports = router;
