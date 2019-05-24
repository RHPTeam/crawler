/**
 * Create route group facebook for project
 * author: hocpv
 * date: 24/04/2019
 * team: BE-RHP
 */
const router = require( "express-promise-router" )();
const GroupFacebookController = require( "../../../controllers/post/groupFacebook.controller" );

router
  .route( "/" )
  .get( GroupFacebookController.index )
  .patch( GroupFacebookController.update );
module.exports = router;
