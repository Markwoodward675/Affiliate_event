const { Client, Databases, ID } = require('appwrite');
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
  console.error('\nPlease ensure your .env.local file is properly configured.');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

// Set API key header directly
client.headers['X-Appwrite-Key'] = process.env.APPWRITE_API_KEY;

const databases = new Databases(client);
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const TASKS_COLLECTION_ID = 'tasks';

const tasks = [
  {
    taskId: 'sweepstakes-iphone-15',
    title: 'Enter to Win an iPhone 15 Pro Max (Email Submit)',
    category: 'Quick Cash',
    payout: 2.50,
    difficulty: 'Easy',
    affiliateUrl: 'https://yourtracklink.com/target_cpa_offer_1',
    isActive: true
  },
  {
    taskId: 'survey-junkie-signup',
    title: 'Complete Your First 3-Minute Premium Profile Survey',
    category: 'Quick Cash',
    payout: 1.80,
    difficulty: 'Easy',
    affiliateUrl: 'https://yourtracklink.com/target_cpa_offer_2',
    isActive: true
  },
  {
    taskId: 'monopoly-go-board-15',
    title: 'Monopoly Go: Download & Reach Board Level 15',
    category: 'Steady Income',
    payout: 35.00,
    difficulty: 'Medium',
    affiliateUrl: 'https://yourtracklink.com/target_cpa_offer_3',
    isActive: true
  },
  {
    taskId: 'dice-dreams-level-10',
    title: 'Dice Dreams: Install & Complete Kingdom Level 10',
    category: 'Steady Income',
    payout: 18.50,
    difficulty: 'Medium',
    affiliateUrl: 'https://yourtracklink.com/target_cpa_offer_4',
    isActive: true
  },
  {
    taskId: 'revolut-free-account',
    title: 'Revolut: Open a Free Account & Complete ID Verification',
    category: 'Mega Offers',
    payout: 65.00,
    difficulty: 'Hard',
    affiliateUrl: 'https://yourtracklink.com/target_cpa_offer_5',
    isActive: true
  }
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const seedTasks = async () => {
  try {
    console.log('🌱 Starting task seeding process...');
    console.log(`📋 Found ${tasks.length} tasks to seed\n`);

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      
      console.log(`Processing task ${i + 1}/${tasks.length}: ${task.title}`);
      
      try {
        // Check if task already exists
        const existingTasks = await databases.listDocuments(
          DATABASE_ID,
          TASKS_COLLECTION_ID
        );

        const existingTask = existingTasks.documents.find(doc => doc.taskId === task.taskId);

        if (existingTask) {
          console.log(`  ✅ Already exists (Skipped)\n`);
          await delay(500);
          continue;
        }

        // Create the task
        await databases.createDocument(
          DATABASE_ID,
          TASKS_COLLECTION_ID,
          ID.unique(),
          task
        );

        console.log(`  ✅ Successfully Seeded\n`);
      } catch (error) {
        console.error(`  ❌ Error seeding task:`, error.message);
      }

      // Add delay to respect API rate limits
      if (i < tasks.length - 1) {
        await delay(1000);
      }
    }

    console.log('🎉 Task seeding completed!');
  } catch (error) {
    console.error('❌ Error during task seeding:', error);
    process.exit(1);
  }
};

seedTasks();
