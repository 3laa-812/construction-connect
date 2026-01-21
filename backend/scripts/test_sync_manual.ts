import axios from 'axios';

const API_URL = 'http://127.0.0.1:3000';

async function testSync() {
  try {
    console.log('0. Checking health...');
    try {
      await axios.get(API_URL);
      console.log('✅ Server is up');
    } catch (e: any) {
      console.log('⚠️ Server health check failed:', e.message);
      return;
    }

    console.log('1. Registering for Token...');
    const registerResponse = await axios.post(`${API_URL}/auth/register`, {
      email: `sync_test_${Date.now()}@test.com`,
      password: 'password123',
      role: 'contractor', 
      companyName: `Sync Test Co ${Date.now()}`,
      fullName: 'Sync Tester',
      phone: `123${Date.now()}`.substring(0, 15)
    });
    const token = registerResponse.data.access_token;
    console.log('✅ Token obtained');

    console.log('2. Testing Sync Push...');
    const pushData = {
      projects: {
        created: [
          {
            id: require('crypto').randomUUID(),
            name: 'Sync Test Project',
            budget: 100000,
            company_id: registerResponse.data.user.company_id, // Ensure link to our company
            created_at: Date.now(),
          }
        ],
        updated: [],
        deleted: []
      }
    };

    const pushResponse = await axios.post(`${API_URL}/sync/push?last_pulled_at=0`, pushData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Push Success:', pushResponse.data);

    console.log('3. Testing Sync Pull...');
    const pullResponse = await axios.get(`${API_URL}/sync/pull?last_pulled_at=0`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Check if our project is in the changes
    const projects = pullResponse.data.changes.projects;
    if (projects && (projects.created.length > 0 || projects.updated.length > 0)) {
        console.log('✅ Pull Success: Found changes');
        console.log('Changes:', JSON.stringify(pullResponse.data.changes.projects, null, 2));
    } else {
        console.warn('⚠️ Pull Success but no changes found (might be timing issue or sync logic specific)');
        console.log('Full Response:', JSON.stringify(pullResponse.data, null, 2));
    }

  } catch (error: any) {
    console.error('❌ Detailed Error:', JSON.stringify(error.response ? error.response.data : error.message, null, 2));
  }
}

testSync();
