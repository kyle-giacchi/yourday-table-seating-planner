import React, { useState } from 'react';
import { useMealOptions } from '@/contexts/MealOptionsContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Check, X, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MealOptionsEditorProps {
  open: boolean;
  onClose: () => void;
}

export const MealOptionsEditor = ({ open, onClose }: MealOptionsEditorProps) => {
  const { mealOptions, addMealOption, removeMealOption, updateMealOption, resetToDefaults } =
    useMealOptions();
  const [newMeal, setNewMeal] = useState('');
  const [newMealError, setNewMealError] = useState('');
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editError, setEditError] = useState('');

  const validateNewMeal = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return 'Meal name cannot be empty';
    if (mealOptions.some((o) => o.value.toLowerCase() === trimmed.toLowerCase())) {
      return 'This meal option already exists';
    }
    return '';
  };

  const validateEdit = (value: string, oldValue: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return 'Meal name cannot be empty';
    if (
      trimmed.toLowerCase() !== oldValue.toLowerCase() &&
      mealOptions.some((o) => o.value.toLowerCase() === trimmed.toLowerCase())
    ) {
      return 'This meal option already exists';
    }
    return '';
  };

  const handleAdd = () => {
    const error = validateNewMeal(newMeal);
    if (error) {
      setNewMealError(error);
      return;
    }
    addMealOption(newMeal.trim());
    setNewMeal('');
    setNewMealError('');
    toast({ title: 'Meal option added', description: `"${newMeal.trim()}" added to the list` });
  };

  const handleRemove = (value: string) => {
    removeMealOption(value);
    toast({ title: 'Meal option removed', description: `"${value}" removed from the list` });
  };

  const handleStartEdit = (value: string) => {
    setEditingValue(value);
    setEditText(value);
    setEditError('');
  };

  const handleSaveEdit = () => {
    if (!editingValue) return;
    const error = validateEdit(editText, editingValue);
    if (error) {
      setEditError(error);
      return;
    }
    updateMealOption(editingValue, editText.trim());
    setEditingValue(null);
    setEditText('');
    setEditError('');
  };

  const handleCancelEdit = () => {
    setEditingValue(null);
    setEditText('');
    setEditError('');
  };

  const handleReset = () => {
    resetToDefaults();
    setEditingValue(null);
    toast({ title: 'Reset complete', description: 'Meal options restored to defaults' });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Meal Options</DialogTitle>
          <DialogDescription>
            Add, edit, or remove the selectable meal choices for your guests.
          </DialogDescription>
        </DialogHeader>

        {/* Add new meal */}
        <div className="space-y-1">
          <div className="flex gap-2">
            <Input
              value={newMeal}
              onChange={(e) => {
                setNewMeal(e.target.value);
                setNewMealError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
              placeholder="New meal option..."
              className="h-8 text-sm"
            />
            <Button size="sm" onClick={handleAdd} className="h-8 shrink-0 px-3">
              <Plus className="mr-1 h-3 w-3" />
              Add
            </Button>
          </div>
          {newMealError && <p className="text-destructive text-xs">{newMealError}</p>}
        </div>

        {/* Current options list */}
        <ScrollArea className="max-h-64">
          <div className="space-y-1 pr-2">
            {mealOptions.map((option) => (
              <div key={option.value} className="group">
                {editingValue === option.value ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Input
                        ref={(el) => {
                          el?.focus();
                        }}
                        value={editText}
                        onChange={(e) => {
                          setEditText(e.target.value);
                          setEditError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="h-7 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSaveEdit}
                        className="h-7 w-7 shrink-0 p-0"
                      >
                        <Check className="text-primary h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        className="h-7 w-7 shrink-0 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    {editError && <p className="text-destructive pl-1 text-xs">{editError}</p>}
                  </div>
                ) : (
                  <div className="hover:bg-muted flex items-center justify-between rounded px-2 py-1.5 transition-colors">
                    <button
                      onClick={() => handleStartEdit(option.value)}
                      className="hover:text-primary flex-1 truncate text-left text-sm transition-colors"
                    >
                      {option.label}
                    </button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemove(option.value)}
                      className="text-muted-foreground hover:text-destructive h-6 w-6 shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={`Remove ${option.label}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between border-t pt-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset to Defaults
          </Button>
          <span className="text-muted-foreground text-xs">{mealOptions.length} options</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
