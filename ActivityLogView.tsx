import React from 'react';
import { Activity } from '../types.ts';
import Card from './ui/Card.tsx';
import { ActivityLogIcon } from './icons.tsx';

interface ActivityLogViewProps {
  activities: Activity[];
}

const ActivityLogView: React.FC<ActivityLogViewProps> = ({ activities }) => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-on-surface mb-6">Activity Log</h1>
      <Card>
        {activities.length > 0 ? (
          <ul className="space-y-4">
            {activities.map(activity => (
              <li key={activity.id} className="flex items-start gap-4 p-3 border-b last:border-b-0">
                <div className="flex-shrink-0 mt-1">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                    <ActivityLogIcon className="h-5 w-5 text-on-surface-secondary" />
                  </span>
                </div>
                <div>
                  <p className="text-on-surface">{activity.description}</p>
                  <p className="text-sm text-on-surface-secondary">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-16">
            <ActivityLogIcon className="w-16 h-16 mx-auto text-on-surface-secondary opacity-50" />
            <h3 className="mt-4 text-xl font-semibold text-on-surface">No Activities Recorded</h3>
            <p className="mt-2 text-on-surface-secondary">
              Any important actions you take in the app will be logged here.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ActivityLogView;