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
    const base64TextureData = profileData.properties.find(prop => prop.name === 'textures');
    const textureData = base64TextureData ? JSON.parse(Buffer.from(base64TextureData.value, 'base64').toString('utf8')) : {};

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        id: uuidData.id,
        name: uuidData.name,
        skin: textureData.SKIN ? `https://textures.minecraft.net/texture/${textureData.SKIN.url.split('/').pop()}` : '',
        cape: textureData.CAPE ? `https://textures.minecraft.net/texture/${textureData.CAPE.url.split('/').pop()}` : ''
      })
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
