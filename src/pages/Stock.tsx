
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, Settings } from 'lucide-react';
import { useStock } from '@/hooks/useStock';
import { useStockCategories } from '@/hooks/useStockCategories';
import CategoryDialog from '@/components/CategoryDialog';
import StockItemDialog from '@/components/StockItemDialog';
import ThresholdDialog from '@/components/ThresholdDialog';

const Stock = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showThresholdDialog, setShowThresholdDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const { stockItems, deleteStockItem } = useStock();
  const { categories } = useStockCategories();

  // Filter items
  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.park_number && item.park_number.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Stats calculation
  const totalItems = stockItems.length;
  const criticalItems = stockItems.filter(item => 
    item.minimum_quantity && item.quantity <= item.minimum_quantity
  ).length;
  const availableItems = stockItems.filter(item => item.status === 'active').length;
  const assignedItems = stockItems.filter(item => item.status === 'inactive').length;

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowItemDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      await deleteStockItem.mutateAsync(id);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Disponible</Badge>;
      case 'inactive':
        return <Badge className="bg-blue-100 text-blue-800">Alloué</Badge>;
      case 'discontinued':
        return <Badge className="bg-orange-100 text-orange-800">Maintenance</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Gestion du Stock</h1>
        <p className="text-blue-100">Gérez vos articles, catégories et surveillez les seuils critiques</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableItems}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alloués</CardTitle>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{assignedItems}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalItems}</div>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Catégories</CardTitle>
              <CardDescription>Gérez les catégories et leurs seuils critiques</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowThresholdDialog(true)} variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Modifier seuil
              </Button>
              <Button onClick={() => setShowCategoryDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle catégorie
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedCategory === 'all' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => setSelectedCategory('all')}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
                <div className="text-sm text-gray-500">Toutes catégories</div>
              </CardContent>
            </Card>
            
            {categories.map((category) => {
              const itemsInCategory = stockItems.filter(item => item.category === category.name);
              const criticalInCategory = itemsInCategory.filter(item => 
                item.quantity <= category.critical_threshold
              ).length;
              
              return (
                <Card 
                  key={category.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedCategory === category.name ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{itemsInCategory.length}</div>
                    <div className="text-sm text-gray-500">{category.name}</div>
                    {criticalInCategory > 0 && (
                      <Badge variant="destructive" className="text-xs mt-1">
                        {criticalInCategory} critiques
                      </Badge>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      Seuil: {category.critical_threshold}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Articles Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Articles</CardTitle>
              <CardDescription>Liste complète des articles en stock</CardDescription>
            </div>
            <Button onClick={() => {
              setSelectedItem(null);
              setShowItemDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel article
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, SKU ou numéro de parc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modèle</TableHead>
                  <TableHead>N° de parc</TableHead>
                  <TableHead>N° de série</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Dernière MAJ</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const isCritical = item.minimum_quantity && item.quantity <= item.minimum_quantity;
                  
                  return (
                    <TableRow key={item.id} className={isCritical ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.park_number || '-'}</TableCell>
                      <TableCell>{item.serial_number || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{item.quantity}</span>
                          {isCritical && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(item.updated_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CategoryDialog
        isOpen={showCategoryDialog}
        onClose={() => setShowCategoryDialog(false)}
      />
      
      <StockItemDialog
        isOpen={showItemDialog}
        onClose={() => setShowItemDialog(false)}
        item={selectedItem}
      />
      
      <ThresholdDialog
        isOpen={showThresholdDialog}
        onClose={() => setShowThresholdDialog(false)}
      />
    </div>
  );
};

export default Stock;
