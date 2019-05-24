/**
 * Create route Server for project
 * author: sky albert
 * date: 21/05/2019
 * team: BE-RHP
 */
const router = require( "express-promise-router" )();

const ServerController = require( "../../controllers/server.controller" );

router
  .route( "/" )
  .get( ServerController.index )
  .post( ServerController.create )
  .patch( ServerController.update )
  .delete( ServerController.delete );

module.exports = router;
