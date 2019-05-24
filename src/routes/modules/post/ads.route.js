const router = require( "express-promise-router" )();
const AnalysisController = require( "../../../controllers/post/analysis.controller" );

router.route( "/statistics" ).get( AnalysisController.statistic );
router.route( "/statistics/campaigns" ).get( AnalysisController.statisticCampaign );
router.route( "/statistics/posts" ).get( AnalysisController.statisticPost );

module.exports = router;
