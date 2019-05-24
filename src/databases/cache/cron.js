/**
 * Global variables to access everywhere and save data to handle everything
 */
const cronListObjectProperties = {};

module.exports = {
  "set": ( key, value ) => {
    Object.defineProperty( cronListObjectProperties, `rhp${key}`, {
      "value": value,
      "writable": true
    } );
  },
  "get": ( key ) => {
    return cronListObjectProperties[ `rhp${key}` ];
  },
  "object_key_exists": ( key ) => {
    if ( Object.keys( cronListObjectProperties ).includes( key ) ) {
      return true;
    }
    return false;
  }
};
