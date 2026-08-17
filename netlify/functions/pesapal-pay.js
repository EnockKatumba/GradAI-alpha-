const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  const PESAPAL_KEY = process.env.PESAPAL_KEY;
  const PESAPAL_SECRET = process.env.PESAPAL_SECRET;
  const BASE_URL = process.env.URL || 'https://gradai.tech';
  const PESAPAL_BASE = 'https://pay.pesapal.com/v3/api';

  try {
    const { email, phone, firstName, lastName } = JSON.parse(event.body);

    const authRes = await fetch(`${PESAPAL_BASE}/Auth/RequestToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ consumer_key: PESAPAL_KEY, consumer_secret: PESAPAL_SECRET })
    });
    const { token } = await authRes.json();

    const ipnRes = await fetch(`${PESAPAL_BASE}/URLSetup/RegisterIPN`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ url: `${BASE_URL}/.netlify/functions/pesapal-ipn`, ipn_notification_type: 'GET' })
    });
    const { ipn_id } = await ipnRes.json();

    const orderId = 'GR-' + Date.now();
    const orderRes = await fetch(`${PESAPAL_BASE}/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        id: orderId,
        currency: 'UGX',
        amount: 26000,
        description: 'GradIA Pro - Monthly Subscription',
        callback_url: `${BASE_URL}/?payment=success`,
        notification_id: ipn_id,
        billing_address: {
          email_address: email,
          phone_number: phone || '',
          first_name: firstName || 'Student',
          last_name: lastName || '',
          country_code: 'UG'
        }
      })
    });

    const orderData = await orderRes.json();
    return { statusCode: 200, headers, body: JSON.stringify(orderData) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

module.exports = { handler };
