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
}

export default function AdminDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeNav, setActiveNav] = useState('users');

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

  if (loading || loadingUsers) {
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
          <h1 className="text-2xl font-bold text-orange-600">Admin Panel</h1>
        </div>
        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveNav('users')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeNav === 'users'
                ? 'bg-orange-50 text-orange-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            👥 Users
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            📊 User Dashboard
          </button>
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
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

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
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
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referral Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referred By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Earnings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.$id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        <div className="text-xs text-gray-500">ID: {user.userId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {user.referralCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.referredBy || 'System'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-orange-600">
                          Level {user.tierLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-green-600">
                          ${(user.totalReferralEarnings || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
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
        </div>
      </main>
    </div>
  );
}
