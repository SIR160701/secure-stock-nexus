
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Package, Settings, MessageSquare } from 'lucide-react';
import { ActivityRecord } from '@/hooks/useActivityHistory';

interface ActivityCardProps {
  activities: ActivityRecord[];
  isLoading: boolean;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activities, isLoading }) => {
  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'création':
      case 'ajout':
        return <Package className="h-4 w-4" />;
      case 'modification':
        return <Settings className="h-4 w-4" />;
      case 'maintenance':
        return <Settings className="h-4 w-4" />;
      case 'chat':
      case 'chat ia':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'création':
      case 'ajout':
        return 'bg-green-100 text-green-800';
      case 'modification':
        return 'bg-blue-100 text-blue-800';
      case 'suppression':
        return 'bg-red-100 text-red-800';
      case 'chat':
      case 'chat ia':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historique des activités récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Historique des activités récentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucune activité récente</p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-full ${getActionColor(activity.action)}`}>
                  {getActionIcon(activity.action)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {activity.action}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {activity.page}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
