
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Package, AlertTriangle } from 'lucide-react';
import { useStock } from '@/hooks/useStock';
import { useStockCategories } from '@/hooks/useStockCategories';
import { StockSearch } from '@/components/StockSearch';
import { StockCategoryTable } from '@/components/StockCategoryTable';
import CategoryDialog from '@/components/CategoryDialog';
import StockItemDialog from '@/components/StockItemDialog';
import ThresholdDialog from '@/components/ThresholdDialog';

const Stock = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showThresholdDialog, setShowThresholdDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { stockItems, deleteStockItem } = useStock();
  const { categories } = useStockCategories();

  // Filtrer les articles selon la recherche
  const filteredItems = stockItems.filter(item => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(search) ||
      (item.park_number && item.park_number.toLowerCase().includes(search)) ||
      (item.serial_number && item.serial_number.toLowerCase().includes(search)) ||
      item.status.toLowerCase().includes(search)
    );
  });

  // Grouper les articles par catégorie
  const itemsByCategory = categories.map(category => {
    const categoryItems = filteredItems.filter(item => item.category === category.name);
    return {
      category,
      items: categoryItems
    };
  });

  // Statistiques
  const totalItems = stockItems.length;
  const criticalItems = stockItems.filter(item => {
    const category = categories.find(cat => cat.name === item.category);
    return category && item.quantity <= category.critical_threshold;
  }).length;

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setShowItemDialog(true);
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      await deleteStockItem.mutateAsync(id);
    }
  };

  const handleEditThreshold = (category) => {
    setSelectedCategory(category);
    setShowThresholdDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
              Gestion du Stock
            </h1>
            <p className="text-blue-100">Gérez vos articles par catégorie avec recherche intelligente</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalItems}</div>
              <div className="text-sm text-blue-200">Articles total</div>
            </div>
            {criticalItems > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-red-300 flex items-center gap-1">
                  <AlertTriangle className="h-5 w-5" />
                  {criticalItems}
                </div>
                <div className="text-sm text-red-200">Critiques</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barre de recherche et boutons d'action */}
      <div className="flex items-center gap-4">
        <StockSearch 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <Button onClick={() => setShowCategoryDialog(true)} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle catégorie
        </Button>
        <Button onClick={() => {
          setSelectedItem(null);
          setShowItemDialog(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel article
        </Button>
      </div>

      {/* Affichage par catégories */}
      <div className="space-y-6">
        {itemsByCategory.map(({ category, items }) => (
          <StockCategoryTable
            key={category.id}
            category={category}
            items={items}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onEditThreshold={handleEditThreshold}
          />
        ))}
        
        {itemsByCategory.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune catégorie trouvée</h3>
            <p className="text-gray-600 mb-4">Commencez par créer une catégorie pour organiser vos articles.</p>
            <Button onClick={() => setShowCategoryDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une catégorie
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CategoryDialog
        isOpen={showCategoryDialog}
        onClose={() => setShowCategoryDialog(false)}
      />
      
      <StockItemDialog
        isOpen={showItemDialog}
        onClose={() => {
          setShowItemDialog(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
      />
      
      <ThresholdDialog
        isOpen={showThresholdDialog}
        onClose={() => {
          setShowThresholdDialog(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
      />
    </div>
  );
};

export default Stock;
