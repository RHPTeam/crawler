/**
 * Create route post group for project
 * author: hocpv
 * date: 24/04/2019
 * team: BE-RHP
 */
const router = require( "express-promise-router" )();
const PostGroupController = require( "../../../controllers/post/postGroup.controller" );

router
  .route( "/" )
  .get( PostGroupController.index )
  .post( PostGroupController.create )
  .patch( PostGroupController.update )
  .delete( PostGroupController.delete );
module.exports = router;
