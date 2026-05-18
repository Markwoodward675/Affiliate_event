'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { databases, Query } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';

interface User {
  $id: string;
  userId: string;
  email: string;
  referredBy: string | null;
  referralCode: string;
  tierLevel: number;
  totalReferralEarnings: number;
  freeMiningEnabled: boolean;
}

interface EarningPlatform {
  id: string;
  name: string;
  url: string;
}

export default function AdminDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeNav, setActiveNav] = useState('users');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [platforms, setPlatforms] = useState<EarningPlatform[]>([
    { id: '1', name: 'Offer Wall', url: 'https://example.com/offer-wall' },
    { id: '2', name: 'Game Rewards', url: 'https://example.com/game-rewards' }
  ]);
  const [newPlatformName, setNewPlatformName] = useState('');
  const [newPlatformUrl, setNewPlatformUrl] = useState('');
  
  const [scriptLoading, setScriptLoading] = useState<string | null>(null);
  const [scriptMessage, setScriptMessage] = useState<string>('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    } else if (user) {
      fetchUsers();
    }
  }, [user, loading, router]);

  const fetchUsers = async () => {
    try {
      const usersResponse = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users'
      );
      setUsers(usersResponse.documents as unknown as User[]);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  const handleWithdraw = async (userId: string) => {
    if (confirm('Process withdrawal for this user?')) {
      alert('Withdrawal initiated!');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        const userToDelete = users.find(u => u.userId === userId);
        if (userToDelete) {
          await databases.deleteDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            'users',
            userToDelete.$id
          );
          await fetchUsers();
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const handleToggleFreeMining = async (user: User) => {
    try {
      const newFreeMiningEnabled = !user.freeMiningEnabled;
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        user.$id,
        {
          freeMiningEnabled: newFreeMiningEnabled,
        }
      );
      await fetchUsers();
    } catch (error) {
      console.error('Error toggling free mining:', error);
      alert('Failed to toggle free mining');
    }
  };

  const handleAddPlatform = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlatformName && newPlatformUrl) {
      setPlatforms([
        ...platforms,
        {
          id: Date.now().toString(),
          name: newPlatformName,
          url: newPlatformUrl
        }
      ]);
      setNewPlatformName('');
      setNewPlatformUrl('');
    }
  };

  const handleDeletePlatform = (id: string) => {
    if (confirm('Are you sure you want to delete this platform?')) {
      setPlatforms(platforms.filter(p => p.id !== id));
    }
  };

  const handleRunScript = async (scriptName: string) => {
    setScriptLoading(scriptName);
    setScriptMessage('');

    try {
      const response = await fetch('/api/admin/scripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scriptName }),
      });

      const data = await response.json();

      if (data.success) {
        setScriptMessage(data.message + '\n\n' + (data.note || ''));
        alert('Script initiated! Check terminal for full output.');
      } else {
        setScriptMessage('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error running script:', error);
      setScriptMessage('Failed to run script');
    } finally {
      setScriptLoading(null);
    }
  };

  if (loading || loadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const Sidebar = () => (
    <aside className="w-64 bg-white shadow-lg flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-orange-600">Admin Panel</h1>
      </div>
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        <button
          onClick={() => { setActiveNav('users'); setMobileMenuOpen(false); }}
          className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
            activeNav === 'users'
              ? 'bg-orange-50 text-orange-700 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          👥 Users
        </button>
        <button
          onClick={() => { setActiveNav('platforms'); setMobileMenuOpen(false); }}
          className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
            activeNav === 'platforms'
              ? 'bg-orange-50 text-orange-700 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          🌐 Earning Platforms
        </button>
        <button
          onClick={() => { setActiveNav('scripts'); setMobileMenuOpen(false); }}
          className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
            activeNav === 'scripts'
              ? 'bg-orange-50 text-orange-700 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          ⚙️ Scripts
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          📊 User Dashboard
        </button>
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-orange-600 font-bold">
              {user?.email?.[0].toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{user?.email}</p>
            <p className="text-xs text-gray-500">Admin</p>
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
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-40 p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-orange-600">Admin Panel</h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed top-0 left-0 bottom-0 w-64 bg-white shadow-lg z-50 transform transition-transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar />
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8">
          <div className="max-w-6xl mx-auto">
            {activeNav === 'users' ? (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">User Management</h2>
                  <p className="text-gray-600">Manage all users in the system</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h4 className="text-gray-500 text-sm font-medium mb-2">Total Users</h4>
                    <p className="text-3xl font-bold text-gray-900">{users.length}</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h4 className="text-gray-500 text-sm font-medium mb-2">Total Earnings</h4>
                    <p className="text-3xl font-bold text-green-600">
                      ${users.reduce((sum, u) => sum + (u.totalReferralEarnings || 0), 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h4 className="text-gray-500 text-sm font-medium mb-2">Avg. Tier</h4>
                    <p className="text-3xl font-bold text-orange-600">
                      Level {Math.round(users.reduce((sum, u) => sum + (u.tierLevel || 0), 0) / Math.max(1, users.length))}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Referral Code
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Referred By
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tier
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Earnings
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Free Mining
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.$id} className="hover:bg-gray-50">
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{user.email}</div>
                              <div className="text-xs text-gray-500">ID: {user.userId}</div>
                            </td>
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                {user.referralCode}
                              </span>
                            </td>
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.referredBy || 'System'}
                            </td>
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-semibold text-orange-600">
                                Level {user.tierLevel}
                              </span>
                            </td>
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-semibold text-green-600">
                                ${(user.totalReferralEarnings || 0).toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleFreeMining(user)}
                                className={`w-16 h-8 rounded-full transition-colors relative ${
                                  user.freeMiningEnabled ? 'bg-green-600' : 'bg-gray-300'
                                }`}
                              >
                                <div className={`w-6 h-6 bg-white rounded-full shadow-md absolute top-1 left-1 transition-transform ${
                                  user.freeMiningEnabled ? 'translate-x-8' : 'translate-x-0'
                                }`} />
                              </button>
                            </td>
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => handleWithdraw(user.userId)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                💰 Withdraw
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.userId)}
                                className="text-red-600 hover:text-red-900"
                              >
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {users.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      No users found
                    </div>
                  )}
                </div>
              </>
            ) : activeNav === 'platforms' ? (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Earning Platforms</h2>
                  <p className="text-gray-600">Manage your earning platforms and affiliate links</p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Platform</h3>
                  <form onSubmit={handleAddPlatform} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
                      <input
                        type="text"
                        value={newPlatformName}
                        onChange={(e) => setNewPlatformName(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="e.g., Offer Wall"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Platform URL</label>
                      <input
                        type="url"
                        value={newPlatformUrl}
                        onChange={(e) => setNewPlatformUrl(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="https://example.com/offer-wall"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <button
                        type="submit"
                        className="w-full md:w-auto px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                      >
                        Add Platform
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            URL
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {platforms.map((platform) => (
                          <tr key={platform.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{platform.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <a
                                href={platform.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-indigo-600 hover:text-indigo-800 truncate max-w-md"
                              >
                                {platform.url}
                              </a>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleDeletePlatform(platform.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {platforms.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      No platforms added yet
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Scripts</h2>
                  <p className="text-gray-600">Run database setup and management scripts</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">🛢️</span>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Setup Database</h4>
                        <p className="text-sm text-gray-500">Initialize collections and attributes</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRunScript('setup')}
                      disabled={scriptLoading !== null}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                      {scriptLoading === 'setup' ? 'Running...' : 'Run Setup Script'}
                    </button>
                    <div className="mt-3 text-xs text-gray-500">
                      Run: <code className="bg-gray-100 px-2 py-1 rounded">node scripts/setup-appwrite.js</code>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">🔐</span>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Update Permissions</h4>
                        <p className="text-sm text-gray-500">Set collection permissions</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRunScript('permissions')}
                      disabled={scriptLoading !== null}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                      {scriptLoading === 'permissions' ? 'Running...' : 'Run Permissions Script'}
                    </button>
                    <div className="mt-3 text-xs text-gray-500">
                      Run: <code className="bg-gray-100 px-2 py-1 rounded">node scripts/update-permissions.js</code>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">🌱</span>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Seed Tasks</h4>
                        <p className="text-sm text-gray-500">Populate with sample tasks</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRunScript('seed')}
                      disabled={scriptLoading !== null}
                      className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
                    >
                      {scriptLoading === 'seed' ? 'Running...' : 'Run Seed Script'}
                    </button>
                    <div className="mt-3 text-xs text-gray-500">
                      Run: <code className="bg-gray-100 px-2 py-1 rounded">node scripts/seed-tasks.js</code>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">📋</span>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Seed User Tasks</h4>
                        <p className="text-sm text-gray-500">Populate task wall with user tasks</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRunScript('seed-user-tasks')}
                      disabled={scriptLoading !== null}
                      className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50"
                    >
                      {scriptLoading === 'seed-user-tasks' ? 'Running...' : 'Run Seed Script'}
                    </button>
                    <div className="mt-3 text-xs text-gray-500">
                      Run: <code className="bg-gray-100 px-2 py-1 rounded">node scripts/seed-user-tasks.js</code>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">➕</span>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Add Free Mining Attribute</h4>
                        <p className="text-sm text-gray-500">Add missing attribute to users</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRunScript('add-free-mining-attribute')}
                      disabled={scriptLoading !== null}
                      className="w-full px-4 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 disabled:opacity-50"
                    >
                      {scriptLoading === 'add-free-mining-attribute' ? 'Running...' : 'Run Attribute Script'}
                    </button>
                    <div className="mt-3 text-xs text-gray-500">
                      Run: <code className="bg-gray-100 px-2 py-1 rounded">node scripts/add-free-mining-attribute.js</code>
                    </div>
                  </div>
                </div>

                {scriptMessage && (
                  <div className="bg-gray-900 text-green-400 rounded-xl p-6 font-mono text-sm">
                    <pre>{scriptMessage}</pre>
                  </div>
                )}

                <div className="mt-12 bg-white rounded-xl shadow-md p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">📋 Complete Workflow & Setup Guide</h3>
                  
                  <div className="space-y-6">
                    <section>
                      <h4 className="text-lg font-semibold text-orange-600 mb-3">1. Create Affiliate Network Accounts</h4>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li><strong>Zeydoo</strong> - https://www.zeydoo.com/ - CPA and CPI offers</li>
                        <li><strong>MaxBounty</strong> - https://www.maxbounty.com/ - Top-tier CPA network</li>
                        <li><strong>Lootably</strong> - https://www.lootably.com/ - Offer walls and surveys</li>
                        <li><strong>Adscend Media</strong> - https://www.adscendmedia.com/ - Mobile and web offers</li>
                        <li><strong>CPAMatica</strong> - https://www.cpamatica.com/ - International offers</li>
                      </ul>
                    </section>

                    <section>
                      <h4 className="text-lg font-semibold text-orange-600 mb-3">2. Get Your Affiliate Links & Postbacks</h4>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-700 mb-2"><strong>Your Postback URL:</strong></p>
                        <code className="block bg-white border border-gray-300 rounded px-3 py-2 text-sm">
                          https://your-domain.com/api/v1/postback?userId=&#123;subid&#125;&amp;payout=&#123;payout&#125;&amp;taskId=&#123;campaign_id&#125;
                        </code>
                      </div>
                    </section>

                    <section>
                      <h4 className="text-lg font-semibold text-orange-600 mb-3">3. Connect to Your Platform</h4>
                      <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        <li>Go to the "Earning Platforms" tab in Admin</li>
                        <li>Click "Add New Platform"</li>
                        <li>Enter platform name (e.g., "Zeydoo Offers")</li>
                        <li>Paste your main affiliate dashboard URL</li>
                        <li>Click "Add Platform"</li>
                        <li>Repeat for all networks you want to integrate</li>
                      </ol>
                    </section>

                    <section>
                      <h4 className="text-lg font-semibold text-orange-600 mb-3">4. Add Tasks to Your Dashboard</h4>
                      <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        <li>From your affiliate network, find high-converting offers</li>
                        <li>Copy the offer's affiliate link with SubID support</li>
                        <li>Add the task via Admin or edit <code>scripts/seed-tasks.js</code></li>
                        <li>Set payout, category, and difficulty</li>
                        <li>Ensure the link includes <code>&amp;subid=</code> for user tracking</li>
                      </ol>
                    </section>

                    <section>
                      <h4 className="text-lg font-semibold text-orange-600 mb-3">5. Earning Flow</h4>
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                        <ol className="list-decimal list-inside space-y-2 text-gray-800">
                          <li><strong>User clicks task</strong> → System appends their <code>userId</code> as <code>subid</code></li>
                          <li><strong>User completes offer</strong> → Affiliate network tracks conversion</li>
                          <li><strong>Network sends postback</strong> → Hits your <code>/api/v1/postback</code> endpoint</li>
                          <li><strong>System updates user</strong> → Adds payout to user's balance, logs completion</li>
                          <li><strong>Referral bonus</strong> → 10% bonus automatically added to referrer's balance</li>
                        </ol>
                      </div>
                    </section>

                    <section>
                      <h4 className="text-lg font-semibold text-orange-600 mb-3">6. Withdrawal System</h4>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Users can request withdrawals from Wallet page</li>
                        <li>Minimum withdrawal amount: $10</li>
                        <li>Admin approves/processes withdrawals from Admin Panel</li>
                        <li>Withdrawal status: Pending → Approved/Rejected</li>
                      </ul>
                    </section>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
