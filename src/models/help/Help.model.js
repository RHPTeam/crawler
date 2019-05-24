const mongoose = require( "mongoose" ),
  Schema = mongoose.Schema,

  HelpSchema = new Schema( {
    "popular_blog": [ {
      "type": Schema.Types.ObjectId,
      "ref": "BlogHelp"
    } ],
    "popular_section": [ {
      "type": Schema.Types.ObjectId,
      "ref": "HelpCategory"
    } ]
  } ),

  Help = mongoose.model( "Help", HelpSchema );

module.exports = Help;
