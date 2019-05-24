/* eslint-disable no-shadow */
const passport = require( "passport" ),
  JwtStrategy = require( "passport-jwt" ).Strategy;
const { ExtractJwt } = require( "passport-jwt" ),
  LocalStrategy = require( "passport-local" ).Strategy;
const Account = require( "../../models/Account.model" );

// JSON WEB TOKENS STRATEGY
passport.use(
  new JwtStrategy(
    {
      "jwtFromRequest": ExtractJwt.fromHeader( "authorization" ),
      "secretOrKey": process.env.APP_KEY
    },
    async ( payload, done ) => {
      try {
        // Find the user specified in token
        const user = await Account.findById( payload.sub );
        // If user doesn't exists, handle it

        if ( !user ) {
          return done( null, false );
        }
        if ( Date.now() >= user.expireDate.getTime() ) {
          return done( null, false );
        }
        // otherwise, return the user
        done( null, user );
      } catch ( e ) {
        done( e, false );
      }
    }
  )
);

// LOCAL STRATEGY
passport.use(
  new LocalStrategy(
    {
      "usernameField": "email"
    },
    async ( email, password, done ) => {
      try {
        // Find the user given the email
        const user = await Account.findOne( { email } );
        // If not, handle it

        if ( !user ) {
          return done( null, false );
        }
        // Check if the password is correct
        let isMatch = await user.isValidPassword( password );
        // If not, handle it

        if ( !isMatch ) {
          return done( null, false );
        }
        // otherwise, return the user
        done( null, user );
      } catch ( e ) {
        done( e, false );
      }
    }
  )
);

// TELL PASSPORT.JS HOW TO HANDLE A GIVEN USER OBJECT
passport.serializeUser( ( user, done ) => {
  done( null, user );
} );

// HANDLE IT WHEN A USER MAKES A REQUEST FOR A SECURED URL
passport.deserializeUser( ( id, done ) => {
  let user = Account.find( ( user ) => {
    return user.id === id;
  } );

  done( null, user );
} );
