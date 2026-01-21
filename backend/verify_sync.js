
const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function verifySync() {
    try {
        console.log('--- Verifying Pull ---');
        const pullRes = await axios.get(`${API_URL}/sync/pull?last_pulled_at=0`);
        console.log('Pull Response Status:', pullRes.status);
        console.log('Pull Response Data:', JSON.stringify(pullRes.data, null, 2));
        
        if (!pullRes.data.changes) {
            console.error('ERROR: Response missing "changes" key');
            return;
        }

        console.log('Pull Changes Keys:', Object.keys(pullRes.data.changes));
        
        console.log('\n--- Verifying Push ---');
        // Mock a change
        // Use a UUID for ID to avoid format errors if UUID is required
        const mockChanges = {
            companies: {
                created: [
                    { 
                        id: '550e8400-e29b-41d4-a716-446655440001', 
                        name: 'Test Company via Sync', 
                        type: 'CONTRACTOR',
                        wallet_balance: 0,
                        created_at: new Date().toISOString()
                    }
                ],
                updated: [],
                deleted: []
            }
        };

        try {
            const pushRes = await axios.post(`${API_URL}/sync/push?last_pulled_at=0`, mockChanges);
            console.log('Push Response Status:', pushRes.status);
            console.log('Push Response Data:', pushRes.data);
        } catch (e) {
            console.log('Push Failed (Expected if bad FK):', e.response?.data || e.message);
        }

    } catch (e) {
        console.error('Test Failed:', e.message);
        if (e.response) {
            console.error('Response Data:', e.response.data);
        }
    }
}

verifySync();
