
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Package, AlertTriangle, Trash2 } from 'lucide-react';
import { useStock } from '@/hooks/useStock';
import { useStockCategories } from '@/hooks/useStockCategories';
import { useActivityHistory } from '@/hooks/useActivityHistory';
import { StockSearch } from '@/components/StockSearch';
import { CategoryFilter } from '@/components/CategoryFilter';
import { StockCategoryTable } from '@/components/StockCategoryTable';
import CategoryDialog from '@/components/CategoryDialog';
import StockItemDialog from '@/components/StockItemDialog';
import ThresholdDialog from '@/components/ThresholdDialog';
import { Badge } from '@/components/ui/badge';

const Stock = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showThresholdDialog, setShowThresholdDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState(null);

  const { stockItems, deleteStockItem } = useStock();
  const { categories, deleteCategory } = useStockCategories();
  const { addActivity } = useActivityHistory();

  // Filtrer les articles selon la recherche et la catégorie
  const filteredItems = stockItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.park_number && item.park_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.serial_number && item.serial_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.status.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Grouper les articles par catégorie avec gestion des seuils critiques
  const itemsByCategory = categories
    .filter(category => selectedCategory === 'all' || category.name === selectedCategory)
    .map(category => {
      const categoryItems = filteredItems.filter(item => item.category === category.name);
      const availableCount = stockItems.filter(item => 
        item.category === category.name && item.status === 'active'
      ).length;
      
      // Déterminer le statut du seuil critique
      let thresholdStatus: 'safe' | 'warning' | 'critical' = 'safe';
      if (availableCount <= category.critical_threshold) {
        thresholdStatus = 'critical';
      } else if (availableCount <= category.critical_threshold * 1.5) {
        thresholdStatus = 'warning';
      }
      
      return {
        category,
        items: categoryItems,
        availableCount,
        thresholdStatus
      };
    });

  // Calculer les statistiques et alertes
  const totalItems = stockItems.length;
  const criticalCategories = itemsByCategory.filter(cat => cat.thresholdStatus === 'critical');
  const warningCategories = itemsByCategory.filter(cat => cat.thresholdStatus === 'warning');

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setShowItemDialog(true);
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      const item = stockItems.find(i => i.id === id);
      await deleteStockItem.mutateAsync(id);
      
      addActivity.mutate({
        action: 'Suppression',
        description: `Article "${item?.name}" supprimé du stock`,
        page: 'Stock'
      });
    }
  };

  const handleDeleteCategory = async (category) => {
    const categoryItems = stockItems.filter(item => item.category === category.name);
    if (categoryItems.length > 0) {
      alert('Impossible de supprimer cette catégorie car elle contient des articles.');
      return;
    }
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`)) {
      await deleteCategory.mutateAsync(category.id);
      
      addActivity.mutate({
        action: 'Suppression',
        description: `Catégorie "${category.name}" supprimée`,
        page: 'Stock'
      });
    }
  };

  const handleEditThreshold = (category) => {
    setSelectedCategoryForEdit(category);
    setShowThresholdDialog(true);
  };

  const getCriticalBadgeColor = (status: 'safe' | 'warning' | 'critical') => {
    switch (status) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-green-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec alertes */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
              Gestion du Stock
            </h1>
            <p className="text-blue-100">Gérez vos articles par catégorie avec alertes de seuil critique</p>
            
            {/* Alertes critiques par catégorie */}
            {(criticalCategories.length > 0 || warningCategories.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {criticalCategories.map(({ category, availableCount }) => (
                  <Badge key={category.id} variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {category.name} - Critique ({availableCount}/{category.critical_threshold})
                  </Badge>
                ))}
                {warningCategories.map(({ category, availableCount }) => (
                  <Badge key={category.id} className="bg-yellow-500 text-white flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {category.name} - Attention ({availableCount}/{Math.ceil(category.critical_threshold * 1.5)})
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalItems}</div>
              <div className="text-sm text-blue-200">Articles total</div>
            </div>
            {criticalCategories.length > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-red-300 flex items-center gap-1">
                  <AlertTriangle className="h-5 w-5" />
                  {criticalCategories.length}
                </div>
                <div className="text-sm text-red-200">Catégories critiques</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barre de recherche, filtre et boutons d'action */}
      <div className="flex items-center gap-4">
        <StockSearch 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
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

      {/* Affichage par catégories avec badges de statut */}
      <div className="space-y-6">
        {itemsByCategory.map(({ category, items, availableCount, thresholdStatus }) => (
          <div key={category.id} className="relative">
            {/* Badge de statut de seuil */}
            <div className="absolute top-4 right-4 z-10">
              <Badge className={getCriticalBadgeColor(thresholdStatus)}>
                {thresholdStatus === 'critical' && 'Critique'}
                {thresholdStatus === 'warning' && 'Attention'}
                {thresholdStatus === 'safe' && 'OK'}
              </Badge>
            </div>
            
            <StockCategoryTable
              category={category}
              items={items}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              onEditThreshold={handleEditThreshold}
              onDeleteCategory={handleDeleteCategory}
              availableCount={availableCount}
              thresholdStatus={thresholdStatus}
            />
          </div>
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
          setSelectedCategoryForEdit(null);
        }}
        category={selectedCategoryForEdit}
      />
    </div>
  );
};

export default Stock;
