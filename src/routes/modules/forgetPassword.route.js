/**
 * Create route forget password for project
 * author: hoc_anms
 * date: 22/04/2019
 * team: BE-RHP
 */
const router = require( "express-promise-router" )();

const AccountController = require( "../../controllers/account.controller" );

router.route( "/" ).get( AccountController.getInforUserLostPass );
router.route( "/reset-password" ).post( AccountController.resetPassword );
router.route( "/check-code" ).post( AccountController.checkCode );
router.route( "/new-password" ).patch( AccountController.createNewPassword );

module.exports = router;
