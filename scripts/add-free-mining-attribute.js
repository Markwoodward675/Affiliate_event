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

    console.log('\n🎉 Attribute added! Now existing users will need this attribute set.');
  } catch (error) {
    if (error.response && error.response.code === 409) {
      console.log('✓ freeMiningEnabled attribute already exists');
    } else {
      console.error('\n❌ Error adding attribute:');
      console.error(error.message || error);
      process.exit(1);
    }
  }
};

addAttribute();
