import axios from 'axios';

export async function handler(event) {
    const username = event.queryStringParameters.username;

    if (!username) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Username query parameter is required' }),
        };
    }

    try {
        // Step 1: Get the player's UUID from the username
        const playerResponse = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`);
        const playerData = playerResponse.data;

        // Step 2: Get the player's skin URL from the UUID
        const profileResponse = await axios.get(`https://sessionserver.mojang.com/session/minecraft/profile/${playerData.id}`);
        const profileData = profileResponse.data;
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
}
