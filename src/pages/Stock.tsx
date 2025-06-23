
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Package, Plus, Edit, Trash2, AlertTriangle, Hash } from 'lucide-react';
import { useStock, StockItem } from '@/hooks/useStock';
import { useAuth } from '@/contexts/AuthContext';

const Stock = () => {
  const { stockItems, isLoading, createStockItem, updateStockItem, deleteStockItem } = useStock();
  const { hasPermission } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
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
    status: 'active' as const,
  });

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
      status: item.status,
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
      active: { label: 'Actif', className: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactif', className: 'bg-yellow-100 text-yellow-800' },
      discontinued: { label: 'Discontinué', className: 'bg-red-100 text-red-800' }
    };
    
    return (
      <Badge className={statusConfig[status as keyof typeof statusConfig].className}>
        {statusConfig[status as keyof typeof statusConfig].label}
      </Badge>
    );
  };

  const isLowStock = (item: StockItem) => {
    return item.minimum_quantity && item.quantity <= item.minimum_quantity;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock</h1>
          <p className="text-gray-600 mt-2">Gestion des articles en stock</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un article
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
                  <Label htmlFor="park_number">Numéro de parc</Label>
                  <Input
                    id="park_number"
                    value={formData.park_number}
                    onChange={(e) => setFormData({ ...formData, park_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="serial_number">Numéro de série</Label>
                  <Input
                    id="serial_number"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
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

      <div className="grid gap-4">
        {stockItems.map((item) => (
          <Card key={item.id} className={`shadow-lg ${isLowStock(item) ? 'border-orange-200 bg-orange-50' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {item.name}
                    {item.park_number && (
                      <Badge variant="outline" className="text-xs">
                        {item.park_number}
                      </Badge>
                    )}
                    {isLowStock(item) && (
                      <Badge className="bg-orange-100 text-orange-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Stock bas
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{item.category} - SKU: {item.sku}</CardDescription>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  )}
                </div>
                {getStatusBadge(item.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium">Quantité</p>
                  <p className="text-lg font-bold">{item.quantity}</p>
                  {item.minimum_quantity && (
                    <p className="text-xs text-muted-foreground">Min: {item.minimum_quantity}</p>
                  )}
                </div>
                {item.unit_price && (
                  <div>
                    <p className="text-sm font-medium">Prix unitaire</p>
                    <p className="text-sm text-muted-foreground">{item.unit_price}€</p>
                  </div>
                )}
                {item.location && (
                  <div>
                    <p className="text-sm font-medium">Emplacement</p>
                    <p className="text-sm text-muted-foreground">{item.location}</p>
                  </div>
                )}
                {item.serial_number && (
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      N° Série
                    </p>
                    <p className="text-sm text-muted-foreground">{item.serial_number}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                {hasPermission('admin') && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Stock;
