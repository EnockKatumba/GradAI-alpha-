const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  const SUBSCRIPTION_KEY = process.env.MTN_SUBSCRIPTION_KEY;
  const API_USER = process.env.MTN_API_USER;
  const API_KEY = process.env.MTN_API_KEY;
  const ENV = process.env.MTN_ENV || 'mtncameroon'; // change to your country e.g. mtnuganda
  
  // Auto-detect sandbox vs live
  const BASE_URL = ENV === 'sandbox' 
    ? 'https://sandbox.momodeveloper.mtn.com'
    : 'https://proxy.momoapi.mtn.com';

  try {
    const { phone, amount, name, email } = JSON.parse(event.body);

    // Step 1 — Get access token
    const tokenRes = await fetch(`${BASE_URL}/collection/token/`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${API_USER}:${API_KEY}`).toString('base64'),
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
        'X-Target-Environment': ENV
      }
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('Failed to get MTN token: ' + JSON.stringify(tokenData));
    const { access_token } = tokenData;

    // Step 2 — Request to pay
    const referenceId = crypto.randomUUID();
    const cleanPhone = phone.replace(/\D/g, '');
    
    const payRes = await fetch(`${BASE_URL}/collection/v1_0/requesttopay`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': ENV,
        'X-Callback-Url': 'https://gradai.tech/.netlify/functions/mtn-callback',
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: String(amount || '26000'),
        currency: 'UGX',
        externalId: 'GRADAI-' + Date.now(),
        payer: {
          partyIdType: 'MSISDN',
          partyId: cleanPhone
        },
        payerMessage: 'GradAI Pro - Monthly Subscription',
        payeeNote: `Payment from ${name || 'Student'}`
      })
    });

    if (payRes.status === 202) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          referenceId,
          message: 'Payment request sent! Check your MTN phone and approve the payment prompt.'
        })
      };
    } else {
      const errData = await payRes.text();
      throw new Error('MTN error: ' + errData);
    }

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

module.exports = { handler };
