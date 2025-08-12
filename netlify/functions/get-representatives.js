const fetch = require('node-fetch');  // Ensure node-fetch is installed

exports.handler = async (event) => {
    // Parse the incoming request
    const { lat, lon, address } = JSON.parse(event.body);

    // Get your API key from Netlify's environment variables
    const CICERO_KEY = process.env.CICERO_API_KEY;

    console.log('=================================');
    console.log('Fetching representatives for:');
    console.log('Latitude:', lat);
    console.log('Longitude:', lon);
    console.log('Address:', address);
    console.log('=================================');

    try {
        // We'll collect all officials from different API calls
        let allOfficials = [];
        let allDistricts = [];

        // Step 1: Fetch legislative districts for this location
        console.log('Step 1: Fetching legislative districts...');
        const districtUrl = `https://cicero.azavea.com/v3.1/legislative_district?lat=${lat}&lon=${lon}&format=json&key=${CICERO_KEY}`;
        const districtResponse = await fetch(districtUrl);
        const districtData = await districtResponse.json();

        if (districtData.response && districtData.response.results) {
            allDistricts = districtData.response.results.districts || [];
            console.log(`Found ${allDistricts.length} legislative districts`);
        }

        // Step 2: Fetch officials from the main endpoint
        console.log('Step 2: Fetching officials from main endpoint...');
        const officialUrl = `https://cicero.azavea.com/v3.1/official?lat=${lat}&lon=${lon}&format=json&key=${CICERO_KEY}`;
        const officialResponse = await fetch(officialUrl);
        const officialData = await officialResponse.json();

        if (officialData.response && officialData.response.results && officialData.response.results.officials) {
            const officials = officialData.response.results.officials;
            console.log(`Found ${officials.length} officials from main endpoint`);
            allOfficials = allOfficials.concat(officials);
        }

        // Step 3: Fetch non-legislative districts (mayors, governors, etc.)
        console.log('Step 3: Fetching non-legislative districts...');
        const nonLegUrl = `https://cicero.azavea.com/v3.1/nonlegislative_district?lat=${lat}&lon=${lon}&format=json&key=${CICERO_KEY}`;
        const nonLegResponse = await fetch(nonLegUrl);
        const nonLegData = await nonLegResponse.json();

        if (nonLegData.response && nonLegData.response.results && nonLegData.response.results.districts) {
            const nonLegDistricts = nonLegData.response.results.districts;
            console.log(`Found ${nonLegDistricts.length} non-legislative districts`);

            // For each non-legislative district, try to get officials
            for (const district of nonLegDistricts) {
                if (district.id) {
                    try {
                        console.log(`Fetching officials for district: ${district.name || district.district_type}`);
                        const districtOfficialUrl = `https://cicero.azavea.com/v3.1/official?district_id=${district.id}&format=json&key=${CICERO_KEY}`;
                        const districtOfficialResponse = await fetch(districtOfficialUrl);
                        const districtOfficialData = await districtOfficialResponse.json();

                        if (districtOfficialData.response && districtOfficialData.response.results && districtOfficialData.response.results.officials) {
                            const districtOfficials = districtOfficialData.response.results.officials;
                            console.log(`Found ${districtOfficials.length} officials in ${district.name}`);
                            allOfficials = allOfficials.concat(districtOfficials);
                        }
                    } catch (err) {
                        console.log(`Could not fetch officials for district ${district.id}`);
                    }
                }
            }
        }

        // Step 4: Try to get election-related officials
        console.log('Step 4: Fetching election officials...');
        const electionUrl = `https://cicero.azavea.com/v3.1/election_event?lat=${lat}&lon=${lon}&format=json&key=${CICERO_KEY}`;
        try {
            const electionResponse = await fetch(electionUrl);
            const electionData = await electionResponse.json();

            if (electionData.response && electionData.response.results) {
                console.log('Found election data');
            }
        } catch (err) {
            console.log('No election data available');
        }

        // Remove duplicates based on official ID or name
        const uniqueOfficials = [];
        const seen = new Set();

        allOfficials.forEach(official => {
            // Create a unique key for each official
            const key = official.id || `${official.first_name}-${official.last_name}-${official.office?.name}`.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                uniqueOfficials.push(official);
            }
        });

        console.log('=================================');
        console.log(`Total unique officials found: ${uniqueOfficials.length}`);
        console.log('=================================');

        // Log the types of officials found for debugging
        const officeTypes = new Set();
        uniqueOfficials.forEach(off => {
            if (off.office && off.office.name) {
                officeTypes.add(off.office.name);
            }
        });
        console.log('Office types found:', Array.from(officeTypes));

        // Return the combined data
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                response: {
                    results: {
                        officials: uniqueOfficials,
                        districts: allDistricts,
                        metadata: {
                            total_officials: uniqueOfficials.length,
                            source: 'cicero_combined',
                            timestamp: new Date().toISOString()
                        }
                    }
                }
            })
        };

    } catch (error) {
        console.error('Error fetching from Cicero:', error);
        console.error('Error in get-representatives function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to fetch representatives',
                details: error.message
            }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        };
    }
};
