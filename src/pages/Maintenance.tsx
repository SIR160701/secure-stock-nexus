import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, Calendar, AlertTriangle, CheckCircle, Clock, Edit, Trash2 } from 'lucide-react';
import { useMaintenance, MaintenanceRecord } from '@/hooks/useMaintenance';
import { useStock } from '@/hooks/useStock';
import { useActivityHistory } from '@/hooks/useActivityHistory';
import { MaintenanceDialog } from '@/components/MaintenanceDialog';
import { MaintenanceDeleteDialog } from '@/components/MaintenanceDeleteDialog';

const Maintenance = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<MaintenanceRecord | null>(null);

  const { maintenanceRecords, updateMaintenanceRecord, deleteMaintenanceRecord } = useMaintenance();
  const { stockItems, updateStockItem } = useStock();
  const { addActivity } = useActivityHistory();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-primary-100 text-primary-800 border-primary-200"><Calendar className="h-3 w-3 mr-1" />Planifié</Badge>;
      case 'in_progress':
        return <Badge className="bg-warning-100 text-warning-800 border-warning-200"><Clock className="h-3 w-3 mr-1" />En cours</Badge>;
      case 'completed':
        return <Badge className="bg-success-100 text-success-800 border-success-200"><CheckCircle className="h-3 w-3 mr-1" />Terminé</Badge>;
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
        return <Badge className="bg-destructive-50 text-destructive border-destructive-200">Haute</Badge>;
      case 'medium':
        return <Badge className="bg-warning-50 text-warning border-warning-200">Moyenne</Badge>;
      case 'low':
        return <Badge className="bg-success-50 text-success border-success-200">Basse</Badge>;
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

      // Trouver l'article correspondant dans le stock
      const relatedItem = stockItems.find(item => {
        const nameMatch = item.name === record.equipment_name;
        const parkMatch = record.park_number ? item.park_number === record.park_number : true;
        const serialMatch = record.serial_number ? item.serial_number === record.serial_number : true;
        
        return nameMatch && parkMatch && serialMatch;
      });

      if (relatedItem && relatedItem.status === 'discontinued') {
        // Restaurer le statut précédent stocké dans l'enregistrement de maintenance
        const previousStatus = record.previous_status || 'active';
        
        await updateStockItem.mutateAsync({
          id: relatedItem.id,
          status: previousStatus as 'active' | 'inactive' | 'discontinued'
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
      <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Wrench className="h-6 w-6" />
              </div>
              Gestion de la Maintenance
            </h1>
            <p className="text-orange-100">Suivez les maintenances de vos équipements</p>
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

      {/* Liste des maintenances groupées par statut */}
      <div className="space-y-6">
        {Object.entries(groupedRecords).map(([status, records]) => (
          <Card key={status} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-card via-muted/50 to-card border-b">
              <CardTitle className="flex items-center gap-3">
                {getStatusBadge(status)}
                <span className="text-xl font-bold">
                  {status === 'scheduled' && 'Maintenances Planifiées'}
                  {status === 'in_progress' && 'Maintenances en Cours'}
                  {status === 'completed' && 'Maintenances Terminées'}
                  {status === 'cancelled' && 'Maintenances Annulées'}
                </span>
                <Badge variant="outline" className="text-lg px-3 py-1">{records.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {records.map((record) => (
                  <div key={record.id} className="border border-border/50 rounded-2xl p-6 bg-gradient-to-br from-card to-muted/30 hover:shadow-lg transition-all duration-300">
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
                            className="bg-success-50 text-success border-success-200 hover:bg-success-100 hover:text-success-foreground"
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
                          className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
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
                      <div className="mt-4 p-4 bg-muted/50 rounded-xl border border-border/30">
                        <span className="font-semibold text-foreground">Notes:</span>
                        <p className="text-sm text-muted-foreground mt-2">{record.notes}</p>
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
          <p className="text-gray-600 mb-4">Les maintenances sont créées automatiquement depuis la page Stock.</p>
        </div>
      )}

      {/* Dialogs */}
      <MaintenanceDialog
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false);
          setSelectedRecord(null);
        }}
        onSubmit={async (data) => {
          if (selectedRecord) {
            await updateMaintenanceRecord.mutateAsync({
              id: selectedRecord.id,
              description: data.problem,
              technician_id: data.technician,
              scheduled_date: data.startDate.toISOString().split('T')[0],
              completed_date: data.endDate ? data.endDate.toISOString().split('T')[0] : undefined,
              status: data.status,
            });
          }
        }}
        initialData={selectedRecord ? {
          item: selectedRecord.equipment_name,
          category: '',
          problem: selectedRecord.description,
          technician: selectedRecord.technician_id || '',
          startDate: new Date(selectedRecord.scheduled_date),
          endDate: selectedRecord.completed_date ? new Date(selectedRecord.completed_date) : undefined,
          status: selectedRecord.status,
          parkNumber: '',
          serialNumber: '',
        } : undefined}
        mode="edit"
      />

      <MaintenanceDeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setRecordToDelete(null);
        }}
        onConfirm={async () => {
          if (recordToDelete) {
            await deleteMaintenanceRecord.mutateAsync(recordToDelete.id);
            addActivity.mutate({
              action: 'Suppression',
              description: `Maintenance "${recordToDelete.equipment_name}" supprimée`,
              page: 'Maintenance'
            });
            setShowDeleteDialog(false);
            setRecordToDelete(null);
          }
        }}
        itemName={recordToDelete?.equipment_name || ''}
      />
    </div>
  );
};

export default Maintenance;
