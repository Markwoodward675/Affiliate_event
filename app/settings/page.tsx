'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { databases, Query } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">Manage your account preferences</p>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Profile</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="input-field w-full px-4 py-3 bg-gray-50 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Referral Code</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={userData?.referralCode || ''}
                      readOnly
                      className="flex-1 input-field px-4 py-3 bg-gray-50 dark:bg-gray-700"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(userData?.referralCode || '')}
                      className="btn-primary px-4 py-3"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Notifications</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Email Notifications</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates about your earnings and tasks</p>
                </div>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`w-16 h-8 rounded-full transition-colors relative ${
                    notificationsEnabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md absolute top-1 left-1 transition-transform ${
                    notificationsEnabled ? 'translate-x-8' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Earning Platforms</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Access all your earning platforms in one place</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Offer Wall</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Complete surveys and offers</p>
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <iframe
                      src="https://example.com/offer-wall"
                      title="Offer Wall"
                      className="w-full h-full"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Game Rewards</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Play games and earn</p>
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <iframe
                      src="https://example.com/game-rewards"
                      title="Game Rewards"
                      className="w-full h-full"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6 border border-red-200 dark:border-red-800">
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-4">Danger Zone</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Delete Account</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Permanently delete your account and all data</p>
                </div>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
