'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { databases, Query, ID } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

interface UserTask {
  $id: string;
  taskId: string;
  category: 'video' | 'survey' | 'email_submit' | 'game' | 'task';
  title: string;
  rewardAmount: number;
  externalUrl: string;
}

const categories = [
  { id: 'all', label: 'All' },
  { id: 'video', label: 'Videos' },
  { id: 'survey', label: 'Surveys' },
  { id: 'email_submit', label: 'Emails' },
  { id: 'game', label: 'Games' },
];

const sampleTasks: UserTask[] = [
  {
    $id: '1',
    taskId: 'task-1',
    category: 'video',
    title: 'Watch 30s Portfolio Tracking & Yield Distribution Tutorial',
    rewardAmount: 0.15,
    externalUrl: 'https://example.com/tutorial',
  },
  {
    $id: '2',
    taskId: 'task-2',
    category: 'survey',
    title: 'Complete Institutional Asset Hosting Questionnaire',
    rewardAmount: 1.20,
    externalUrl: 'https://example.com/survey',
  },
  {
    $id: '3',
    taskId: 'task-3',
    category: 'email_submit',
    title: 'Subscribe to Official Hosted Mining Insights Newsletter',
    rewardAmount: 0.45,
    externalUrl: 'https://example.com/newsletter',
  },
  {
    $id: '4',
    taskId: 'task-4',
    category: 'game',
    title: 'Reach Level 15 in Bitcoin Block Producer Strategy Simulator',
    rewardAmount: 3.50,
    externalUrl: 'https://example.com/game',
  },
];

export default function TasksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<UserTask[]>(sampleTasks);
  const [userData, setUserData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [verifyingTask, setVerifyingTask] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchData();
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    try {
      const tasksResponse = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'user_tasks',
        []
      );
      
      if (tasksResponse.documents.length > 0) {
        setTasks(tasksResponse.documents as unknown as UserTask[]);
      }

      const usersResponse = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        [Query.equal('userId', user?.$id)]
      );
      
      if (usersResponse.documents.length > 0) {
        setUserData(usersResponse.documents[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCompleteAction = (task: UserTask) => {
    window.open(task.externalUrl, '_blank', 'noopener,noreferrer');
  };

  const handleVerifyCompletion = async (task: UserTask) => {
    if (!userData || !user) return;

    setVerifyingTask(task.$id);

    try {
      const newBalance = (userData.totalReferralEarnings || 0) + task.rewardAmount;
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        userData.$id,
        {
          totalReferralEarnings: newBalance,
        }
      );

      const now = new Date().toISOString();
      const activityDescription = `Successfully completed the ${task.title} wall task assignment and earned $${task.rewardAmount.toFixed(2)} USDT.`;
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'user_activities',
        ID.unique(),
        {
          userId: user.$id,
          activityType: 'TASK_COMPLETED',
          description: activityDescription,
          timestamp: now,
        }
      );

      fetchData();
    } catch (error) {
      console.error('Error verifying task:', error);
    } finally {
      setVerifyingTask(null);
    }
  };

  const filteredTasks = activeCategory === 'all'
    ? tasks
    : tasks.filter(task => task.category === activeCategory);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Task Wall</h2>
            <p className="text-gray-600 dark:text-gray-400">Complete simple tasks and earn instant rewards</p>
          </div>

          <div className="card p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${(userData?.totalReferralEarnings || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeCategory === category.id
                    ? 'bg-orange-600 dark:bg-orange-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map(task => (
              <div
                key={task.$id}
                className="card p-6"
              >
                <div className="mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 mb-2">
                    {task.category}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{task.title}</h3>
                </div>
                <div className="mb-6">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    ${task.rewardAmount.toFixed(2)}
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => handleCompleteAction(task)}
                    className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Complete Action
                  </button>
                  <button
                    onClick={() => handleVerifyCompletion(task)}
                    disabled={verifyingTask === task.$id}
                    className="w-full py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
                  >
                    {verifyingTask === task.$id ? 'Verifying...' : 'Verify Completion'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
