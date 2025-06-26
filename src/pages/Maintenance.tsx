import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Wrench, Calendar, AlertTriangle, CheckCircle, Clock, Edit, Trash2 } from 'lucide-react';
import { useMaintenance, MaintenanceRecord } from '@/hooks/useMaintenance';
import { useStock } from '@/hooks/useStock';
import { useActivityHistory } from '@/hooks/useActivityHistory';
import MaintenanceDialog from '@/components/MaintenanceDialog';
import MaintenanceDeleteDialog from '@/components/MaintenanceDeleteDialog';

const Maintenance = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<MaintenanceRecord | null>(null);

  const { maintenanceRecords, updateMaintenanceRecord } = useMaintenance();
  const { stockItems, updateStockItem } = useStock();
  const { addActivity } = useActivityHistory();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800"><Calendar className="h-3 w-3 mr-1" />Planifié</Badge>;
      case 'in_progress':
        return <Badge className="bg-orange-100 text-orange-800"><Clock className="h-3 w-3 mr-1" />En cours</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Terminé</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Annulé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Critique</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-800">Haute</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Moyenne</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Basse</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const handleCompleteRecord = async (record: MaintenanceRecord) => {
    try {
      // Mettre à jour le record de maintenance
      await updateMaintenanceRecord.mutateAsync({
        id: record.id,
        status: 'completed',
        completed_date: new Date().toISOString().split('T')[0]
      });

      // Trouver l'article correspondant et restaurer son statut précédent
      const relatedItem = stockItems.find(item => 
        item.name === record.equipment_name && 
        (item.park_number === record.equipment_name || item.serial_number === record.equipment_name)
      );

      if (relatedItem && relatedItem.status === 'discontinued') {
        // Restaurer le statut précédent (par défaut 'active' si pas d'info)
        await updateStockItem.mutateAsync({
          id: relatedItem.id,
          status: 'active' // ou 'inactive' selon la logique métier
        });
      }

      addActivity.mutate({
        action: 'Maintenance',
        description: `Maintenance "${record.equipment_name}" terminée`,
        page: 'Maintenance'
      });
    } catch (error) {
      console.error('Erreur lors de la clôture de la maintenance:', error);
    }
  };

  const handleEditRecord = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setShowDialog(true);
  };

  const handleDeleteRecord = (record: MaintenanceRecord) => {
    setRecordToDelete(record);
    setShowDeleteDialog(true);
  };

  const totalRecords = maintenanceRecords.length;
  const pendingRecords = maintenanceRecords.filter(r => r.status === 'scheduled' || r.status === 'in_progress').length;
  const completedRecords = maintenanceRecords.filter(r => r.status === 'completed').length;

  const groupedRecords = maintenanceRecords.reduce((acc, record) => {
    if (!acc[record.status]) {
      acc[record.status] = [];
    }
    acc[record.status].push(record);
    return acc;
  }, {} as Record<string, MaintenanceRecord[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-900 to-red-900 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Wrench className="h-6 w-6" />
              </div>
              Gestion de la Maintenance
            </h1>
            <p className="text-orange-100">Planifiez et suivez les maintenances de vos équipements</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalRecords}</div>
              <div className="text-sm text-orange-200">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-300">{pendingRecords}</div>
              <div className="text-sm text-orange-200">En cours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-300">{completedRecords}</div>
              <div className="text-sm text-orange-200">Terminées</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton d'ajout */}
      <div className="flex justify-end">
        <Button onClick={() => {
          setSelectedRecord(null);
          setShowDialog(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle maintenance
        </Button>
      </div>

      {/* Liste des maintenances groupées par statut */}
      <div className="space-y-6">
        {Object.entries(groupedRecords).map(([status, records]) => (
          <Card key={status}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusBadge(status)}
                <span className="text-lg">
                  {status === 'scheduled' && 'Maintenances Planifiées'}
                  {status === 'in_progress' && 'Maintenances en Cours'}
                  {status === 'completed' && 'Maintenances Terminées'}
                  {status === 'cancelled' && 'Maintenances Annulées'}
                </span>
                <Badge variant="outline">{records.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {records.map((record) => (
                  <div key={record.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{record.equipment_name}</h3>
                        {getPriorityBadge(record.priority)}
                      </div>
                      <div className="flex items-center gap-2">
                        {record.status !== 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCompleteRecord(record)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Clôturer
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRecord(record)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRecord(record)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{record.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Type:</span>
                        <p className="capitalize">{record.maintenance_type}</p>
                      </div>
                      <div>
                        <span className="font-medium">Date prévue:</span>
                        <p>{new Date(record.scheduled_date).toLocaleDateString('fr-FR')}</p>
                      </div>
                      {record.completed_date && (
                        <div>
                          <span className="font-medium">Date réalisée:</span>
                          <p>{new Date(record.completed_date).toLocaleDateString('fr-FR')}</p>
                        </div>
                      )}
                      {record.cost && (
                        <div>
                          <span className="font-medium">Coût:</span>
                          <p>{record.cost}€</p>
                        </div>
                      )}
                    </div>
                    
                    {record.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <span className="font-medium">Notes:</span>
                        <p className="text-sm text-gray-600 mt-1">{record.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {maintenanceRecords.length === 0 && (
        <div className="text-center py-12">
          <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune maintenance enregistrée</h3>
          <p className="text-gray-600 mb-4">Commencez par planifier une maintenance pour vos équipements.</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer une maintenance
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <MaintenanceDialog
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false);
          setSelectedRecord(null);
        }}
        record={selectedRecord}
      />

      <MaintenanceDeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setRecordToDelete(null);
        }}
        record={recordToDelete}
      />
    </div>
  );
};

export default Maintenance;
