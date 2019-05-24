const mongoose = require( "mongoose" ),
  Schema = mongoose.Schema,

  RoleSchema = new Schema( {
    "level": String
  } ),

  Role = mongoose.model( "Role", RoleSchema );

module.exports = Role;
