/* eslint-disable strict */
module.exports = {
  "converSourceUnix": ( url ) => {
    return url.replace( /\\\//gi, "/" );
  },
  "convertUnicodeToCharacter": ( str ) => {
    return str.replace( /\\u[\dA-F]{4}/gi, ( match ) => {
      return String.fromCharCode( parseInt( match.replace( /\\u/g, "" ), 16 ) );
    } );
  },
  "findSubString": ( str, start, end ) => {
    if ( !end ) {
      return str.substring( str.indexOf( start ) + start.length );
    }
    return str.substring(
      str.indexOf( start ) + start.length,
      str.indexOf( end, str.indexOf( start ) + start.length )
    );
  },
  "getObjectDate": ( str ) => {
    const date = new Date( str );

    return {
      "second": date.getSeconds(),
      "minute": date.getMinutes(),
      "hour": date.getHours(),
      "date": date.getDate(),
      "month": date.getMonth(),
      "day": date.getDay(),
      "year": date.getFullYear()
    };
  }
};
