import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

const testOmniRoute = async (): Promise<void> => {
  const url = process.env.OMNIROUTE_BASE_URL || 'http://localhost:20128/v1';
  const apiKey = process.env.OMNIROUTE_API_KEY || '';
  const model = process.env.OMNIROUTE_MODEL || 'auto';

  console.log('========================================================');
  console.log('🔍 Testing OmniRoute AI Connection');
  console.log('========================================================');
  console.log(`- Base URL:  ${url}`);
  console.log(`- Model:     ${model}`);
  console.log(`- Key Set:   ${apiKey ? 'Yes (' + apiKey.substring(0, 8) + '...)' : '❌ EMPTY / NOT SET'}`);

  if (!apiKey) {
    console.log('\n⚠️ Notice: OMNIROUTE_API_KEY is currently empty in .env.');
    console.log('Please paste your key into .env: OMNIROUTE_API_KEY=your_key_here');
    return;
  }

  // Test 1: Fetch Models
  try {
    console.log('\n[Check 1] Querying available models via GET /models...');
    const modelsRes = await fetch(`${url}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const modelsData = await modelsRes.json();
    console.log(`- HTTP Status: ${modelsRes.status}`);
    console.log('- Response:', JSON.stringify(modelsData, null, 2).substring(0, 300));
  } catch (err: any) {
    console.error('❌ Failed to query /models:', err.message);
  }

  // Test 2: Chat Completion
  try {
    console.log('\n[Check 2] Sending test prompt to /chat/completions...');
    const chatRes = await fetch(`${url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a test assistant. Respond in short valid JSON: {"status": "ok"}' },
          { role: 'user', content: 'Ping test' },
        ],
        temperature: 0.1,
      }),
    });

    const chatData = await chatRes.json();
    console.log(`- HTTP Status: ${chatRes.status}`);
    console.log('- Response:', JSON.stringify(chatData, null, 2));

    if (chatRes.ok) {
      console.log('\n🎉 OmniRoute connection test SUCCESSFUL!');
    } else {
      console.log('\n❌ OmniRoute returned an error response.');
    }
  } catch (err: any) {
    console.error('❌ Failed to call /chat/completions:', err.message);
  }
};

testOmniRoute()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
