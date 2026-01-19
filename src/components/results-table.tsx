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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { OutputRow } from '@/lib/voti-utils';

interface ResultsTableProps {
  data: OutputRow[];
}

const ITEMS_PER_PAGE = 50;

export function ResultsTable({ data }: ResultsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = data.filter(row => {
    const search = searchTerm.toLowerCase();
    return (
      row.CF.toLowerCase().includes(search) ||
      row.Materia.toLowerCase().includes(search) ||
      row.Classe_Sigla.toLowerCase().includes(search) ||
      row.EsitoIniziale.toLowerCase().includes(search) ||
      row.EsitoFinale.toLowerCase().includes(search)
    );
  });

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca per CF, materia, classe, esito..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground ml-auto">
          {filteredData.length} righe trovate
        </span>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-[500px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="min-w-[150px]">CF</TableHead>
                <TableHead>Hash</TableHead>
                <TableHead className="min-w-[200px]">Materia</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Anno</TableHead>
                <TableHead>Sez.</TableHead>
                <TableHead>Esito Iniz.</TableHead>
                <TableHead>Num. Iniz.</TableHead>
                <TableHead>Esito Fin.</TableHead>
                <TableHead>Num. Fin.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, index) => (
                <TableRow key={`${row.CF}-${row.Materia}-${index}`}>
                  <TableCell className="font-mono text-xs">{row.CF}</TableCell>
                  <TableCell className="font-mono text-xs">{row.Hash}</TableCell>
                  <TableCell>{row.Materia}</TableCell>
                  <TableCell>{row.Classe_Sigla}</TableCell>
                  <TableCell>{row.Anno}</TableCell>
                  <TableCell>{row.Sezione}</TableCell>
                  <TableCell>{row.EsitoIniziale}</TableCell>
                  <TableCell>{row.EsitoInizialeNumerico}</TableCell>
                  <TableCell>{row.EsitoFinale}</TableCell>
                  <TableCell>{row.EsitoFinaleNumerico}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Precedente
          </Button>
          <span className="text-sm text-muted-foreground">
            Pagina {currentPage} di {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Successiva
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}