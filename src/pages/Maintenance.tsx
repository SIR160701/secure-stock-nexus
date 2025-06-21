
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Plus, Calendar, User } from 'lucide-react';

interface MaintenanceItem {
  id: string;
  item: string;
  category: string;
  problem: string;
  technician: string;
  startDate: string;
  endDate: string;
  status: string;
  parkNumber?: string;
  serialNumber?: string;
}

const Maintenance = () => {
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([]);

  useEffect(() => {
    // Load maintenance items from localStorage
    const storedItems = JSON.parse(localStorage.getItem('maintenanceItems') || '[]');
    
    // Default items for demonstration
    const defaultItems = [
      {
        id: '1',
        item: 'Dell Latitude 5520',
        category: 'Ordinateurs',
        problem: 'Écran défaillant',
        technician: 'Jean Technicien',
        startDate: '2024-01-15',
        endDate: '2024-01-20',
        status: 'en_cours'
      },
      {
        id: '2',
        item: 'HP Imprimante Pro',
        category: 'Imprimantes',
        problem: 'Bourrage papier récurrent',
        technician: 'Marie Support',
        startDate: '2024-01-10',
        endDate: '2024-01-18',
        status: 'terminee'
      }
    ];

    setMaintenanceItems([...defaultItems, ...storedItems]);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      en_cours: { label: 'En cours', className: 'bg-yellow-100 text-yellow-800' },
      terminee: { label: 'Terminée', className: 'bg-green-100 text-green-800' },
      en_retard: { label: 'En retard', className: 'bg-red-100 text-red-800' }
    };
    
    return (
      <Badge className={statusConfig[status as keyof typeof statusConfig].className}>
        {statusConfig[status as keyof typeof statusConfig].label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-600 mt-2">Suivi des équipements en maintenance</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle maintenance
        </Button>
      </div>

      <div className="grid gap-4">
        {maintenanceItems.map(item => (
          <Card key={item.id} className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {item.item}
                    {item.parkNumber && (
                      <Badge variant="outline" className="text-xs">
                        {item.parkNumber}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{item.category} - {item.problem}</CardDescription>
                  {item.serialNumber && (
                    <p className="text-xs text-muted-foreground mt-1">N° Série: {item.serialNumber}</p>
                  )}
                </div>
                {getStatusBadge(item.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Technicien
                  </p>
                  <p className="text-sm text-muted-foreground">{item.technician}</p>
                </div>
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date de début
                  </p>
                  <p className="text-sm text-muted-foreground">{new Date(item.startDate).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date prévue de fin
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.endDate ? new Date(item.endDate).toLocaleDateString('fr-FR') : 'Non définie'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm">Modifier</Button>
                <Button variant="outline" size="sm">Clôturer</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Maintenance;
