import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, ID, Query } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const USERS_COLLECTION_ID = 'users';
const TASKS_COLLECTION_ID = 'tasks';
const COMPLETIONS_COLLECTION_ID = 'completions';

export async function GET(req: NextRequest) {
  return handlePostback(req);
}

export async function POST(req: NextRequest) {
  return handlePostback(req);
}

async function handlePostback(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const payout = parseFloat(searchParams.get('payout') || '0');
    const taskId = searchParams.get('taskId');

    if (!userId || !payout || !taskId) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, payout, taskId' },
        { status: 400 }
      );
    }

    const usersResponse = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );

    if (usersResponse.documents.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userDoc = usersResponse.documents[0];
    const newTotalEarnings = (userDoc.totalReferralEarnings || 0) + payout;

    await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userDoc.$id,
      {
        totalReferralEarnings: newTotalEarnings
      }
    );

    if (userDoc.referredBy) {
      const referrersResponse = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal('referralCode', userDoc.referredBy)]
      );

      if (referrersResponse.documents.length > 0) {
        const referrerDoc = referrersResponse.documents[0];
        const referrerBonus = payout * 0.1;
        const newReferrerEarnings = (referrerDoc.totalReferralEarnings || 0) + referrerBonus;

        await databases.updateDocument(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          referrerDoc.$id,
          {
            totalReferralEarnings: newReferrerEarnings,
            tierLevel: (referrerDoc.tierLevel || 0) + 1
          }
        );
      }
    }

    await databases.createDocument(
      DATABASE_ID,
      COMPLETIONS_COLLECTION_ID,
      ID.unique(),
      {
        completionId: ID.unique(),
        userId,
        taskId,
        status: 'Completed',
        payoutEarned: payout,
        timestamp: new Date().toISOString()
      }
    );

    return NextResponse.json({ success: true, message: 'Postback processed' });
  } catch (error) {
    console.error('Postback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
