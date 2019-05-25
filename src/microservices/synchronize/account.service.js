const axios = require( "axios" );

module.exports = {
  "update": ( url, headers, data ) => {
    return axios( {
      "method": "patch",
      "url": url,
      "data": data,
      "headers": headers
    } );
  }
};
