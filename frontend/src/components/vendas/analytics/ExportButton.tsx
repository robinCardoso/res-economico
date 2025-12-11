'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ExportButtonProps {
  onExportCSV: () => void;
  onExportExcel: () => void;
  disabled?: boolean;
}

export function ExportButton({ onExportCSV, onExportExcel, disabled }: ExportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              onExportExcel();
              setOpen(false);
            }}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Excel (.xlsx)
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              onExportCSV();
              setOpen(false);
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Exportar CSV (.csv)
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
