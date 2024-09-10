// netlify/functions/minecraft-users.js
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
    
    // Decode the base64-encoded textures value
    const texturesProp = profileData.properties.find(prop => prop.name === 'textures');
    if (texturesProp) {
      const texturesValue = texturesProp.value;
      const decodedTextures = JSON.parse(Buffer.from(texturesValue, 'base64').toString('utf-8'));

      // Prepare data with skin and cape URLs
      const skinUrl = decodedTextures.textures.SKIN ? decodedTextures.textures.SKIN.url : '';
      const capeUrl = decodedTextures.textures.CAPE ? decodedTextures.textures.CAPE.url : '';

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          name: profileData.name,
          id: profileData.id,
          skin: skinUrl,
          cape: capeUrl
        })
      };
    } else {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Textures property not found in profile data' })
      };
    }
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
