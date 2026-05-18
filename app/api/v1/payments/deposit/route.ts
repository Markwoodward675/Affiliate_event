import { NextResponse } from 'next/server';
import { Client, Databases, ID } from 'node-appwrite';

const client = new Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);

export async function POST(request: Request) {
  try {
    const { amount, userId } = await request.json();

    if (!amount || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const nowPaymentsResponse = await fetch('https://api.nowpayments.io/v3/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: 'usd',
        pay_currency: 'USDTBSC',
        order_id: userId,
      }),
    });

    if (!nowPaymentsResponse.ok) {
      const error = await nowPaymentsResponse.text();
      console.error('NowPayments error:', error);
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    const invoiceData = await nowPaymentsResponse.json();

    const now = new Date().toISOString();
    await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      'user_activities',
      ID.unique(),
      {
        userId,
        activityType: 'DEPOSIT_INITIATED',
        description: `Initiated deposit of $${amount.toFixed(2)} USDT via BSC Network`,
        timestamp: now,
      }
    );

    return NextResponse.json({ invoiceUrl: invoiceData.invoice_url });
  } catch (error) {
    console.error('Deposit route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
