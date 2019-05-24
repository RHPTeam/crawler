/**
 * Create route facebook for project
 * author: hocpv
 * date: 22/04/2019
 * team: BE-RHP
 */
const router = require( "express-promise-router" )();
const FaceController = require( "../../controllers/facebook.controller" );

router
  .route( "/" )
  .get( FaceController.index )
  .post( FaceController.create )
  .patch( FaceController.update )
  .delete( FaceController.delete );

router.route( "/posts-type-loader" ).get( FaceController.getAllActionTypeLoader );
router.route( "/posts-type-loader/:id" ).get( FaceController.showActionTypeLoader );
router.route( "/friends" ).get( FaceController.getAllFriends );
router.route( "/places" ).get( FaceController.searchPlaces );

module.exports = router;
