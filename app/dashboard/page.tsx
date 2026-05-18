'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { databases, Query } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';

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
  const [activeNav, setActiveNav] = useState('dashboard');

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

  const handleLogout = async () => {
    await logout();
    router.push('/login');
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
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-indigo-600">Affiliate Event</h1>
        </div>
        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveNav('dashboard')}
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
            onClick={() => router.push('/browser-mining')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeNav === 'browser-mining'
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🖥️ Browser Mining
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
            <p className="text-gray-600">Complete tasks and earn passive income</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 text-sm font-medium">Total Earnings</h3>
                <span className="text-green-500">💰</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                ${(userData?.totalReferralEarnings || 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 text-sm font-medium">Tier Level</h3>
                <span className="text-indigo-500">🏆</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                Level {userData?.tierLevel || 0}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 text-sm font-medium">Referral Code</h3>
                <span className="text-yellow-500">🎁</span>
              </div>
              <p className="text-3xl font-bold text-indigo-600">
                {userData?.referralCode || 'N/A'}
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {Object.entries(taskGroups).map(([category, categoryTasks]) => (
              <div key={category} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
                  <span className="text-sm text-gray-500">
                    {categoryTasks.length} task{categoryTasks.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryTasks.map(task => (
                    <div key={task.$id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{task.title}</h3>
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {task.difficulty}
                        </span>
                        <span className="text-2xl font-bold text-green-600">
                          ${task.payout.toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleTaskClick(task)}
                        className="w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                      >
                        Start Task
                      </button>
                    </div>
                  ))}
                  {categoryTasks.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
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
