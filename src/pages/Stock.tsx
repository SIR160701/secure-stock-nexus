import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Plus, Edit, Trash2, Package, AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [isEditArticleOpen, setIsEditArticleOpen] = useState(false);
  const [isEditThresholdOpen, setIsEditThresholdOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', threshold: '' });
  const [newArticle, setNewArticle] = useState({
    model: '',
    parkNumber: '',
    serialNumber: '',
    categoryId: '',
    status: 'disponible'
  });
  const [editingArticle, setEditingArticle] = useState({
    id: '',
    model: '',
    parkNumber: '',
    serialNumber: '',
    status: 'disponible',
    categoryId: ''
  });
  const [editingCategory, setEditingCategory] = useState({
    id: '',
    name: '',
    criticalThreshold: 0
  });
  const { hasPermission } = useAuth();
  const { toast } = useToast();

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

  const handleCreateCategory = () => {
    if (!newCategory.name || !newCategory.threshold) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    const category = {
      id: Date.now().toString(),
      name: newCategory.name,
      criticalThreshold: parseInt(newCategory.threshold),
      articles: []
    };

    setCategories([...categories, category]);
    setNewCategory({ name: '', threshold: '' });
    setIsAddCategoryOpen(false);
    toast({
      title: "Succès",
      description: "Catégorie créée avec succès"
    });
  };

  const handleAddArticle = () => {
    if (!newArticle.model || !newArticle.parkNumber || !newArticle.serialNumber || !newArticle.categoryId) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    const article = {
      id: Date.now().toString(),
      model: newArticle.model,
      parkNumber: newArticle.parkNumber,
      serialNumber: newArticle.serialNumber,
      status: newArticle.status
    };

    setCategories(categories.map(cat => 
      cat.id === newArticle.categoryId 
        ? { ...cat, articles: [...cat.articles, article] }
        : cat
    ));

    setNewArticle({
      model: '',
      parkNumber: '',
      serialNumber: '',
      categoryId: '',
      status: 'disponible'
    });
    setIsAddArticleOpen(false);
    toast({
      title: "Succès",
      description: "Article ajouté avec succès"
    });
  };

  const handleEditArticle = (categoryId: string, article: any) => {
    setEditingArticle({
      id: article.id,
      model: article.model,
      parkNumber: article.parkNumber,
      serialNumber: article.serialNumber,
      status: article.status,
      categoryId: categoryId
    });
    setIsEditArticleOpen(true);
  };

  const handleUpdateArticle = () => {
    if (!editingArticle.model || !editingArticle.parkNumber || !editingArticle.serialNumber) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    setCategories(categories.map(cat => 
      cat.id === editingArticle.categoryId 
        ? { 
            ...cat, 
            articles: cat.articles.map(article =>
              article.id === editingArticle.id
                ? {
                    ...article,
                    model: editingArticle.model,
                    parkNumber: editingArticle.parkNumber,
                    serialNumber: editingArticle.serialNumber,
                    status: editingArticle.status
                  }
                : article
            )
          }
        : cat
    ));

    setIsEditArticleOpen(false);
    toast({
      title: "Succès",
      description: "Article modifié avec succès"
    });
  };

  const handleEditThreshold = (category: any) => {
    setEditingCategory({
      id: category.id,
      name: category.name,
      criticalThreshold: category.criticalThreshold
    });
    setIsEditThresholdOpen(true);
  };

  const handleUpdateThreshold = () => {
    if (!editingCategory.criticalThreshold || editingCategory.criticalThreshold < 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un seuil valide",
        variant: "destructive"
      });
      return;
    }

    setCategories(categories.map(cat => 
      cat.id === editingCategory.id 
        ? { ...cat, criticalThreshold: editingCategory.criticalThreshold }
        : cat
    ));

    setIsEditThresholdOpen(false);
    toast({
      title: "Succès",
      description: "Seuil critique modifié avec succès"
    });
  };

  const handleDeleteArticle = (categoryId: string, articleId: string) => {
    setCategories(categories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, articles: cat.articles.filter(article => article.id !== articleId) }
        : cat
    ));
    toast({
      title: "Succès",
      description: "Article supprimé avec succès"
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      disponible: { label: 'Disponible', className: 'bg-green-100 text-green-800 border-green-200' },
      alloué: { label: 'Alloué', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      maintenance: { label: 'Maintenance', className: 'bg-red-100 text-red-800 border-red-200' }
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

  const getCriticalIcon = (category: any) => {
    const availableCount = category.articles.filter((a: any) => a.status === 'disponible').length;
    const isCritical = availableCount <= category.criticalThreshold;
    
    if (!isCritical) return null;
    
    // Différentes icônes selon le niveau de criticité
    if (availableCount === 0) {
      return <ShieldAlert className="h-4 w-4 text-red-600" />;
    } else if (availableCount <= Math.ceil(category.criticalThreshold * 0.5)) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getCriticalBadgeVariant = (category: any) => {
    const availableCount = category.articles.filter((a: any) => a.status === 'disponible').length;
    
    if (availableCount === 0) {
      return "destructive"; // Rouge foncé
    } else if (availableCount <= Math.ceil(category.criticalThreshold * 0.5)) {
      return "destructive"; // Rouge
    } else {
      return "secondary"; // Orange/Jaune
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center space-x-3">
          <Package className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Gestion du Stock</h1>
            <p className="text-blue-100 mt-2">Gérez vos articles et catégories avec efficacité</p>
          </div>
        </div>
      </div>

      {/* Barre de recherche et actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher un article..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-2 border-gray-200 focus:border-blue-500 rounded-lg"
          />
        </div>
        
        {canModify && (
          <div className="flex gap-2">
            <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-2 border-gray-300 hover:border-blue-500">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle catégorie
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Ajouter une catégorie</DialogTitle>
                  <DialogDescription>Créez une nouvelle catégorie d'articles</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="categoryName">Nom de la catégorie</Label>
                    <Input 
                      id="categoryName" 
                      placeholder="Ex: Ordinateurs portables"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="threshold">Seuil critique</Label>
                    <Input 
                      id="threshold" 
                      type="number" 
                      placeholder="10"
                      value={newCategory.threshold}
                      onChange={(e) => setNewCategory({...newCategory, threshold: e.target.value})}
                    />
                  </div>
                  <Button onClick={handleCreateCategory} className="w-full">
                    Créer la catégorie
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddArticleOpen} onOpenChange={setIsAddArticleOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel article
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Ajouter un article</DialogTitle>
                  <DialogDescription>Ajoutez un nouvel article au stock</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="model">Modèle</Label>
                    <Input 
                      id="model" 
                      placeholder="Ex: Dell Latitude 5520"
                      value={newArticle.model}
                      onChange={(e) => setNewArticle({...newArticle, model: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="parkNumber">Numéro de parc</Label>
                    <Input 
                      id="parkNumber" 
                      placeholder="Ex: PC001"
                      value={newArticle.parkNumber}
                      onChange={(e) => setNewArticle({...newArticle, parkNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="serialNumber">Numéro de série</Label>
                    <Input 
                      id="serialNumber" 
                      placeholder="Ex: DL5520001"
                      value={newArticle.serialNumber}
                      onChange={(e) => setNewArticle({...newArticle, serialNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Catégorie</Label>
                    <Select onValueChange={(value) => setNewArticle({...newArticle, categoryId: value})}>
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
                    <Select onValueChange={(value) => setNewArticle({...newArticle, status: value})}>
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
                  <Button onClick={handleAddArticle} className="w-full">
                    Ajouter l'article
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Edit Article Dialog */}
      <Dialog open={isEditArticleOpen} onOpenChange={setIsEditArticleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'article</DialogTitle>
            <DialogDescription>Modifiez les informations de l'article</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editModel">Modèle</Label>
              <Input 
                id="editModel" 
                value={editingArticle.model}
                onChange={(e) => setEditingArticle({...editingArticle, model: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="editParkNumber">Numéro de parc</Label>
              <Input 
                id="editParkNumber" 
                value={editingArticle.parkNumber}
                onChange={(e) => setEditingArticle({...editingArticle, parkNumber: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="editSerialNumber">Numéro de série</Label>
              <Input 
                id="editSerialNumber" 
                value={editingArticle.serialNumber}
                onChange={(e) => setEditingArticle({...editingArticle, serialNumber: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="editStatus">Statut</Label>
              <Select value={editingArticle.status} onValueChange={(value) => setEditingArticle({...editingArticle, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="alloué">Alloué</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdateArticle} className="w-full">
              Modifier l'article
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Threshold Dialog */}
      <Dialog open={isEditThresholdOpen} onOpenChange={setIsEditThresholdOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le seuil critique</DialogTitle>
            <DialogDescription>Modifiez le seuil critique pour {editingCategory.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editThreshold">Seuil critique</Label>
              <Input 
                id="editThreshold" 
                type="number"
                value={editingCategory.criticalThreshold}
                onChange={(e) => setEditingCategory({...editingCategory, criticalThreshold: parseInt(e.target.value) || 0})}
              />
            </div>
            <Button onClick={handleUpdateThreshold} className="w-full">
              Modifier le seuil
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Liste des catégories */}
      <div className="space-y-6">
        {filteredCategories.map(category => {
          const isCritical = getCriticalStatus(category);
          const availableCount = category.articles.filter(a => a.status === 'disponible').length;
          const criticalIcon = getCriticalIcon(category);
          const badgeVariant = getCriticalBadgeVariant(category);
          
          return (
            <Card key={category.id} className={`shadow-lg ${isCritical ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      {category.name}
                      {isCritical && (
                        <Badge variant={badgeVariant} className="flex items-center gap-1">
                          {criticalIcon}
                          Critique
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {category.articles.length} articles au total - {availableCount} disponibles
                      {isCritical && ` (Seuil: ${category.criticalThreshold})`}
                    </CardDescription>
                  </div>
                  {canModify && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      onClick={() => handleEditThreshold(category)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier seuil
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-4 font-semibold text-gray-700">Modèle</th>
                        <th className="text-left p-4 font-semibold text-gray-700">N° Parc</th>
                        <th className="text-left p-4 font-semibold text-gray-700">N° Série</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Statut</th>
                        {canModify && <th className="text-left p-4 font-semibold text-gray-700">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {category.articles.map(article => (
                        <tr key={article.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-medium">{article.model}</td>
                          <td className="p-4 text-gray-600">{article.parkNumber}</td>
                          <td className="p-4 text-gray-600">{article.serialNumber}</td>
                          <td className="p-4">{getStatusBadge(article.status)}</td>
                          {canModify && (
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-blue-600 hover:bg-blue-50"
                                  onClick={() => handleEditArticle(category.id, article)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => handleDeleteArticle(category.id, article.id)}
                                >
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
