
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface StockSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const StockSearch: React.FC<StockSearchProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Rechercher par modèle, numéro de parc, numéro de série ou statut..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};
