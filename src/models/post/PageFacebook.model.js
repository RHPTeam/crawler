/* eslint-disable one-var */
/* eslint-disable camelcase */
const mongoose = require( "mongoose" ),
  Schema = mongoose.Schema,

  PageFacebookSchema = new Schema( {
    "pageId": String,
    "name": String,
    "profile_picture": String,
    "_account": {
      "type": Schema.Types.ObjectId,
      "ref": "Account"
    },
    "_facebook": {
      "type": Schema.Types.ObjectId,
      "ref": "Facebook"
    },
    "created_at": {
      "type": Date,
      "default": Date.now()
    },
    "updated_at": Date
  } );

PageFacebookSchema.pre( "save", function( next ) {
  this.updated_at = Date.now();
  next();
} );

const PageFacebook = mongoose.model( "PageFacebook", PageFacebookSchema );

module.exports = PageFacebook;
