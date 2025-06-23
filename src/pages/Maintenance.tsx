
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Plus, Calendar, User, Trash2, Edit } from 'lucide-react';
import { useMaintenance, MaintenanceRecord } from '@/hooks/useMaintenance';
import { useAuth } from '@/contexts/AuthContext';
import { MaintenanceDialog } from '@/components/MaintenanceDialog';
import { MaintenanceDeleteDialog } from '@/components/MaintenanceDeleteDialog';
import { useToast } from '@/hooks/use-toast';

const Maintenance = () => {
  const { maintenanceRecords, isLoading, createMaintenanceRecord, updateMaintenanceRecord, deleteMaintenanceRecord } = useMaintenance();
  const { hasPermission } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MaintenanceRecord | null>(null);
  const [deletingItem, setDeletingItem] = useState<MaintenanceRecord | null>(null);
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'Planifiée', className: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'En cours', className: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Terminée', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-800' }
    };
    
    return (
      <Badge className={statusConfig[status as keyof typeof statusConfig].className}>
        {statusConfig[status as keyof typeof statusConfig].label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Basse', className: 'bg-gray-100 text-gray-800' },
      medium: { label: 'Moyenne', className: 'bg-blue-100 text-blue-800' },
      high: { label: 'Haute', className: 'bg-orange-100 text-orange-800' },
      critical: { label: 'Critique', className: 'bg-red-100 text-red-800' }
    };
    
    return (
      <Badge className={priorityConfig[priority as keyof typeof priorityConfig].className}>
        {priorityConfig[priority as keyof typeof priorityConfig].label}
      </Badge>
    );
  };

  const handleCreateMaintenance = async (data: any) => {
    await createMaintenanceRecord.mutateAsync({
      equipment_name: data.item,
      maintenance_type: 'corrective',
      description: data.problem,
      scheduled_date: data.startDate.toISOString().split('T')[0],
      completed_date: data.endDate ? data.endDate.toISOString().split('T')[0] : undefined,
      status: data.status,
      priority: 'medium',
    });
  };

  const handleEditMaintenance = async (data: any) => {
    if (editingItem) {
      await updateMaintenanceRecord.mutateAsync({
        id: editingItem.id,
        equipment_name: data.item,
        description: data.problem,
        scheduled_date: data.startDate.toISOString().split('T')[0],
        completed_date: data.endDate ? data.endDate.toISOString().split('T')[0] : undefined,
        status: data.status,
      });
      setEditingItem(null);
    }
  };

  const handleCloseItem = async (id: string) => {
    await updateMaintenanceRecord.mutateAsync({
      id,
      status: 'completed',
      completed_date: new Date().toISOString().split('T')[0],
    });
    
    const item = maintenanceRecords.find(i => i.id === id);
    toast({
      title: 'Maintenance clôturée',
      description: `La maintenance pour ${item?.equipment_name} a été marquée comme terminée.`,
    });
  };

  const handleDeleteItem = (item: MaintenanceRecord) => {
    setDeletingItem(item);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (deletingItem) {
      await deleteMaintenanceRecord.mutateAsync(deletingItem.id);
      
      toast({
        title: 'Maintenance supprimée',
        description: `La maintenance pour ${deletingItem.equipment_name} a été supprimée.`,
      });
      
      setDeletingItem(null);
      setShowDeleteDialog(false);
    }
  };

  const openEditDialog = (item: MaintenanceRecord) => {
    const editData = {
      id: item.id,
      item: item.equipment_name,
      category: 'Équipement',
      problem: item.description,
      technician: 'À assigner',
      startDate: new Date(item.scheduled_date),
      endDate: item.completed_date ? new Date(item.completed_date) : undefined,
      status: item.status as 'scheduled' | 'in_progress' | 'completed',
    };
    setEditingItem(item);
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingItem(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
            <Settings className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600">Chargement des maintenances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-600 mt-2">Suivi des équipements en maintenance</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle maintenance
        </Button>
      </div>

      <div className="grid gap-4">
        {maintenanceRecords.map((item) => (
          <Card key={item.id} className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {item.equipment_name}
                    {getPriorityBadge(item.priority)}
                  </CardTitle>
                  <CardDescription>{item.maintenance_type} - {item.description}</CardDescription>
                </div>
                {getStatusBadge(item.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date prévue
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(item.scheduled_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {item.completed_date && (
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date de fin
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.completed_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
                {item.cost && (
                  <div>
                    <p className="text-sm font-medium">Coût</p>
                    <p className="text-sm text-muted-foreground">{item.cost}€</p>
                  </div>
                )}
              </div>
              {item.notes && (
                <div className="mt-4">
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm text-muted-foreground">{item.notes}</p>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                {item.status !== 'completed' && (
                  <Button variant="outline" size="sm" onClick={() => handleCloseItem(item.id)}>
                    Clôturer
                  </Button>
                )}
                {hasPermission('admin') && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteItem(item)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <MaintenanceDialog
        isOpen={showDialog}
        onClose={closeDialog}
        onSubmit={editingItem ? handleEditMaintenance : handleCreateMaintenance}
        initialData={editingItem ? {
          id: editingItem.id,
          item: editingItem.equipment_name,
          category: 'Équipement',
          problem: editingItem.description,
          technician: 'À assigner',
          startDate: new Date(editingItem.scheduled_date),
          endDate: editingItem.completed_date ? new Date(editingItem.completed_date) : undefined,
          status: editingItem.status as 'scheduled' | 'in_progress' | 'completed',
        } : undefined}
        mode={editingItem ? 'edit' : 'create'}
      />

      <MaintenanceDeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeletingItem(null);
        }}
        onConfirm={confirmDelete}
        itemName={deletingItem?.equipment_name || ''}
      />
    </div>
  );
};

export default Maintenance;
