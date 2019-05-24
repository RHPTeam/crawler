/* eslint-disable one-var */
/* eslint-disable camelcase */
const mongoose = require( "mongoose" ),
  Schema = mongoose.Schema,

  PostCategorySchema = new Schema( {
    "title": String,
    "description": String,
    "_account": {
      "type": Schema.Types.ObjectId,
      "ref": "Account"
    },
    "created_at": {
      "type": Date,
      "default": Date.now()
    },
    "updated_at": Date
  } );

PostCategorySchema.pre( "save", function( next ) {
  this.updated_at = Date.now();
  next();
} );

const PostCategory = mongoose.model( "PostCategory", PostCategorySchema );

module.exports = PostCategory;
