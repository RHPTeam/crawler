/**
 * Create route help category for project
 * author: hocpv
 * date: 15/05/2019
 * team: BE-RHP
 */
const router = require( "express-promise-router" )();
const HelpCategoryController = require( "../../../controllers/help/helpCategory.controller" );

router
  .route( "/" )
  .get( HelpCategoryController.index )
  .patch( HelpCategoryController.update )
  .post( HelpCategoryController.create )
  .delete( HelpCategoryController.delete );
module.exports = router;
