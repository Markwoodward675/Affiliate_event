const sdk = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const requiredEnvVars = [
  'NEXT_PUBLIC_APPWRITE_ENDPOINT',
  'NEXT_PUBLIC_APPWRITE_PROJECT_ID',
  'NEXT_PUBLIC_APPWRITE_DATABASE_ID',
  'APPWRITE_API_KEY'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Error: Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`- ${varName}`));
  console.error('\nPlease fill in your .env.local file with your Appwrite credentials.');
  process.exit(1);
}

// Initialize the Admin SDK Client
const client = new sdk.Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = 'users';
const TASKS_COLLECTION_ID = 'tasks';
const COMPLETIONS_COLLECTION_ID = 'completions';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const setup = async () => {
  try {
    console.log('Setting up Appwrite database...');
    console.log('Verifying connection parameters...');

    // Correct Appwrite Server SDK syntax uses an Object parameter
    await databases.get({ databaseId: DATABASE_ID });
    console.log('✓ Database verified successfully');

    // --- Users Collection ---
    try {
      await databases.getCollection({ databaseId: DATABASE_ID, collectionId: USERS_COLLECTION_ID });
      console.log('✓ Users collection already exists');
    } catch (error) {
      console.log('Creating Users collection...');
      await databases.createCollection({
        databaseId: DATABASE_ID,
        collectionId: USERS_COLLECTION_ID,
        name: 'Users'
      });
      await delay(1000);

      await databases.createStringAttribute({ databaseId: DATABASE_ID, collectionId: USERS_COLLECTION_ID, key: 'userId', size: 255, required: true });
      await databases.createStringAttribute({ databaseId: DATABASE_ID, collectionId: USERS_COLLECTION_ID, key: 'email', size: 255, required: true });
      await databases.createStringAttribute({ databaseId: DATABASE_ID, collectionId: USERS_COLLECTION_ID, key: 'referredBy', size: 255, required: false });
      await databases.createStringAttribute({ databaseId: DATABASE_ID, collectionId: USERS_COLLECTION_ID, key: 'referralCode', size: 8, required: true });
      await databases.createIntegerAttribute({ databaseId: DATABASE_ID, collectionId: USERS_COLLECTION_ID, key: 'tierLevel', required: true, default: 0 });
      await databases.createFloatAttribute({ databaseId: DATABASE_ID, collectionId: USERS_COLLECTION_ID, key: 'totalReferralEarnings', required: true, default: 0 });
      
      console.log('Waiting for attributes to process...');
      await delay(3000);

      await databases.createIndex({ databaseId: DATABASE_ID, collectionId: USERS_COLLECTION_ID, key: 'userId', type: 'unique', attributes: ['userId'] });
      await databases.createIndex({ databaseId: DATABASE_ID, collectionId: USERS_COLLECTION_ID, key: 'referralCode', type: 'unique', attributes: ['referralCode'] });

      console.log('✓ Users attributes and indexes successfully created');
    }

    // --- Tasks Collection ---
    try {
      await databases.getCollection({ databaseId: DATABASE_ID, collectionId: TASKS_COLLECTION_ID });
      console.log('✓ Tasks collection already exists');
    } catch (error) {
      console.log('Creating Tasks collection...');
      await databases.createCollection({
        databaseId: DATABASE_ID,
        collectionId: TASKS_COLLECTION_ID,
        name: 'Tasks'
      });
      await delay(1000);

      await databases.createStringAttribute({ databaseId: DATABASE_ID, collectionId: TASKS_COLLECTION_ID, key: 'taskId', size: 255, required: true });
      await databases.createStringAttribute({ databaseId: DATABASE_ID, collectionId: TASKS_COLLECTION_ID, key: 'title', size: 255, required: true });
      await databases.createStringAttribute({ databaseId: DATABASE_ID, collectionId: TASKS_COLLECTION_ID, key: 'category', size: 50, required: true });
      await databases.createFloatAttribute({ databaseId: DATABASE_ID, collectionId: TASKS_COLLECTION_ID, key: 'payout', required: true, default: 0 });
      await databases.createStringAttribute({ databaseId: DATABASE_ID, collectionId: TASKS_COLLECTION_ID, key: 'difficulty', size: 50, required: true });
      await databases.createStringAttribute({ databaseId: DATABASE_ID, collectionId: TASKS_COLLECTION_ID, key: 'affiliateUrl', size: 500, required: true });
      await databases.createBooleanAttribute({ databaseId: DATABASE_ID, collectionId: TASKS_COLLECTION_ID, key: 'isActive', required: true, default: true });

      console.log('Waiting for attributes to process...');
      await delay(3000);

      await databases.createIndex({ databaseId: DATABASE_ID, collectionId: TASKS_COLLECTION_ID, key: 'category', type: 'key', attributes: ['category'] });
      await databases.createIndex({ databaseId: DATABASE_ID, collectionId: TASKS_COLLECTION_ID, key: 'isActive', type: 'key', attributes: ['isActive'] });

      console.log('✓ Tasks attributes and indexes successfully created');
    }

    // --- Completions Collection ---
    try {
      await databases.getCollection({ databaseId: DATABASE_ID, collectionId: COMPLETIONS_COLLECTION_ID });
      console.log('✓ Completions collection already exists');
    } catch (error) {
      console.log('Creating Completions collection...');
      await databases.createCollection({
        databaseId: DATABASE_ID,
        collectionId: COMPLETIONS_COLLECTION_ID,
        name: 'Completions'
      });
      await delay(1000);

      await databases.createStringAttribute({ databaseId: DATABASE_ID, collectionId: COMPLETIONS_COLLECTION_ID, key: 'completionId', size: 255, required: true });
      await databases.createStringAttribute({ databaseId: DATABASE_ID, collectionId: COMPLETIONS_COLLECTION_ID, key: 'userId', size: 255, required: true });
      await databases.createStringAttribute({ databaseId: DATABASE_ID, collectionId: COMPLETIONS_COLLECTION_ID, key: 'taskId', size: 255, required: true });
      await databases.createStringAttribute({ databaseId: DATABASE_ID, collectionId: COMPLETIONS_COLLECTION_ID, key: 'status', size: 50, required: true });
      await databases.createFloatAttribute({ databaseId: DATABASE_ID, collectionId: COMPLETIONS_COLLECTION_ID, key: 'payoutEarned', required: true, default: 0 });
      await databases.createDatetimeAttribute({ databaseId: DATABASE_ID, collectionId: COMPLETIONS_COLLECTION_ID, key: 'timestamp', required: true });

      console.log('✓ Completions attributes successfully created');
    }

    console.log('\n🎉 Appwrite database setup completed successfully!');
  } catch (error) {
    console.error('\n❌ Error setting up Appwrite database:');
    console.error(error.message || error);
    process.exit(1);
  }
};

setup();