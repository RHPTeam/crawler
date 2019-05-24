module.exports = {
  /**
   * Index or Show
   * @param req
   * @param res
   */
  "index": ( req, res ) => {
    res.status( 200 ).json( req.body );
  },
  /**
   * Create
   * @param req
   * @param res
   */
  "create": ( req, res ) => {
    res.status( 200 ).json( req.body );
  },
  /**
   * Update
   * @param req
   * @param res
   */
  "update": ( req, res ) => {
    res.status( 200 ).json( req.body );
  },
  /**
   * Delete
   * @param req
   * @param res
   */
  "delete": ( req, res ) => {
    res.status( 200 ).json( req.body );
  }
};
