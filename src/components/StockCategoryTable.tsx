
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Settings } from 'lucide-react';
import { StockItem } from '@/hooks/useStock';
import { StockCategory } from '@/hooks/useStockCategories';

interface StockCategoryTableProps {
  category: StockCategory;
  items: StockItem[];
  onEditItem: (item: StockItem) => void;
  onDeleteItem: (id: string) => void;
  onEditThreshold: (category: StockCategory) => void;
  onDeleteCategory: (category: StockCategory) => void;
  availableCount: number;
  thresholdStatus: 'critical' | 'warning' | 'normal';
}

export const StockCategoryTable: React.FC<StockCategoryTableProps> = ({
  category,
  items,
  onEditItem,
  onDeleteItem,
  onEditThreshold,
  onDeleteCategory,
  availableCount,
  thresholdStatus
}) => {
  const getStatusBadge = (status: string) => {
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

  const getThresholdBadge = () => {
    if (thresholdStatus === 'critical') {
      return <Badge variant="destructive">Critique</Badge>;
    } else if (thresholdStatus === 'warning') {
      return <Badge className="bg-orange-100 text-orange-800">Attention</Badge>;
    }
    return null;
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl">{category.name}</CardTitle>
            <Badge variant="outline" className="text-sm">
              {items.length} article{items.length > 1 ? 's' : ''}
            </Badge>
            {getThresholdBadge()}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Seuil critique: {category.critical_threshold}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditThreshold(category)}
            >
              <Settings className="h-4 w-4 mr-1" />
              Modifier seuil
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDeleteCategory(category)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun article dans cette catégorie
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modèle</TableHead>
                  <TableHead>N° de parc</TableHead>
                  <TableHead>N° de série</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.name}
                    </TableCell>
                    <TableCell>{item.park_number || '-'}</TableCell>
                    <TableCell>{item.serial_number || '-'}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditItem(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
