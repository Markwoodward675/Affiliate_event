'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { databases, Query } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';

interface Completion {
  $id: string;
  completionId: string;
  userId: string;
  taskId: string;
  status: string;
  payoutEarned: number;
  timestamp: string;
}

export default function WalletPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeNav, setActiveNav] = useState('wallet');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchData();
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    try {
      const usersResponse = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        [Query.equal('userId', user?.$id)]
      );
      
      if (usersResponse.documents.length > 0) {
        setUserData(usersResponse.documents[0]);
      }

      const completionsResponse = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'completions',
        [Query.equal('userId', user?.$id)]
      );
      
      setCompletions(completionsResponse.documents as unknown as Completion[]);
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
            onClick={() => setActiveNav('wallet')}
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
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Wallet</h2>
            <p className="text-gray-600">Manage your earnings and transaction history</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 mb-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-indigo-100 text-lg font-medium">Available Balance</h3>
              <span className="text-4xl">💳</span>
            </div>
            <p className="text-5xl font-bold mb-4">
              ${(userData?.totalReferralEarnings || 0).toFixed(2)}
            </p>
            <div className="flex items-center gap-2 text-indigo-100 mb-6">
              <span className="text-green-300">↑</span>
              <span>You've earned this session</span>
            </div>
            <button
              onClick={() => alert('Withdrawal request submitted!')}
              disabled={(userData?.totalReferralEarnings || 0) < 10}
              className="w-full bg-white text-indigo-700 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {((userData?.totalReferralEarnings || 0) < 10) ? 'Min. $10 to withdraw' : '💰 Withdraw Funds'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h4 className="text-gray-500 text-sm font-medium mb-2">Total Earnings</h4>
              <p className="text-3xl font-bold text-gray-900">
                ${(userData?.totalReferralEarnings || 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h4 className="text-gray-500 text-sm font-medium mb-2">Completed Tasks</h4>
              <p className="text-3xl font-bold text-gray-900">
                {completions.length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h4 className="text-gray-500 text-sm font-medium mb-2">Tier Level</h4>
              <p className="text-3xl font-bold text-gray-900">
                Level {userData?.tierLevel || 0}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Transaction History</h3>
              <span className="text-sm text-gray-500">
                {completions.length} transaction{completions.length !== 1 ? 's' : ''}
              </span>
            </div>

            {completions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-5xl mb-4">📭</div>
                <p>No transactions yet. Complete your first task!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completions.map((completion) => (
                  <div key={completion.$id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl text-green-600">✅</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Task Completed
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(completion.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">
                        +${completion.payoutEarned.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Task ID: {completion.taskId}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
