import { NextResponse } from 'next/server';
import { Client, Databases, ID, Query } from 'node-appwrite';

const client = new Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.payment_status === 'finished') {
      const userId = body.order_id;
      const amount = parseFloat(body.price_amount);

      const usersResponse = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        [Query.equal('userId', userId)]
      );

      if (usersResponse.documents.length > 0) {
        const userDoc = usersResponse.documents[0];
        const newBalance = (userDoc.totalReferralEarnings || 0) + amount;

        await databases.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'users',
          userDoc.$id,
          {
            totalReferralEarnings: newBalance,
          }
        );

        const now = new Date().toISOString();
        await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'user_activities',
          ID.unique(),
          {
            userId,
            activityType: 'DEPOSIT_SUCCESS',
            description: `Successfully deposited $${amount.toFixed(2)} USDT via BSC Network`,
            timestamp: now,
          }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
