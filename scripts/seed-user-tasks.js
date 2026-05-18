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
const USER_TASKS_COLLECTION_ID = 'user_tasks';

const sampleTasks = [
  {
    taskId: 'task-1',
    category: 'video',
    title: 'Watch 30s Portfolio Tracking & Yield Distribution Tutorial',
    rewardAmount: 0.15,
    externalUrl: 'https://example.com/tutorial'
  },
  {
    taskId: 'task-2',
    category: 'survey',
    title: 'Complete Institutional Asset Hosting Questionnaire',
    rewardAmount: 1.20,
    externalUrl: 'https://example.com/survey'
  },
  {
    taskId: 'task-3',
    category: 'email_submit',
    title: 'Subscribe to Official Hosted Mining Insights Newsletter',
    rewardAmount: 0.45,
    externalUrl: 'https://example.com/newsletter'
  },
  {
    taskId: 'task-4',
    category: 'game',
    title: 'Reach Level 15 in Bitcoin Block Producer Strategy Simulator',
    rewardAmount: 3.50,
    externalUrl: 'https://example.com/game'
  }
];

const seed = async () => {
  try {
    console.log('Seeding user tasks...');
    
    for (const task of sampleTasks) {
      try {
        await databases.createDocument(
          DATABASE_ID,
          USER_TASKS_COLLECTION_ID,
          sdk.ID.unique(),
          task
        );
        console.log(`✓ Created task: ${task.title}`);
      } catch (error) {
        if (error.response && error.response.code === 409) {
          console.log(`- Task already exists: ${task.title}`);
        } else {
          console.error(`Error creating task: ${task.title}`, error.message);
        }
      }
    }
    
    console.log('\n🎉 User tasks seeding completed!');
  } catch (error) {
    console.error('\n❌ Error seeding user tasks:');
    console.error(error.message || error);
    process.exit(1);
  }
};

seed();
