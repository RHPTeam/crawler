/**
 * Create route help category for project
 * author: hocpv
 * date: 15/05/2019
 * team: BE-RHP
 */
const router = require( "express-promise-router" )();
const BlogHelpController = require( "../../../controllers/help/blogHelp.controller" );

router
  .route( "/" )
  .get( BlogHelpController.index )
  .patch( BlogHelpController.update )
  .post( BlogHelpController.create )
  .delete( BlogHelpController.delete );
router
  .route( "/search" )
  .post( BlogHelpController.searchBlog );
module.exports = router;
