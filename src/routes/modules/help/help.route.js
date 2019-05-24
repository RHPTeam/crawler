/**
 * Create route help for project
 * author: hocpv
 * date: 15/05/2019
 * team: BE-RHP
 */
const router = require( "express-promise-router" )();
const HelpController = require( "../../../controllers/help/help.controller" );

router
  .route( "/" )
  .get( HelpController.index )
  .patch( HelpController.update );
module.exports = router;
