"use client";

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Search, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MateriaStats } from '@/lib/primo-periodo-stats';

interface PrimoPeriodoMaterieTableProps {
  materie: MateriaStats[];
}

type SortField = 'materia' | 'percentualeInsuff' | 'media' | 'totaleVoti';
type SortDirection = 'asc' | 'desc';

export function PrimoPeriodoMaterieTable({ materie }: PrimoPeriodoMaterieTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('percentualeInsuff');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredMaterie = materie
    .filter(m => m.materia.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      if (sortField === 'materia') {
        return multiplier * a.materia.localeCompare(b.materia);
      }
      return multiplier * (a[sortField] - b[sortField]);
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dettaglio Insufficienze per Materia</CardTitle>
        <CardDescription>
          Tutte le materie ordinate per percentuale di insufficienze
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca materia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <span className="text-sm text-muted-foreground ml-auto">
            {filteredMaterie.length} materie
          </span>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[500px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="min-w-[250px]">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('materia')}
                      className="h-auto p-0 font-medium"
                    >
                      Materia
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[200px]">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('percentualeInsuff')}
                      className="h-auto p-0 font-medium"
                    >
                      % Insufficienze
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('media')}
                      className="h-auto p-0 font-medium"
                    >
                      Media
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('totaleVoti')}
                      className="h-auto p-0 font-medium"
                    >
                      Voti
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Insuff.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterie.map((materia, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{materia.materia}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={materia.percentualeInsuff} 
                          className="h-2 w-24"
                        />
                        <span className="text-sm font-medium w-12">
                          {materia.percentualeInsuff.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={materia.media < 6 ? 'text-red-600 font-medium' : ''}>
                        {materia.media.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>{materia.totaleVoti}</TableCell>
                    <TableCell className="text-red-600 font-medium">
                      {materia.insufficienze}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}