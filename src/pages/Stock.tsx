
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';

// Données de démonstration
const initialCategories = [
  {
    id: '1',
    name: 'Ordinateurs',
    criticalThreshold: 10,
    articles: [
      { id: '1', model: 'Dell Latitude 5520', parkNumber: 'PC001', serialNumber: 'DL5520001', status: 'disponible' },
      { id: '2', model: 'HP EliteBook 840', parkNumber: 'PC002', serialNumber: 'HP840002', status: 'alloué' },
      { id: '3', model: 'Lenovo ThinkPad T14', parkNumber: 'PC003', serialNumber: 'LT14003', status: 'maintenance' },
    ]
  },
  {
    id: '2',
    name: 'Smartphones',
    criticalThreshold: 5,
    articles: [
      { id: '4', model: 'iPhone 13', parkNumber: 'SP001', serialNumber: 'IP13001', status: 'disponible' },
      { id: '5', model: 'Samsung Galaxy S21', parkNumber: 'SP002', serialNumber: 'SG21002', status: 'alloué' },
    ]
  }
];

const Stock = () => {
  const [categories, setCategories] = useState(initialCategories);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddArticleOpen, setIsAddArticleOpen] = useState(false);
  const { hasPermission } = useAuth();

  const canModify = hasPermission('admin');

  const filteredCategories = categories.map(category => ({
    ...category,
    articles: category.articles.filter(article =>
      article.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.parkNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.status.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.articles.length > 0 || searchTerm === '');

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      disponible: { variant: 'default', label: 'Disponible', className: 'bg-green-100 text-green-800' },
      alloué: { variant: 'secondary', label: 'Alloué', className: 'bg-blue-100 text-blue-800' },
      maintenance: { variant: 'destructive', label: 'Maintenance', className: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.disponible;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getCriticalStatus = (category: any) => {
    const availableCount = category.articles.filter((a: any) => a.status === 'disponible').length;
    return availableCount <= category.criticalThreshold;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion du Stock</h1>
        <p className="text-gray-600 mt-2">Gérez vos articles et catégories</p>
      </div>

      {/* Barre de recherche et actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher un article..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {canModify && (
          <div className="flex gap-2">
            <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle catégorie
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter une catégorie</DialogTitle>
                  <DialogDescription>Créez une nouvelle catégorie d'articles</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="categoryName">Nom de la catégorie</Label>
                    <Input id="categoryName" placeholder="Ex: Ordinateurs portables" />
                  </div>
                  <div>
                    <Label htmlFor="threshold">Seuil critique</Label>
                    <Input id="threshold" type="number" placeholder="10" />
                  </div>
                  <Button className="w-full">Créer la catégorie</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddArticleOpen} onOpenChange={setIsAddArticleOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel article
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un article</DialogTitle>
                  <DialogDescription>Ajoutez un nouvel article au stock</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="model">Modèle</Label>
                    <Input id="model" placeholder="Ex: Dell Latitude 5520" />
                  </div>
                  <div>
                    <Label htmlFor="parkNumber">Numéro de parc</Label>
                    <Input id="parkNumber" placeholder="Ex: PC001" />
                  </div>
                  <div>
                    <Label htmlFor="serialNumber">Numéro de série</Label>
                    <Input id="serialNumber" placeholder="Ex: DL5520001" />
                  </div>
                  <div>
                    <Label htmlFor="category">Catégorie</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Statut</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disponible">Disponible</SelectItem>
                        <SelectItem value="alloué">Alloué</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">Ajouter l'article</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Liste des catégories */}
      <div className="space-y-6">
        {filteredCategories.map(category => {
          const isCritical = getCriticalStatus(category);
          const availableCount = category.articles.filter(a => a.status === 'disponible').length;
          
          return (
            <Card key={category.id} className={isCritical ? 'border-red-200 bg-red-50' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {category.name}
                      {isCritical && <Badge variant="destructive">Critique</Badge>}
                    </CardTitle>
                    <CardDescription>
                      {category.articles.length} articles au total - {availableCount} disponibles
                      {isCritical && ` (Seuil: ${category.criticalThreshold})`}
                    </CardDescription>
                  </div>
                  {canModify && (
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier seuil
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Modèle</th>
                        <th className="text-left p-2">N° Parc</th>
                        <th className="text-left p-2">N° Série</th>
                        <th className="text-left p-2">Statut</th>
                        {canModify && <th className="text-left p-2">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {category.articles.map(article => (
                        <tr key={article.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{article.model}</td>
                          <td className="p-2">{article.parkNumber}</td>
                          <td className="p-2">{article.serialNumber}</td>
                          <td className="p-2">{getStatusBadge(article.status)}</td>
                          {canModify && (
                            <td className="p-2">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          )}
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
