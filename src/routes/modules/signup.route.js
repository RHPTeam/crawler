/**
 * Create route Sign Up for project
 * author: hoc-anms
 * date: 20/04/2019
 * team: BE-RHP
 */
const router = require( "express-promise-router" )();

const AccountController = require( "../../controllers/account.controller" );

const {
  validateBody,
  schemas
} = require( "../../helpers/validator/router.validator" );

router
  .route( "/" )
  .post( validateBody( schemas.userSignUpSchema ), AccountController.signUp );

module.exports = router;
