module.exports = ( roleString, point ) => {
  return parseInt( roleString.substr( point, 1 ) );
};
