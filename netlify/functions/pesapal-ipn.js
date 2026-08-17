const handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  const params = event.queryStringParameters || {};
  const { OrderTrackingId } = params;
  if (!OrderTrackingId) return { statusCode: 400, headers, body: JSON.stringify({ status: 400 }) };
  try {
    const authRes = await fetch('https://pay.pesapal.com/v3/api/Auth/RequestToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ consumer_key: process.env.PESAPAL_KEY, consumer_secret: process.env.PESAPAL_SECRET })
    });
    const { token } = await authRes.json();
    const statusRes = await fetch(`https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`, {
      headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
    });
    const statusData = await statusRes.json();
    console.log('Payment status:', JSON.stringify(statusData));
    return { statusCode: 200, headers, body: JSON.stringify({ status: 200 }) };
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ status: 200 }) };
  }
};

module.exports = { handler };
