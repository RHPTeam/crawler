const Role = require( "../models/Role.model" );
const Help = require( "../models/help/Help.model" );

( async () => {
  const foundHelp = await Help.find( {} ),
    foundRole = await Role.find( {} );

  // Check Role First Time Server running
  if ( foundRole.length === undefined || foundRole.length === 0 ) {
    const arr = [
      { "level": "SuperAdmin" },
      { "level": "Admin" },
      { "level": "Member" }
    ];

    Role.insertMany( arr );
  }

  // Check Help First Time Server running
  if ( foundHelp.length === undefined || foundHelp.length === 0 ) {
    const defaultHelp = await new Help( {} );

    await defaultHelp.save();
  }
} )();
