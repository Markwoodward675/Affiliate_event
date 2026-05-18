'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { databases, Query, ID } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';

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
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<UserTask[]>(sampleTasks);
  const [userData, setUserData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [activeNav, setActiveNav] = useState('tasks');
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

  const handleLogout = async () => {
    await logout();
    router.push('/login');
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
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-indigo-600">Affiliate Event</h1>
        </div>
        <nav className="p-4 space-y-2">
          <button
            onClick={() => router.push('/dashboard')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeNav === 'dashboard'
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => router.push('/mining')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeNav === 'mining'
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            ⛏️ Passive Mining
          </button>
          <button
            onClick={() => setActiveNav('tasks')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeNav === 'tasks'
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📋 Task Wall
          </button>
          <button
            onClick={() => router.push('/wallet')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeNav === 'wallet'
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            💳 Wallet
          </button>
          <button
            onClick={() => router.push('/settings')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeNav === 'settings'
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            ⚙️ Settings
          </button>
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-bold">
                {user?.email?.[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500">Tier {userData?.tierLevel || 0}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Task Wall</h2>
            <p className="text-gray-600">Complete simple tasks and earn instant rewards</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-50 rounded-lg p-4">
                <p className="text-gray-500 text-sm font-medium mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900">
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
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
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
                className="bg-white rounded-xl shadow-md p-6"
              >
                <div className="mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mb-2">
                    {task.category}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                </div>
                <div className="mb-6">
                  <p className="text-3xl font-bold text-green-600">
                    ${task.rewardAmount.toFixed(2)}
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => handleCompleteAction(task)}
                    className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Complete Action
                  </button>
                  <button
                    onClick={() => handleVerifyCompletion(task)}
                    disabled={verifyingTask === task.$id}
                    className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
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
