
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStockCategories, StockCategory } from '@/hooks/useStockCategories';

interface ThresholdDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category?: StockCategory | null;
}

const ThresholdDialog: React.FC<ThresholdDialogProps> = ({ isOpen, onClose, category }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [threshold, setThreshold] = useState(10);

  const { categories, updateCategory } = useStockCategories();

  useEffect(() => {
    if (category) {
      setSelectedCategoryId(category.id);
      setThreshold(category.critical_threshold);
    } else if (categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
      setThreshold(categories[0].critical_threshold);
    }
  }, [category, categories, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateCategory.mutateAsync({
        id: selectedCategoryId,
        critical_threshold: threshold,
      });
      
      onClose();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Modifier le seuil critique</DialogTitle>
          <DialogDescription>
            Ajustez le seuil d'alerte pour détecter les stocks critiques.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {!category && (
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select 
                  value={selectedCategoryId} 
                  onValueChange={(value) => {
                    setSelectedCategoryId(value);
                    const cat = categories.find(c => c.id === value);
                    if (cat) setThreshold(cat.critical_threshold);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedCategory && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Catégorie sélectionnée:</p>
                <p className="text-lg font-semibold text-gray-900">{selectedCategory.name}</p>
                <p className="text-sm text-gray-600">
                  Seuil actuel: {selectedCategory.critical_threshold}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="threshold">Nouveau seuil critique *</Label>
              <Input
                id="threshold"
                type="number"
                min="1"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value) || 10)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Nombre minimum d'articles avant alerte critique
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={updateCategory.isPending}>
              Mettre à jour
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ThresholdDialog;
