'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { databases, Query } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

interface Task {
  $id: string;
  taskId: string;
  title: string;
  category: 'Quick Cash' | 'Steady Income' | 'Mega Offers';
  payout: number;
  difficulty: string;
  affiliateUrl: string;
  isActive: boolean;
}

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

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
        'tasks',
        [Query.equal('isActive', true)]
      );
      setTasks(tasksResponse.documents as unknown as Task[]);

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

  const handleTaskClick = (task: Task) => {
    try {
      const url = new URL(task.affiliateUrl);
      url.searchParams.set('subid', user?.$id || '');
      url.searchParams.set('taskId', task.taskId);
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error opening task:', error);
      window.open(task.affiliateUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const groupTasksByCategory = () => {
    const groups: Record<string, Task[]> = {
      'Quick Cash': [],
      'Steady Income': [],
      'Mega Offers': []
    };
    tasks.forEach(task => {
      if (groups[task.category]) {
        groups[task.category].push(task);
      }
    });
    return groups;
  };

  const taskGroups = groupTasksByCategory();

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
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400">Complete tasks and earn passive income</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Earnings</h3>
                <span className="text-green-500">💰</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                ${(userData?.totalReferralEarnings || 0).toFixed(2)}
              </p>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Tier Level</h3>
                <span className="text-orange-500">🏆</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Level {userData?.tierLevel || 0}
              </p>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Referral Code</h3>
                <span className="text-yellow-500">🎁</span>
              </div>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {userData?.referralCode || 'N/A'}
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {Object.entries(taskGroups).map(([category, categoryTasks]) => (
              <div key={category} className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{category}</h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {categoryTasks.length} task{categoryTasks.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryTasks.map(task => (
                    <div key={task.$id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">{task.title}</h3>
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          {task.difficulty}
                        </span>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                          ${task.payout.toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleTaskClick(task)}
                        className="w-full text-center px-4 py-2 bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
                      >
                        Start Task
                      </button>
                    </div>
                  ))}
                  {categoryTasks.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                      No tasks available in this category yet.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
