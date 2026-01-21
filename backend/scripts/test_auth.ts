import axios from 'axios';

const API_URL = 'http://127.0.0.1:3000';

async function testAuth() {
  try {
    console.log('0. Checking health...');
    try {
      const health = await axios.get(API_URL);
      console.log('✅ Server is up:', health.data);
    } catch (e: any) {
      console.log('⚠️ Server health check failed:', e.message);
    }

    console.log('1. Registering new Company + Admin...');
    const registerResponse = await axios.post(`${API_URL}/auth/register`, {
      email: `admin_${Date.now()}@construction.connect`,
      password: 'password123',
      role: 'ADMIN',
      company: {
        name: `Construction Co ${Date.now()}`,
        type: 'CONTRACTOR'
      }
    });
    console.log('✅ Register Success:', registerResponse.data.user.email);
    const token = registerResponse.data.access_token;

    console.log('2. Verifying Profile (Protected Route)...');
    const profileResponse = await axios.get(`${API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile Success:', profileResponse.data);

  } catch (error: any) {
    console.error('❌ Detailed Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    if (error.response) {
       console.error('❌ Response Data:', error.response.data);
    }
  }
}

testAuth();
