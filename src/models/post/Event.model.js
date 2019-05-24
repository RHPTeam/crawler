/* eslint-disable one-var */
/* eslint-disable camelcase */
const mongoose = require( "mongoose" ),
  Schema = mongoose.Schema,

  EventSchema = new Schema( {
    "title": { "type": String, "required": true },
    "color": { "type": String, "default": "#85CFFF" },
    "type_event": Number,
    "status": Boolean,
    "post_category": {
      "type": Schema.Types.ObjectId,
      "ref": "PostCategory"
    },
    "post_custom": [ {
      "type": Schema.Types.ObjectId,
      "ref": "Post"
    } ],
    "timeline": [ {
      "type": Schema.Types.ObjectId,
      "ref": "Facebook"
    } ],
    "target_category": {
      "type": Schema.Types.ObjectId,
      "ref": "PostGroups"
    },
    "target_custom": [ {
      "typeTarget": Number, // Page is 1, Group is 0
      "id": String
    } ],
    "break_point": {
      "type": Number,
      "default": 15
    },
    "started_at": Date,
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

EventSchema.pre( "save", function( next ) {
  this.updated_at = Date.now();
  next();
} );

const Event = mongoose.model( "Event", EventSchema );

module.exports = Event;
