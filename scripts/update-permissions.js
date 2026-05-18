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
const { Permission, Role } = sdk;

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = 'users';
const TASKS_COLLECTION_ID = 'tasks';
const COMPLETIONS_COLLECTION_ID = 'completions';
const WITHDRAWALS_COLLECTION_ID = 'withdrawals';
const PLATFORMS_COLLECTION_ID = 'platforms';
const NOTIFICATIONS_COLLECTION_ID = 'notifications';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const updatePermissions = async () => {
  try {
    console.log('Updating Appwrite collection permissions...\n');

    // --- Users Collection Permissions ---
    console.log('Updating Users collection permissions...');
    await databases.updateCollection({
      databaseId: DATABASE_ID,
      collectionId: USERS_COLLECTION_ID,
      name: 'Users',
      permissions: [
        Permission.read(Role.users()),
        Permission.write(Role.users())
      ]
    });
    console.log('✓ Users collection permissions updated');
    await delay(1000);

    // --- Tasks Collection Permissions ---
    console.log('Updating Tasks collection permissions...');
    await databases.updateCollection({
      databaseId: DATABASE_ID,
      collectionId: TASKS_COLLECTION_ID,
      name: 'Tasks',
      permissions: [
        Permission.read(Role.any()),
        Permission.read(Role.users())
      ]
    });
    console.log('✓ Tasks collection permissions updated');
    await delay(1000);

    // --- Completions Collection Permissions ---
    console.log('Updating Completions collection permissions...');
    await databases.updateCollection({
      databaseId: DATABASE_ID,
      collectionId: COMPLETIONS_COLLECTION_ID,
      name: 'Completions',
      permissions: [
        Permission.read(Role.users()),
        Permission.write(Role.users())
      ]
    });
    console.log('✓ Completions collection permissions updated');
    await delay(1000);

    // --- Withdrawals Collection Permissions ---
    console.log('Updating Withdrawals collection permissions...');
    await databases.updateCollection({
      databaseId: DATABASE_ID,
      collectionId: WITHDRAWALS_COLLECTION_ID,
      name: 'Withdrawals',
      permissions: [
        Permission.read(Role.users()),
        Permission.write(Role.users())
      ]
    });
    console.log('✓ Withdrawals collection permissions updated');
    await delay(1000);

    // --- Platforms Collection Permissions ---
    console.log('Updating Platforms collection permissions...');
    await databases.updateCollection({
      databaseId: DATABASE_ID,
      collectionId: PLATFORMS_COLLECTION_ID,
      name: 'Platforms',
      permissions: [
        Permission.read(Role.any()),
        Permission.read(Role.users())
      ]
    });
    console.log('✓ Platforms collection permissions updated');
    await delay(1000);

    // --- Notifications Collection Permissions ---
    console.log('Updating Notifications collection permissions...');
    await databases.updateCollection({
      databaseId: DATABASE_ID,
      collectionId: NOTIFICATIONS_COLLECTION_ID,
      name: 'Notifications',
      permissions: [
        Permission.read(Role.users()),
        Permission.write(Role.users())
      ]
    });
    console.log('✓ Notifications collection permissions updated');

    console.log('\n🎉 All collection permissions updated successfully!');
  } catch (error) {
    console.error('\n❌ Error updating permissions:');
    console.error(error.message || error);
    process.exit(1);
  }
};

updatePermissions();
