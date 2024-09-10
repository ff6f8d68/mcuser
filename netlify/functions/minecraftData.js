const fetch = require('node-fetch');

exports.handler = async (event) => {
    const username = event.queryStringParameters.username;

    if (!username) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Username query parameter is required' }),
        };
    }

    try {
        // Step 1: Get the player's UUID from the username
        const playerResponse = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
        if (!playerResponse.ok) {
            throw new Error('User not found');
        }
        const playerData = await playerResponse.json();
        
        // Step 2: Get the player's skin URL from the UUID
        const profileResponse = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${playerData.id}`);
        if (!profileResponse.ok) {
            throw new Error('Profile not found');
        }
        const profileData = await profileResponse.json();
        const properties = profileData.properties.find(prop => prop.name === 'textures');
        const textures = JSON.parse(Buffer.from(properties.value, 'base64').toString('utf8'));
        const skinUrl = textures.textures.SKIN.url;

        // Return combined data
        return {
            statusCode: 200,
            body: JSON.stringify({
                username: playerData.name,
                uuid: playerData.id,
                skinUrl: skinUrl
            }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
