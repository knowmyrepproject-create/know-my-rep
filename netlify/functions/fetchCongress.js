// netlify/functions/fetchCongress.js

const fetch = require('node-fetch');  // Make sure to install node-fetch if you are using it
const apiUrl = 'https://api.congress.gov/v3/legislators';

exports.handler = async (event, context) => {
  const state = event.queryStringParameters.state; // Get state from query params

  const congressApiKey = process.env.CONGRESS_API_KEY; // Access the environment variable

  try {
    const response = await fetch(`${apiUrl}?state=${state}&format=json`, {
      headers: {
        'Authorization': `Bearer ${congressApiKey}`,  // Use API key securely
      },
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Failed to fetch data from Congress.gov API' }),
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
