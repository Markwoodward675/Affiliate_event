'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { databases, Query, ID } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

interface MiningPackage {
  id: string;
  name: string;
  hashrate: string;
  price: number;
  duration: number;
  dailyYield: number;
  level: string;
}

interface HardwareContract {
  $id: string;
  contractId: string;
  machineName: string;
  hashrate: string;
  pricePaid: number;
  durationDays: number;
  dailyYieldEst: number;
  status: 'active' | 'expired';
  expiresAt: string;
}

interface UserData {
  $id: string;
  userId: string;
  totalReferralEarnings: number;
  miningLevel: string;
  currentHashrate: string;
  freeMiningEnabled: boolean;
}

const miningPackages: MiningPackage[] = [
  {
    id: 'free_tier',
    name: 'Core Shared Sandbox',
    hashrate: '1 TH/s',
    price: 0,
    duration: 0,
    dailyYield: 0.15,
    level: 'free_tier',
  },
  {
    id: 'river_starter_30d',
    name: 'River Micro-Node Plan',
    hashrate: '25 TH/s',
    price: 40,
    duration: 30,
    dailyYield: 1.90,
    level: 'river_starter_30d',
  },
  {
    id: 'river_fleet_90d',
    name: 'River Mid-Tier Fleet',
    hashrate: '75 TH/s',
    price: 110,
    duration: 30,
    dailyYield: 5.40,
    level: 'river_fleet_90d',
  },
  {
    id: 'river_institutional_30d',
    name: 'River Enterprise Stack',
    hashrate: '180 TH/s',
    price: 300,
    duration: 90,
    dailyYield: 15.80,
    level: 'river_institutional_30d',
  },
];

