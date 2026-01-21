import axios from 'axios';

async function verify() {
  const url = 'http://localhost:3000/companies';
  console.log(`Checking ${url}...`);
  try {
    const response = await axios.get(url);
    const companies = response.data;
    console.log(`Response status: ${response.status}`);
    console.log(`Found ${companies.length} companies.`);
    
    const alpha = companies.find((c: any) => c.name === 'Alpha Construction Co.');
    const mega = companies.find((c: any) => c.name === 'Mega Materials Supply');

    if (alpha && mega) {
      console.log('✅ Verification Successful: found both seeded companies.');
      console.log(`- ${alpha.name} (Balance: ${alpha.wallet_balance})`);
      console.log(`- ${mega.name} (Balance: ${mega.wallet_balance})`);
    } else {
      console.error('❌ Verification Failed: Seeded companies not found.');
      console.log('Received:', JSON.stringify(companies, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Verification Failed:', error.message);
    if (error.response) {
       console.error('Data:', error.response.data);
    }
    process.exit(1);
  }
}

verify();
