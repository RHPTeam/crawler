/**
 * Create route Role for project
 * author: Sky Albert
 * date: 20/05/2019
 * team: BE-RHP
 */
const router = require( "express-promise-router" )();
const RoleController = require( "../../controllers/role.controller" );

router
  .route( "/" )
  .get( RoleController.index );
module.exports = router;
