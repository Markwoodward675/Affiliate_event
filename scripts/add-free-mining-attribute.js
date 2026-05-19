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

const client = new sdk.Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = 'users';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const addAttribute = async () => {
  try {
    console.log('Adding freeMiningEnabled attribute to users collection...');
    
    try {
      await databases.createBooleanAttribute({
        databaseId: DATABASE_ID,
        collectionId: USERS_COLLECTION_ID,
        key: 'freeMiningEnabled',
        required: true,
        default: true
      });

      console.log('✓ freeMiningEnabled attribute added successfully!');
      console.log('Waiting for attribute to process...');
      await delay(3000);
    } catch (attrError) {
      const attrErrorMessage = (attrError.message || String(attrError)).toLowerCase();
      if (attrErrorMessage.includes('already exists')) {
        console.log('✓ freeMiningEnabled attribute already exists');
      } else {
        throw attrError;
      }
    }

    console.log('\nUpdating existing users to have freeMiningEnabled = true...');
    let offset = 0;
    let totalUpdated = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [sdk.Query.offset(offset), sdk.Query.limit(100)]
      );

      for (const user of response.documents) {
        if (!user.freeMiningEnabled) {
          try {
            await databases.updateDocument(
              DATABASE_ID,
              USERS_COLLECTION_ID,
              user.$id,
              {
                freeMiningEnabled: true
              }
            );
            totalUpdated++;
          } catch (updateError) {
            console.log(`  - Skipped user ${user.$id}: ${updateError.message}`);
          }
        }
      }

      offset += response.documents.length;
      hasMore = response.documents.length === 100;
    }

    console.log(`\n🎉 Done! Updated ${totalUpdated} existing users.`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:');
    console.error(error.message || error);
    process.exit(1);
  }
};

addAttribute();
