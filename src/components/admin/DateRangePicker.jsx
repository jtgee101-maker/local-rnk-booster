import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';

export default function DateRangePicker({ value, onChange, presets = true }) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState(value || { from: null, to: null });

  const quickPresets = [
    { label: 'Today', getValue: () => ({ from: new Date(), to: new Date() }) },
    { label: 'Last 7 days', getValue: () => ({ 
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 
      to: new Date() 
    })},
    { label: 'Last 30 days', getValue: () => ({ 
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
      to: new Date() 
    })},
    { label: 'Last 90 days', getValue: () => ({ 
      from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), 
      to: new Date() 
    })},
    { label: 'This month', getValue: () => {
      const now = new Date();
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
    }},
    { label: 'Last month', getValue: () => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: lastMonth, to: lastMonthEnd };
    }}
  ];

  const handlePresetClick = (preset) => {
    const newRange = preset.getValue();
    setRange(newRange);
    onChange(newRange);
    setOpen(false);
  };

  const handleClear = () => {
    setRange({ from: null, to: null });
    onChange({ from: null, to: null });
  };

  const handleSelect = (selected) => {
    setRange(selected);
    if (selected?.from && selected?.to) {
      onChange(selected);
      setOpen(false);
    }
  };

  const formatRange = () => {
    if (!range?.from) return 'Pick a date range';
    if (!range.to) return format(range.from, 'MMM d, yyyy');
    return `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d, yyyy')}`;
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700" align="start">
          <div className="flex">
            {presets && (
              <div className="border-r border-gray-700 p-3 space-y-1">
                <div className="text-xs text-gray-400 mb-2 font-semibold">Quick Select</div>
                {quickPresets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm"
                    onClick={() => handlePresetClick(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            )}
            <Calendar
              mode="range"
              selected={range}
              onSelect={handleSelect}
              numberOfMonths={2}
              className="rounded-md border-0"
            />
          </div>
        </PopoverContent>
      </Popover>
      
      {range?.from && (
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}