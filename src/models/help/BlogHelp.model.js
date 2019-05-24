const mongoose = require( "mongoose" ),
  Schema = mongoose.Schema,

  BlogHelpSchema = new Schema( {
    "title": String,
    "content": String,
    "vote": [
      {
        "typeVote": Number, // 0: no 1: yes
        "contentVote": String
      }
    ],
    "_helpCategory": {
      "type": Schema.Types.ObjectId,
      "ref": "HelpCategory"
    },
    "_account": {
      "type": Schema.Types.ObjectId,
      "ref": "Account"
    }
  } ),

  BlogHelp = mongoose.model( "BlogHelp", BlogHelpSchema );

module.exports = BlogHelp;
