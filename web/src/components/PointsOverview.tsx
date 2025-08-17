// web/src/components/PointsOverview.tsx
import React from 'react';
import { UserCircleIcon, WalletIcon } from '@heroicons/react/24/outline';

interface PointEntry {
  transactionId: string;
  userId: string;
  pointsChange: number;
  description: string;
  createdAt: string;
}

interface PointsOverviewProps {
  totalPoints: number;
  user: {
    name: string;
    email: string;
    image: string;
  };
  pointHistory: PointEntry[];
}

const PointsOverview: React.FC<PointsOverviewProps> = ({
  totalPoints,
  user,
  pointHistory,
}) => {
  return (
    <div className="w-9/10 sm:w-3/5 lg:w-1/3 mx-auto flex flex-col gap-6 p-6 md:p-8 lg:p-10 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-xl">
      {/* Upper Section: Total Points and User Info */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-700 dark:to-pink-600 text-white p-6 rounded-lg shadow-lg flex flex-col md:flex-row items-center justify-between">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
           <img
                    src={user.image}
                    alt="User Avatar"
                    className="w-12 h-12 rounded-full object-cover"
                  />
          <div className="text-center sm:text-left">
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight">{user.name}</h2>
            <p className="text-xs sm:text-base text-blue-200 dark:text-blue-300">{user.email}</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 text-center sm:text-right">
          <p className="text-blue-200 dark:text-blue-300 text-sm uppercase">总积分</p>
          <p className="text-5xl font-extrabold tracking-tighter">{totalPoints}</p>
          <WalletIcon className="h-8 w-8 text-white inline-block ml-2" />
        </div>
      </div>
      {/* Small text for mobile view only */}
      <p className="mt-4 text-center text-sm text-blue-500 dark:text-blue-300">
        仅显示最近20条积分明细。
      </p>

      {/* Lower Section: Point Details */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">
          积分明细
        </h3>
        {pointHistory.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-4">暂无积分明细。</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {pointHistory
              .slice(Math.max(pointHistory.length - 20, 0)) // Only display the last 20 entries
              .map((entry) => (
                <li key={entry.transactionId} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-50 break-words">
                      {entry.description}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className={`mt-2 sm:mt-0 text-lg font-bold ${
                    entry.pointsChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {entry.pointsChange > 0 ? '+' : ''} {entry.pointsChange}
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PointsOverview;