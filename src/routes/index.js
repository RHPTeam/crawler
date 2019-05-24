// eslint-disable-next-line new-cap
const router = require( "express" ).Router();
const auth = require( "../helpers/middleware/authenticate.middleware" );

// Chat Route

// General Route
router.use( "/me", require( "./modules/post/ads.route" ) );
router.use( "/core", require( "./modules/core.route" ) );
router.use( "/signup", require( "./modules/signup.route" ) );
router.use( "/signin", require( "./modules/signin.route" ) );
router.use( "/users", auth, require( "./modules/account.route" ) );
router.use( "/password", require( "./modules/forgetPassword.route" ) );
router.use( "/facebook", auth, require( "./modules/facebook.route" ) );
router.use( "/roles", auth, require( "./modules/role.route" ) );

// Help Route
router.use( "/help", auth, require( "./modules/help/help.route" ) );
router.use( "/help-blogs", auth, require( "./modules/help/blogHelp.route" ) );
router.use( "/help-categories", auth, require( "./modules/help/helpCategory.route" ) );

// Live Route

// Post Route
router.use( "/posts", auth, require( "./modules/post/post.route" ) );
router.use( "/post-categories", auth, require( "./modules/post/postCategory.route" ) );
router.use( "/campaigns", auth, require( "./modules/post/campaign.route" ) );
router.use( "/events", auth, require( "./modules/post/event.route" ) );
router.use( "/post-group", auth, require( "./modules/post/postGroup.route" ) );
router.use( "/group-facebook", auth, require( "./modules/post/groupFacebook.route" ) );
router.use( "/page-facebook", auth, require( "./modules/post/pageFacebook.route" ) );
router.use( "/post-facebook", auth, require( "./modules/post/postFacebook.route" ) );

// Server Route
router.use( "/vps", auth, require( "./modules/server.route" ) );

module.exports = router;
