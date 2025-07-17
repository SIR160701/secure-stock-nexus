
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMaintenance } from '@/hooks/useMaintenance';
import { useUsers } from '@/hooks/useUsers';
import { useActivityHistory } from '@/hooks/useActivityHistory';
import { supabase } from '@/integrations/supabase/client';

interface MaintenanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  maintenance?: any;
}

const MaintenanceDialog: React.FC<MaintenanceDialogProps> = ({ isOpen, onClose, maintenance }) => {
  const [formData, setFormData] = useState({
    equipment_name: '',
    park_number: '',
    serial_number: '',
    maintenance_type: '',
    description: '',
    priority: 'medium',
    scheduled_date: '',
    technician_id: '',
    status: 'scheduled'
  });

  const { createMaintenanceRecord, updateMaintenanceRecord } = useMaintenance();
  const { users } = useUsers();
  const { addActivity } = useActivityHistory();

  useEffect(() => {
    if (maintenance) {
      setFormData({
        equipment_name: maintenance.equipment_name || '',
        park_number: maintenance.park_number || '',
        serial_number: maintenance.serial_number || '',
        maintenance_type: maintenance.maintenance_type || '',
        description: maintenance.description || '',
        priority: maintenance.priority || 'medium',
        scheduled_date: maintenance.scheduled_date || '',
        technician_id: maintenance.technician_id || '',
        status: maintenance.status || 'scheduled'
      });
    } else {
      setFormData({
        equipment_name: '',
        park_number: '',
        serial_number: '',
        maintenance_type: '',
        description: '',
        priority: 'medium',
        scheduled_date: '',
        technician_id: '',
        status: 'scheduled'
      });
    }
  }, [maintenance, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (maintenance) {
        // Mise à jour
        await updateMaintenanceRecord.mutateAsync({
          id: maintenance.id,
          ...formData
        });
        
        addActivity.mutate({
          action: 'Modification',
          description: `Maintenance "${formData.equipment_name}" modifiée`,
          page: 'Maintenance'
        });
      } else {
        // Création
        await createMaintenanceRecord.mutateAsync(formData);
        
        // Envoi d'email au technicien assigné
        if (formData.technician_id) {
          const assignedTechnician = users.find(user => user.id === formData.technician_id);
          if (assignedTechnician?.email) {
            console.log('Envoi d\'email au technicien:', assignedTechnician.email);
            
            try {
              const { error: emailError } = await supabase.functions.invoke('send-maintenance-email', {
                body: {
                  technicianEmail: assignedTechnician.email,
                  technicianName: assignedTechnician.full_name || 'Technicien',
                  equipmentName: formData.equipment_name,
                  parkNumber: formData.park_number,
                  serialNumber: formData.serial_number,
                  description: formData.description,
                  priority: formData.priority,
                  scheduledDate: formData.scheduled_date
                }
              });
              
              if (emailError) {
                console.error('Erreur envoi email:', emailError);
              } else {
                console.log('Email envoyé avec succès');
              }
            } catch (error) {
              console.error('Erreur lors de l\'envoi de l\'email:', error);
            }
          }
        }
        
        addActivity.mutate({
          action: 'Création',
          description: `Maintenance "${formData.equipment_name}" créée et assignée`,
          page: 'Maintenance'
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const selectedTechnician = users.find(user => user.id === formData.technician_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{maintenance ? 'Modifier' : 'Créer'} une maintenance</DialogTitle>
          <DialogDescription>
            {maintenance ? 'Modifiez les informations de la maintenance.' : 'Créez une nouvelle maintenance préventive ou corrective.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="equipment_name">Équipement *</Label>
                <Input
                  id="equipment_name"
                  value={formData.equipment_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, equipment_name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="maintenance_type">Type de maintenance *</Label>
                <Select value={formData.maintenance_type} onValueChange={(value) => setFormData(prev => ({ ...prev, maintenance_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Préventive</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                    <SelectItem value="emergency">Urgence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="park_number">Numéro de parc</Label>
                <Input
                  id="park_number"
                  value={formData.park_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, park_number: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="serial_number">Numéro de série</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priorité *</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="scheduled_date">Date programmée *</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="technician_id">Technicien assigné *</Label>
              <Select value={formData.technician_id} onValueChange={(value) => setFormData(prev => ({ ...prev, technician_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un technicien" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTechnician && (
                <p className="text-sm text-gray-600 mt-1">
                  Email: {selectedTechnician.email}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description du problème *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez le problème ou la maintenance à effectuer..."
                required
              />
            </div>

            {maintenance && (
              <div>
                <Label htmlFor="status">Statut</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Programmée</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminée</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={createMaintenanceRecord.isPending || updateMaintenanceRecord.isPending}>
              {maintenance ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceDialog;
