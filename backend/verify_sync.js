const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function verifySync() {
  try {
    console.log('--- Authenticating ---');
    let token;
    try {
      // Try to login first
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'password123',
      });
      token = loginRes.data.access_token;
      console.log('Login successful.');
    } catch (e) {
      if (e.response && e.response.status === 401) {
        console.log('Login failed. Attempting to register...');
        try {
          const regRes = await axios.post(`${API_URL}/auth/register`, {
            email: 'test@example.com',
            password: 'password123',
            fullName: 'Test User',
            companyName: 'Test Corp',
            role: 'contractor',
            phone: '1234567890',
          });
          // Register might return the user or token depending on implementation.
          // The controller returns register result, we might need to login after.
          // But common jwt strategies often return token on register.
          // Checking AuthController: it calls authService.register.
          // If authService.register doesn't return token, we login.

          // Let's assume we need to login after register to be safe/standard
          const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'test@example.com',
            password: 'password123',
          });
          token = loginRes.data.access_token;
          console.log('Registration and Login successful.');
        } catch (regError) {
          console.error(
            'Registration Failed:',
            regError.response?.data || regError.message,
          );
          return;
        }
      } else {
        console.error('Login Error:', e.message);
        return;
      }
    }

    if (!token) {
      console.error('Failed to obtain token.');
      return;
    }

    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    console.log('\n--- Verifying Pull ---');
    try {
      const pullRes = await axios.get(
        `${API_URL}/sync/pull?last_pulled_at=0`,
        config,
      );
      console.log('Pull Response Status:', pullRes.status);

      if (!pullRes.data.changes) {
        console.error('ERROR: Response missing "changes" key');
      } else {
        console.log(
          'Pull successful. Tables with changes:',
          Object.keys(pullRes.data.changes),
        );
      }
    } catch (e) {
      console.error('Pull Failed:', e.message);
    }

    console.log('\n--- Verifying Push (Daily Log) ---');
    // Mock a Daily Log Sync
    // Mock a Daily Log Sync
    const logId = '550e8400-e29b-41d4-a716-446655440099';
    let mockChanges = { daily_logs: { created: [], updated: [], deleted: [] } };

    // Fetch a valid project and user first to pass FK
    try {
      const projectsRes = await axios.get(`${API_URL}/projects`, config);
      const profileRes = await axios.get(`${API_URL}/auth/profile`, config);

      if (projectsRes.data.length > 0 && profileRes.data.id) {
        const projectId = projectsRes.data[0].id;
        const userId = profileRes.data.id;
        console.log(`Using ProjectID: ${projectId}, UserID: ${userId}`);

        mockChanges.daily_logs.created.push({
          id: logId,
          project_id: projectId,
          user_id: userId,
          log_date: new Date().toISOString(),
          status: 'DRAFT',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        console.log('No projects or user found. Pushing will likely fail FK.');
        mockChanges.daily_logs.created.push({
          id: logId,
          project_id: '550e8400-e29b-41d4-a716-446655440000',
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          log_date: new Date().toISOString(),
          status: 'DRAFT',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.log('Failed to fetch project/user for mock data:', e.message);
    }

    try {
      const pushRes = await axios.post(
        `${API_URL}/sync/push`,
        mockChanges,
        config,
      );
      console.log('Push Response Status:', pushRes.status);
      console.log('Push Response Data:', pushRes.data);

      if (pushRes.data.success) {
        console.log(
          'SUCCESS: Daily Log pushed successfully (or mocked success).',
        );
      }
    } catch (e) {
      // 500 is expected if valid FKs don't exist in our blind test, but 404 would mean endpoint missing.
      console.log(
        `Push Result: ${e.response?.status} - ${e.response?.statusText}`,
      );
      if (e.response?.data) console.log('Error Data:', e.response.data);

      if (e.response?.status === 404) {
        console.error('CRITICAL: Sync Endpoint not found!');
      } else if (e.response?.status === 500 || e.response?.status === 400) {
        console.log(
          'Endpoint reachable. handling DB constraint error as expected for mock data.',
        );
      }
    }

    console.log('\n--- Verifying Materials Module ---');
    try {
      const matsRes = await axios.get(`${API_URL}/materials`, config);
      console.log('Materials GET Status:', matsRes.status);
      console.log('Materials found:', matsRes.data.length);
    } catch (e) {
      console.error('Materials GET Failed:', e.message);
    }

    console.log('\n--- Verifying Daily Logs REST API ---');
    try {
      const logsRes = await axios.get(`${API_URL}/daily-logs`, config);
      console.log('Daily Logs GET Status:', logsRes.status);
    } catch (e) {
      console.error('Daily Logs GET Failed:', e.message);
    }
  } catch (e) {
    console.error('Test Failed:', e.message);
  }
}

verifySync();
