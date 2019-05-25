module.exports = {
  "removeDuplicates": ( arr ) => {
    return arr.filter( ( v, i ) => arr.indexOf( v ) === i );
  },
  "getRandom": ( arr, n ) => {
    let result = new Array( n ),
      len = arr.length,
      taken = new Array( len );

    if ( n > len ) {
      throw new RangeError( "getRandom: more elements taken than available" );
    }
    // eslint-disable-next-line no-param-reassign
    while ( n-- ) {
      let x = Math.floor( Math.random() * len );

      result[ n ] = arr[ x in taken ? taken[ x ] : x ];
      taken[ x ] = --len in taken ? taken[ len ] : len;
    }
    return result;
  },
  "getUnique": ( arr, comp ) => {
    return arr
      .map( ( e ) => e[ comp ] )

    // store the keys of the unique objects
      .map( ( e, i, final ) => final.indexOf( e ) === i && i )

    // eliminate the dead keys & store unique objects
      .filter( ( e ) => arr[ e ] ).map( ( e ) => arr[ e ] );
  },
  "checkUnique": ( arr, key, value ) => {
    return arr.some( function( el ) {
      return el[ key ] === value;
    } );
  }

};
