const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const body = JSON.parse(event.body || '{}');
    console.log('MTN Callback received:', JSON.stringify(body));

    const { referenceId, status, financialTransactionId, externalId } = body;

    if (status === 'SUCCESSFUL') {
      console.log('Payment SUCCESSFUL:', { referenceId, financialTransactionId, externalId });
      // TODO: Mark user as pro in Supabase when you add DB
    } else if (status === 'FAILED') {
      console.log('Payment FAILED:', { referenceId, externalId });
    } else {
      console.log('Payment status:', status, body);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error('Callback error:', err.message);
    return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
  }
};

module.exports = { handler };
