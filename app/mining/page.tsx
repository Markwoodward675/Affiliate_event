'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { databases, Query } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';

export default function MiningPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [isMining, setIsMining] = useState(false);
  const [hashrate, setHashrate] = useState(0);
  const [localEarnings, setLocalEarnings] = useState(0);
  const [userData, setUserData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [activeNav, setActiveNav] = useState('mining');

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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isMining) {
      const randomHashrate = () => Math.floor(Math.random() * 5000) + 1000;
      
      interval = setInterval(() => {
        setHashrate(randomHashrate());
        setLocalEarnings(prev => prev + 0.0001);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isMining]);

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
            onClick={() => setActiveNav('mining')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeNav === 'mining'
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            ⛏️ Passive Mining
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
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Passive Mining</h2>
            <p className="text-gray-600">Earn passive income by running our background earning engine</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Start Background Earning Core</h3>
                <p className="text-gray-500 text-sm">
                  {isMining ? 'Currently earning passive income' : 'Toggle to start earning'}
                </p>
              </div>
              <button
                onClick={() => setIsMining(!isMining)}
                className={`w-20 h-10 rounded-full transition-colors relative ${
                  isMining ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-8 h-8 bg-white rounded-full shadow-md absolute top-1 left-1 transition-transform ${
                  isMining ? 'translate-x-10' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-gray-500 text-sm font-medium mb-2">Hashrate</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-indigo-600">{hashrate}</span>
                  <span className="text-gray-500">H/s</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-gray-500 text-sm font-medium mb-2">Session Earnings</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-green-600">
                    ${localEarnings.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Meter</h3>
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-green-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (hashrate / 60) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>Idle</span>
              <span>Max Performance</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-gray-500 text-sm font-medium">Total Earnings</h4>
                <span className="text-green-500">💰</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                ${((userData?.totalReferralEarnings || 0) + localEarnings).toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-gray-500 text-sm font-medium">Status</h4>
                <span className={`text-lg ${isMining ? 'text-green-500' : 'text-orange-500'}`}>
                  {isMining ? '🟢' : '🟠'}
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {isMining ? 'Active' : 'Paused'}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-gray-500 text-sm font-medium">Tier Level</h4>
                <span className="text-indigo-500">🏆</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                Level {userData?.tierLevel || 0}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
