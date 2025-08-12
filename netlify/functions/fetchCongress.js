const fetch = require('node-fetch');  // Ensure node-fetch is installed
const apiUrl = 'https://api.congress.gov/v3/legislators';

exports.handler = async (event, context) => {
    // Get state from query params
    const state = event.queryStringParameters.state;

    // Access the environment variable (set in Netlify)
    const congressApiKey = process.env.CONGRESS_API_KEY;

    // Ensure the state parameter is passed
    if (!state) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'State parameter is required' })
        };
    }

    // Construct the API URL with the state
    const congressApiUrl = `${apiUrl}?state=${state}&format=json`;

    try {
        // Fetch data from Congress.gov API with the state
        const response = await fetch(congressApiUrl, {
            headers: {
                'Authorization': `Bearer ${congressApiKey}`  // Use API key securely
            },
        });

        // Handle unsuccessful API response
        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: 'Failed to fetch data from Congress.gov API' }),
            };
        }

        // Parse the API response
        const data = await response.json();

        // Return the list of legislators
        return {
            statusCode: 200,
            body: JSON.stringify(data.results.legislators),
        };

    } catch (error) {
        // Catch any errors and return a 500 status
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error fetching data from Congress.gov API' }),
        };
    }
};
