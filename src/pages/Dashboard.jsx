import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ resumes: 0, jobs: 0, rankings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/analytics/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-semibold">R</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Resumes</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.resumes}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-semibold">J</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Job Postings</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.jobs}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-semibold">★</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Rankings</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.rankings}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <button className="bg-indigo-50 p-4 rounded-lg text-left hover:bg-indigo-100 transition-colors">
              <h4 className="font-medium text-indigo-900">Upload Resume</h4>
              <p className="text-sm text-indigo-700">Add new candidate</p>
            </button>
            <button className="bg-green-50 p-4 rounded-lg text-left hover:bg-green-100 transition-colors">
              <h4 className="font-medium text-green-900">Create Job</h4>
              <p className="text-sm text-green-700">Post new position</p>
            </button>
            <button className="bg-yellow-50 p-4 rounded-lg text-left hover:bg-yellow-100 transition-colors">
              <h4 className="font-medium text-yellow-900">Run Rankings</h4>
              <p className="text-sm text-yellow-700">Match candidates</p>
            </button>
            <button className="bg-purple-50 p-4 rounded-lg text-left hover:bg-purple-100 transition-colors">
              <h4 className="font-medium text-purple-900">View Analytics</h4>
              <p className="text-sm text-purple-700">See insights</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
