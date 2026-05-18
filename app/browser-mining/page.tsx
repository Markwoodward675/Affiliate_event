'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { databases, Query, ID } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';

interface BrowserMiner {
  $id: string;
  minerId: string;
  userId: string;
  nodeName: string;
  allocatedThreads: number;
  totalHashesMined: number;
  isRunning: boolean;
  createdAt: string;
}

interface MinerWorkerState {
  worker: Worker | null;
  hashesPerSecond: number;
  batchCount: number;
  sessionHashes: number;
}

export default function BrowserMiningPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [miners, setMiners] = useState<BrowserMiner[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeNav, setActiveNav] = useState('browser-mining');
  const [newNodeName, setNewNodeName] = useState('');
  const [newAllocatedThreads, setNewAllocatedThreads] = useState(1);
  const [editingMiner, setEditingMiner] = useState<BrowserMiner | null>(null);
  const [editNodeName, setEditNodeName] = useState('');
  const [editAllocatedThreads, setEditAllocatedThreads] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const workerStatesRef = useRef<Record<string, MinerWorkerState>>({});
  const syncIntervalsRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchMiners();
    }

    return () => {
      Object.values(workerStatesRef.current).forEach(state => {
        if (state.worker) {
          state.worker.terminate();
        }
      });
      Object.values(syncIntervalsRef.current).forEach(interval => {
        clearInterval(interval);
      });
    };
  }, [user, loading, router]);

  const fetchMiners = async () => {
    try {
      const minersResponse = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'browser_miners',
        [Query.equal('userId', user?.$id)]
      );

      setMiners(minersResponse.documents as unknown as BrowserMiner[]);
    } catch (error) {
      console.error('Error fetching miners:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = async () => {
    Object.values(workerStatesRef.current).forEach(state => {
      if (state.worker) {
        state.worker.terminate();
      }
    });
    Object.values(syncIntervalsRef.current).forEach(interval => {
      clearInterval(interval);
    });
    await logout();
    router.push('/login');
  };

  const handleProvisionNode = async () => {
    if (!user || !newNodeName.trim()) return;

    try {
      const now = new Date().toISOString();
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'browser_miners',
        ID.unique(),
        {
          minerId: ID.unique(),
          userId: user.$id,
          nodeName: newNodeName.trim(),
          allocatedThreads: newAllocatedThreads,
          totalHashesMined: 0,
          isRunning: false,
          createdAt: now,
        }
      );

      setNewNodeName('');
      setNewAllocatedThreads(1);
      fetchMiners();
    } catch (error) {
      console.error('Error provisioning node:', error);
    }
  };

  const handleToggleMiner = async (miner: BrowserMiner) => {
    if (!user) return;

    try {
      const newIsRunning = !miner.isRunning;

      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'browser_miners',
        miner.$id,
        {
          isRunning: newIsRunning,
        }
      );

      if (newIsRunning) {
        startWorker(miner);
      } else {
        stopWorker(miner);
      }

      fetchMiners();
    } catch (error) {
      console.error('Error toggling miner:', error);
    }
  };

  const startWorker = (miner: BrowserMiner) => {
    const worker = new Worker('/workers/hashMiner.worker.js');
    const initialState: MinerWorkerState = {
      worker,
      hashesPerSecond: 0,
      batchCount: 0,
      sessionHashes: 0,
    };

    workerStatesRef.current[miner.$id] = initialState;

    worker.onmessage = (e) => {
      if (e.data.type === 'update') {
        workerStatesRef.current[miner.$id] = {
          ...initialState,
          hashesPerSecond: e.data.hashesPerSecond,
          batchCount: e.data.batchCount,
          sessionHashes: e.data.totalHashes,
        };
        setMiners(prev => prev.map(m => m.$id === miner.$id ? { ...m } : m));
      }
    };

    worker.postMessage({ type: 'start' });

    const syncInterval = setInterval(async () => {
      const currentState = workerStatesRef.current[miner.$id];
      if (currentState && currentState.sessionHashes > 0) {
        try {
          await databases.updateDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            'browser_miners',
            miner.$id,
            {
              totalHashesMined: miner.totalHashesMined + currentState.sessionHashes,
            }
          );
          fetchMiners();
        } catch (error) {
          console.error('Error syncing hashes:', error);
        }
      }
    }, 10000);

    syncIntervalsRef.current[miner.$id] = syncInterval;
  };

  const stopWorker = (miner: BrowserMiner) => {
    const state = workerStatesRef.current[miner.$id];
    if (state?.worker) {
      state.worker.postMessage({ type: 'stop' });
      state.worker.terminate();
    }
    delete workerStatesRef.current[miner.$id];

    const interval = syncIntervalsRef.current[miner.$id];
    if (interval) {
      clearInterval(interval);
    }
    delete syncIntervalsRef.current[miner.$id];
  };

  const handleEditMiner = (miner: BrowserMiner) => {
    setEditingMiner(miner);
    setEditNodeName(miner.nodeName);
    setEditAllocatedThreads(miner.allocatedThreads);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMiner || !editNodeName.trim()) return;

    try {
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'browser_miners',
        editingMiner.$id,
        {
          nodeName: editNodeName.trim(),
          allocatedThreads: editAllocatedThreads,
        }
      );

      setShowEditModal(false);
      setEditingMiner(null);
      fetchMiners();
    } catch (error) {
      console.error('Error updating miner:', error);
    }
  };

  const handleDecommissionNode = async (miner: BrowserMiner) => {
    if (!user) return;

    try {
      stopWorker(miner);

      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'browser_miners',
        miner.$id
      );

      fetchMiners();
    } catch (error) {
      console.error('Error decommissioning node:', error);
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
            onClick={() => setActiveNav('browser-mining')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeNav === 'browser-mining'
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🖥️ Browser Mining
          </button>
          <button
            onClick={() => router.push('/tasks')}
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Browser Mining Node Manager</h2>
            <p className="text-gray-600">Spin up isolated HTML5 Web Worker mining nodes</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Provision New Node</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Node Name</label>
                <input
                  type="text"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  placeholder="My Mining Node"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allocated Threads: {newAllocatedThreads}
                </label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={newAllocatedThreads}
                  onChange={(e) => setNewAllocatedThreads(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleProvisionNode}
                  disabled={!newNodeName.trim()}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                >
                  Provision Node
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {miners.map(miner => {
              const workerState = workerStatesRef.current[miner.$id];
              return (
                <div
                  key={miner.$id}
                  className={`bg-white rounded-xl shadow-md p-6 border-2 transition-all ${
                    miner.isRunning ? 'border-green-500' : 'border-transparent'
                  }`}
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{miner.nodeName}</h3>
                    <p className="text-sm text-gray-500">
                      Created {new Date(miner.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Allocated Threads</span>
                      <span className="text-gray-900 font-medium">{miner.allocatedThreads}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Hashes</span>
                      <span className="text-gray-900 font-medium">
                        {(miner.totalHashesMined + (workerState?.sessionHashes || 0)).toLocaleString()}
                      </span>
                    </div>
                    {miner.isRunning && workerState && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Hashrate</span>
                          <span className="text-green-600 font-medium">
                            {workerState.hashesPerSecond.toLocaleString()} H/s
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Batch Count</span>
                          <span className="text-indigo-600 font-medium">{workerState.batchCount}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => handleToggleMiner(miner)}
                      className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                        miner.isRunning
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {miner.isRunning ? 'Stop' : 'Start'}
                    </button>
                    <button
                      onClick={() => handleEditMiner(miner)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      ✏️
                    </button>
                  </div>

                  <button
                    onClick={() => handleDecommissionNode(miner)}
                    className="w-full py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                  >
                    Decommission Node
                  </button>
                </div>
              );
            })}
          </div>

          {miners.length === 0 && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">No mining nodes provisioned yet</p>
            </div>
          )}
        </div>
      </main>

      {showEditModal && editingMiner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Edit Mining Node</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Node Name</label>
                <input
                  type="text"
                  value={editNodeName}
                  onChange={(e) => setEditNodeName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allocated Threads: {editAllocatedThreads}
                </label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={editAllocatedThreads}
                  onChange={(e) => setEditAllocatedThreads(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editNodeName.trim()}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
