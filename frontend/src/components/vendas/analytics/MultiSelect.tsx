'use client';

import * as React from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MultiSelectProps {
  options: string[];
  value?: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  getDisplayValue?: (value: string) => string;
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Buscar...',
  className,
  getDisplayValue,
}: MultiSelectProps) {
  const getDisplay = React.useCallback((val: string) => getDisplayValue ? getDisplayValue(val) : val, [getDisplayValue]);
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    return options.filter((option) => {
      const displayValue = getDisplay(option);
      return displayValue.toLowerCase().includes(search.toLowerCase());
    });
  }, [options, search, getDisplay]);

  const handleToggle = (option: string) => {
    const newValue = value.includes(option)
      ? value.filter((v) => v !== option)
      : [...value, option];
    onChange(newValue);
  };

  const handleSelectAll = () => {
    if (value.length === filteredOptions.length) {
      onChange([]);
    } else {
      onChange([...filteredOptions]);
    }
  };

  const handleRemove = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== option));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {value.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : value.length === 1 ? (
              <span className="truncate">{value[0]}</span>
            ) : (
              <span className="text-sm">
                {value.length} selecionado(s)
              </span>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="p-2">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="border-t">
          <div className="p-2 border-b">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-primary hover:underline"
            >
              {value.length === filteredOptions.length
                ? 'Desmarcar todos'
                : 'Selecionar todos'}
            </button>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="p-2 space-y-1">
              {filteredOptions.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma opção encontrada
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option}
                    className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                    onClick={() => handleToggle(option)}
                  >
                    <Checkbox
                      checked={value.includes(option)}
                      onCheckedChange={() => handleToggle(option)}
                    />
                    <span className="text-sm flex-1">{option}</span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
        {value.length > 0 && (
          <div className="p-2 border-t">
            <div className="flex flex-wrap gap-1">
              {value.map((option) => (
                <div
                  key={option}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-md"
                >
                  <span>{getDisplay(option)}</span>
                  <button
                    type="button"
                    onClick={(e) => handleRemove(option, e)}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
