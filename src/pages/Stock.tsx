import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Package, Plus, Edit, Trash2, Search, Settings } from 'lucide-react';
import { useStock, StockItem } from '@/hooks/useStock';
import { useAuth } from '@/contexts/AuthContext';

const Stock = () => {
  const { stockItems, isLoading, createStockItem, updateStockItem, deleteStockItem } = useStock();
  const { hasPermission } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    category: '',
    quantity: '',
    minimum_quantity: '',
    unit_price: '',
    supplier: '',
    location: '',
    park_number: '',
    serial_number: '',
    status: 'active' as 'active' | 'inactive' | 'discontinued',
  });

  // Get unique categories
  const categories = [...new Set(stockItems.map(item => item.category))];
  
  // Filter items
  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.park_number && item.park_number.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group items by category
  const groupedItems = categories.reduce((acc, category) => {
    const categoryItems = filteredItems.filter(item => item.category === category);
    if (categoryItems.length > 0) {
      acc[category] = categoryItems;
    }
    return acc;
  }, {} as Record<string, StockItem[]>);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sku: '',
      category: '',
      quantity: '',
      minimum_quantity: '',
      unit_price: '',
      supplier: '',
      location: '',
      park_number: '',
      serial_number: '',
      status: 'active',
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: StockItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      sku: item.sku,
      category: item.category,
      quantity: item.quantity.toString(),
      minimum_quantity: item.minimum_quantity?.toString() || '',
      unit_price: item.unit_price?.toString() || '',
      supplier: item.supplier || '',
      location: item.location || '',
      park_number: item.park_number || '',
      serial_number: item.serial_number || '',
      status: item.status as 'active' | 'inactive' | 'discontinued',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemData = {
      ...formData,
      quantity: parseInt(formData.quantity),
      minimum_quantity: formData.minimum_quantity ? parseInt(formData.minimum_quantity) : undefined,
      unit_price: formData.unit_price ? parseFloat(formData.unit_price) : undefined,
    };

    if (editingItem) {
      await updateStockItem.mutateAsync({ id: editingItem.id, ...itemData });
    } else {
      await createStockItem.mutateAsync(itemData);
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      await deleteStockItem.mutateAsync(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Disponible': { className: 'bg-green-100 text-green-700 border-green-200' },
      'Alloué': { className: 'bg-blue-100 text-blue-700 border-blue-200' },
      'Maintenance': { className: 'bg-red-100 text-red-700 border-red-200' }
    };
    
    return (
      <Badge className={statusConfig[status as keyof typeof statusConfig]?.className || 'bg-gray-100 text-gray-700'}>
        {status}
      </Badge>
    );
  };

  const isLowStock = (item: StockItem) => {
    return item.minimum_quantity && item.quantity <= item.minimum_quantity;
  };

  const getStockStatus = (item: StockItem) => {
    if (isLowStock(item)) return 'Critique';
    if (item.status === 'active') return 'Disponible';
    if (item.status === 'inactive') return 'Alloué';
    return 'Maintenance';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
            <Package className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600">Chargement du stock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Package className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Gestion du Stock</h1>
            <p className="text-purple-100">Gérez vos articles et catégories avec efficacité</p>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Toutes catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle catégorie
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} un article</DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Modifiez' : 'Ajoutez'} les informations de l'article.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  
                  <div className="col-span-2">
                    <Label htmlFor="name">Nom de l'article</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Catégorie</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantité</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="minimum_quantity">Quantité minimale</Label>
                    <Input
                      id="minimum_quantity"
                      type="number"
                      value={formData.minimum_quantity}
                      onChange={(e) => setFormData({ ...formData, minimum_quantity: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit_price">Prix unitaire (€)</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier">Fournisseur</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Emplacement</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="park_number">N° Parc</Label>
                    <Input
                      id="park_number"
                      value={formData.park_number}
                      onChange={(e) => setFormData({ ...formData, park_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="serial_number">N° Série</Label>
                    <Input
                      id="serial_number"
                      value={formData.serial_number}
                      onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Statut</Label>
                    <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'discontinued') => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="inactive">Inactif</SelectItem>
                        <SelectItem value="discontinued">Discontinué</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingItem ? 'Modifier' : 'Ajouter'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories and Items */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, items]) => {
          const totalItems = items.length;
          const criticalItems = items.filter(item => isLowStock(item)).length;
          const availableItems = items.filter(item => item.status === 'active' && !isLowStock(item)).length;
          
          return (
            <Card key={category} className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Package className="h-6 w-6 text-gray-600" />
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">{category}</CardTitle>
                      <CardDescription>
                        {totalItems} articles au total - {availableItems} disponibles (Seuil: {items.find(i => i.minimum_quantity)?.minimum_quantity || 10})
                      </CardDescription>
                    </div>
                    {criticalItems > 0 && (
                      <Badge className="bg-red-100 text-red-700 border-red-200">
                        Critique
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Modifier seuil
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modèle</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Parc</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Série</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.park_number || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.serial_number || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(getStockStatus(item))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              {hasPermission('admin') && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDelete(item.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Stock;
