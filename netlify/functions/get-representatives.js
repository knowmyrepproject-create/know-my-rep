exports.handler = async (event) => {
  // Parse the incoming request
  const { lat, lon, address } = JSON.parse(event.body);
  
  // Get your API key from Netlify's environment variables
  const CICERO_KEY = process.env.CICERO_API_KEY;
  
  console.log('Fetching representatives for coordinates:', lat, lon);
  
  try {
    // Call Cicero API from the server (no CORS issues!)
    const ciceroUrl = `https://cicero.azavea.com/v3.1/official?lat=${lat}&lon=${lon}&format=json&key=${CICERO_KEY}`;
    
    const response = await fetch(ciceroUrl);
    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error fetching from Cicero:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch representatives' })
    };
  }
};
