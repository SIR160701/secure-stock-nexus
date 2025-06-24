
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStock, StockItem } from '@/hooks/useStock';
import { useStockCategories } from '@/hooks/useStockCategories';

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

  const { createStockItem, updateStockItem } = useStock();
  const { categories } = useStockCategories();

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
      category: '',
      status: 'active',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const itemData = {
        name: formData.name,
        park_number: formData.park_number,
        serial_number: formData.serial_number,
        category: formData.category,
        status: formData.status,
        sku: `SKU-${Date.now()}`,
        quantity: 1,
      };

      if (item) {
        await updateStockItem.mutateAsync({
          id: item.id,
          ...itemData,
        });
      } else {
        await createStockItem.mutateAsync(itemData);
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{item ? 'Modifier l\'article' : 'Nouvel article'}</DialogTitle>
          <DialogDescription>
            {item ? 'Modifier les informations de l\'article.' : 'Ajouter un nouvel article au stock.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Modèle</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="park_number" className="text-right">N° de parc</Label>
              <Input
                id="park_number"
                value={formData.park_number}
                onChange={(e) => setFormData({ ...formData, park_number: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="serial_number" className="text-right">N° de série</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Catégorie</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="col-span-3">
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
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Statut</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionner un statut" />
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
