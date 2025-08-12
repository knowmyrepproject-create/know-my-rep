// netlify/functions/fetchCongress.js

const fetch = require('node-fetch');  // Ensure node-fetch is installed

exports.handler = async (event, context) => {
    const state = event.queryStringParameters.state; // Get state from query params

    const congressApiKey = process.env.CONGRESS_API_KEY; // Access the environment variable (set in Netlify)

    if (!state) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'State parameter is required' })
        };
    }

    const congressApiUrl = `https://api.congress.gov/v3/legislators?state=${state}&format=json`;

    try {
        const response = await fetch(congressApiUrl, {
            headers: {
                'Authorization': `Bearer ${congressApiKey}`  // Use API key securely
            }
        });

        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: 'Failed to fetch data from Congress.gov API' })
            };
        }

        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data.results.legislators), // Return the list of legislators
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error fetching data from Congress.gov API' }),
        };
    }
};
