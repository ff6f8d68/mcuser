exports.handler = async function(event, context) {
  const username = event.queryStringParameters.username;

  if (!username) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Username is required' })
    };
  }

  try {
    // Dynamically import node-fetch for ESM compatibility
    const fetch = (await import('node-fetch')).default;

    // Step 1: Fetch UUID using the username
    const uuidResponse = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
    
    if (!uuidResponse.ok) {
      return {
        statusCode: uuidResponse.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: `Failed to fetch UUID for username ${username}` })
      };
    }

    const uuidData = await uuidResponse.json();
    const uuid = uuidData.id;

    // Step 2: Fetch profile information using the UUID
    const profileResponse = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`);
    
    if (!profileResponse.ok) {
      return {
        statusCode: profileResponse.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Failed to fetch data from Mojang API' })
      };
    }

    const profileData = await profileResponse.json();
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(profileData)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
