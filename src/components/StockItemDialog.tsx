
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStock, StockItem } from '@/hooks/useStock';
import { useStockCategories } from '@/hooks/useStockCategories';
import { useMaintenance } from '@/hooks/useMaintenance';
import { useActivityHistory } from '@/hooks/useActivityHistory';

interface StockItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item?: StockItem | null;
}

const StockItemDialog: React.FC<StockItemDialogProps> = ({ isOpen, onClose, item }) => {
  const [formData, setFormData] = useState({
    name: '',
    park_number: '',
    serial_number: '',
    category: '',
    status: 'active' as 'active' | 'inactive' | 'discontinued',
  });

  const [maintenanceData, setMaintenanceData] = useState({
    problem_description: '',
    technician_name: '',
    start_date: '',
    end_date: '',
    maintenance_status: 'scheduled' as 'scheduled' | 'in_progress',
  });

  const { createStockItem, updateStockItem } = useStock();
  const { categories } = useStockCategories();
  const { createMaintenanceRecord } = useMaintenance();
  const { addActivity } = useActivityHistory();

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        park_number: item.park_number || '',
        serial_number: item.serial_number || '',
        category: item.category || '',
        status: item.status || 'active',
      });
    } else {
      resetForm();
    }
  }, [item, isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      park_number: '',
      serial_number: '',
      category: categories.length > 0 ? categories[0].name : '',
      status: 'active',
    });
    setMaintenanceData({
      problem_description: '',
      technician_name: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      maintenance_status: 'scheduled',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category) {
      return;
    }
    
    try {
      const itemData = {
        name: formData.name,
        park_number: formData.park_number,
        serial_number: formData.serial_number,
        category: formData.category,
        status: formData.status,
        sku: `SKU-${Date.now()}`,
        quantity: 1,
        description: `Article: ${formData.name}`,
        previous_status: item?.status || 'active',
      };

      let savedItem;
      if (item) {
        savedItem = await updateStockItem.mutateAsync({
          id: item.id,
          ...itemData,
        });
        
        addActivity.mutate({
          action: 'Modification',
          description: `Article "${formData.name}" modifié`,
          page: 'Stock'
        });
      } else {
        savedItem = await createStockItem.mutateAsync(itemData);
        
        addActivity.mutate({
          action: 'Création',
          description: `Nouvel article "${formData.name}" ajouté au stock`,
          page: 'Stock'
        });
      }

      if (formData.status === 'discontinued' && maintenanceData.problem_description) {
        await createMaintenanceRecord.mutateAsync({
          equipment_name: formData.name,
          maintenance_type: 'corrective',
          description: maintenanceData.problem_description,
          scheduled_date: maintenanceData.start_date,
          completed_date: maintenanceData.end_date || undefined,
          status: maintenanceData.maintenance_status,
          priority: 'medium',
        });

        addActivity.mutate({
          action: 'Maintenance',
          description: `Maintenance créée pour "${formData.name}"`,
          page: 'Maintenance'
        });
      }
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const statusOptions = [
    { value: 'active', label: 'Disponible' },
    { value: 'inactive', label: 'Alloué' },
    { value: 'discontinued', label: 'Maintenance' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Modifier l\'article' : 'Nouvel article'}</DialogTitle>
          <DialogDescription>
            {item ? 'Modifier les informations de l\'article.' : 'Ajouter un nouvel article au stock.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="name">Modèle de l'article *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Laptop Dell Latitude 5520"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="park_number">Numéro de parc</Label>
                <Input
                  id="park_number"
                  value={formData.park_number}
                  onChange={(e) => setFormData({ ...formData, park_number: e.target.value })}
                  placeholder="Ex: PC001"
                />
              </div>
              <div>
                <Label htmlFor="serial_number">Numéro de série</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  placeholder="Ex: SN123456"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Statut *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'active' | 'inactive' | 'discontinued') => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le statut" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.status === 'discontinued' && (
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-lg font-semibold">Informations de maintenance</h3>
                
                <div>
                  <Label htmlFor="problem_description">Description du problème *</Label>
                  <Textarea
                    id="problem_description"
                    value={maintenanceData.problem_description}
                    onChange={(e) => setMaintenanceData({ ...maintenanceData, problem_description: e.target.value })}
                    placeholder="Décrivez le problème rencontré..."
                    required={formData.status === 'discontinued'}
                  />
                </div>

                <div>
                  <Label htmlFor="technician_name">Nom du technicien *</Label>
                  <Input
                    id="technician_name"
                    value={maintenanceData.technician_name}
                    onChange={(e) => setMaintenanceData({ ...maintenanceData, technician_name: e.target.value })}
                    placeholder="Ex: Jean Technicien"
                    required={formData.status === 'discontinued'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Date de début *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={maintenanceData.start_date}
                      onChange={(e) => setMaintenanceData({ ...maintenanceData, start_date: e.target.value })}
                      required={formData.status === 'discontinued'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">Date de fin prévue</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={maintenanceData.end_date}
                      onChange={(e) => setMaintenanceData({ ...maintenanceData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="maintenance_status">Statut de maintenance *</Label>
                  <Select 
                    value={maintenanceData.maintenance_status} 
                    onValueChange={(value: 'scheduled' | 'in_progress') => 
                      setMaintenanceData({ ...maintenanceData, maintenance_status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Planifié</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              resetForm();
              onClose();
            }}>
              Annuler
            </Button>
            <Button type="submit" disabled={createStockItem.isPending || updateStockItem.isPending}>
              {item ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockItemDialog;
