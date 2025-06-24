
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStockCategories, StockCategory } from '@/hooks/useStockCategories';

interface CategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category?: StockCategory | null;
}

const CategoryDialog: React.FC<CategoryDialogProps> = ({ isOpen, onClose, category }) => {
  const [formData, setFormData] = useState({
    name: '',
    critical_threshold: 10,
  });

  const { createCategory, updateCategory } = useStockCategories();

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        critical_threshold: category.critical_threshold || 10,
      });
    } else {
      resetForm();
    }
  }, [category, isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      critical_threshold: 10,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (category) {
        await updateCategory.mutateAsync({
          id: category.id,
          ...formData,
        });
      } else {
        await createCategory.mutateAsync(formData);
      }
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle>
          <DialogDescription>
            {category ? 'Modifier les informations de la catégorie.' : 'Créer une nouvelle catégorie pour organiser vos articles.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="name">Nom de la catégorie *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Informatique, Mobilier, Électronique..."
                required
              />
            </div>

            <div>
              <Label htmlFor="critical_threshold">Seuil critique *</Label>
              <Input
                id="critical_threshold"
                type="number"
                min="1"
                value={formData.critical_threshold}
                onChange={(e) => setFormData({ ...formData, critical_threshold: parseInt(e.target.value) || 10 })}
                placeholder="Ex: 5"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Nombre minimum d'articles avant alerte critique
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              resetForm();
              onClose();
            }}>
              Annuler
            </Button>
            <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
              {category ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDialog;