export default function MiningPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [contracts, setContracts] = useState<HardwareContract[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [activeTab, setActiveTab] = useState<'packages' | 'expired'>('packages');

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
        setUserData(usersResponse.documents[0] as unknown as UserData);
      }

      const contractsResponse = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'hardware_contracts',
        [Query.equal('userId', user?.$id)]
      );
      
      setContracts(contractsResponse.documents as unknown as HardwareContract[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handlePurchase = async (pkg: MiningPackage) => {
    if (!userData || !user) return;

    if (userData.totalReferralEarnings < pkg.price) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 5000);
      return;
    }

    try {
      const newBalance = userData.totalReferralEarnings - pkg.price;
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        userData.$id,
        {
          totalReferralEarnings: newBalance,
          miningLevel: pkg.level,
          currentHashrate: pkg.hashrate,
        }
      );

      const now = new Date();
      const expiresAt = new Date(now.getTime() + pkg.duration * 24 * 60 * 60 * 1000);

      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'hardware_contracts',
        ID.unique(),
        {
          userId: user.$id,
          contractId: ID.unique(),
          provider: 'River Hosted Model',
          machineName: pkg.name,
          hashrate: pkg.hashrate,
          pricePaid: pkg.price,
          durationDays: pkg.duration,
          dailyYieldEst: pkg.dailyYield,
          status: 'active',
          expiresAt: expiresAt.toISOString(),
        }
      );

      const activityDescription = `Upgraded hosted computing power to ${pkg.name} (${pkg.hashrate}) backed by primary River Hosted infrastructure.`;
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'user_activities',
        ID.unique(),
        {
          userId: user.$id,
          activityType: 'MINER_UPGRADE',
          description: activityDescription,
          timestamp: now.toISOString(),
        }
      );

      fetchData();
    } catch (error) {
      console.error('Error purchasing package:', error);
    }
  };

  const handleReactivate = async (contract: HardwareContract) => {
    if (!userData || !user) return;

    if (userData.totalReferralEarnings < contract.pricePaid) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 5000);
      return;
    }

    try {
      const newBalance = userData.totalReferralEarnings - contract.pricePaid;
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        userData.$id,
        {
          totalReferralEarnings: newBalance,
        }
      );

      const now = new Date();
      const newExpiresAt = new Date(now.getTime() + contract.durationDays * 24 * 60 * 60 * 1000);

      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'hardware_contracts',
        contract.$id,
        {
          status: 'active',
          expiresAt: newExpiresAt.toISOString(),
        }
      );

      const activityDescription = `Reactivated ${contract.machineName} (${contract.hashrate}) for another ${contract.durationDays} days.`;
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'user_activities',
        ID.unique(),
        {
          userId: user.$id,
          activityType: 'MINER_REACTIVATED',
          description: activityDescription,
          timestamp: now.toISOString(),
        }
      );

      fetchData();
    } catch (error) {
      console.error('Error reactivating contract:', error);
    }
  };

  const handleToggleFreeMining = async () => {
    if (!userData || !user) return;

    try {
      const newFreeMiningEnabled = !userData.freeMiningEnabled;
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        userData.$id,
        {
          freeMiningEnabled: newFreeMiningEnabled,
        }
      );

      fetchData();
    } catch (error) {
      console.error('Error toggling free mining:', error);
    }
  };

  const expiredContracts = contracts.filter(c => c.status === 'expired');

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
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">River Mining Store</h2>
            <p className="text-gray-600 dark:text-gray-400">Upgrade your hosted computing power for high-yield daily returns</p>
          </div>

          {showWarning && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</span>
                <div>
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium">Insufficient Balance</p>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                    Please deposit funds first in the <button onClick={() => router.push('/wallet')} className="text-orange-600 dark:text-orange-400 underline">Wallet</button> section.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="card p-6 mb-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 w-full">
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${(userData?.totalReferralEarnings || 0).toFixed(2)}
                </p>
              </div>
              <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 w-full">
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Current Hashrate</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {userData?.currentHashrate || '1 TH/s'}
                </p>
              </div>
              <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 w-full">
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Active Contracts</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {contracts.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Free Tier Mining</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Enable/disable the free 1 TH/s mining tier</p>
                </div>
                <button
                  onClick={handleToggleFreeMining}
                  className={`w-20 h-10 rounded-full transition-colors relative ${
                    userData?.freeMiningEnabled ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-8 h-8 bg-white rounded-full shadow-md absolute top-1 left-1 transition-transform ${
                    userData?.freeMiningEnabled ? 'translate-x-10' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('packages')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === 'packages'
                  ? 'bg-orange-600 dark:bg-orange-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Available Packages
            </button>
            <button
              onClick={() => setActiveTab('expired')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === 'expired'
                  ? 'bg-orange-600 dark:bg-orange-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Expired Leases ({expiredContracts.length})
            </button>
          </div>

          {activeTab === 'packages' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {miningPackages.map(pkg => (
                <div
                  key={pkg.id}
                  className={`card p-6 border-2 transition-all ${
                    userData?.miningLevel === pkg.level
                      ? 'border-orange-500'
                      : 'border-transparent hover:border-orange-200 dark:hover:border-orange-800'
                  }`}
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{pkg.name}</h3>
                    <p className="text-orange-600 dark:text-orange-400 font-bold text-xl mt-1">{pkg.hashrate}</p>
                  </div>
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Duration</span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {pkg.duration === 0 ? 'Lifetime' : `${pkg.duration} Days`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Daily Yield</span>
                      <span className="text-green-600 dark:text-green-400 font-medium">${pkg.dailyYield.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      ${pkg.price === 0 ? '0.00' : pkg.price.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => handlePurchase(pkg)}
                    disabled={userData?.miningLevel === pkg.level || pkg.price === 0}
                    className={`w-full py-3 rounded-lg font-medium transition-colors ${
                      userData?.miningLevel === pkg.level
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : pkg.price === 0
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-orange-600 dark:bg-orange-500 text-white hover:bg-orange-700 dark:hover:bg-orange-600'
                    }`}
                  >
                    {userData?.miningLevel === pkg.level ? 'Active' : 'Upgrade'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'expired' && (
            <div className="card p-6">
              {expiredContracts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No expired leases to display.
                </div>
              ) : (
                <div className="space-y-4">
                  {expiredContracts.map(contract => (
                    <div
                      key={contract.$id}
                      className="flex flex-col md:flex-row items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg gap-4"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{contract.machineName}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {contract.hashrate} • Expired {new Date(contract.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">${contract.pricePaid.toFixed(2)}</p>
                          <p className="text-sm text-green-600 dark:text-green-400">${contract.dailyYieldEst.toFixed(2)}/day</p>
                        </div>
                        <button
                          onClick={() => handleReactivate(contract)}
                          className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-medium"
                        >
                          Reactivate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
