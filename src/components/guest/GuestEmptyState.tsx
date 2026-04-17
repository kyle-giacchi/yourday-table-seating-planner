import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Upload, Users, UtensilsCrossed } from 'lucide-react';
import { useMealOptions } from '@/contexts/MealOptionsContext';
import { useToast } from '@/hooks/use-toast';

interface GuestEmptyStateProps {
  onAddGuest: () => void;
  onUploadFile: () => void;
}

const QUICK_ADD_MEALS = ['Chicken', 'Beef', 'Fish', 'Vegetarian', 'Vegan'];

export const GuestEmptyState = ({ onAddGuest, onUploadFile }: GuestEmptyStateProps) => {
  const { mealOptions, addMealOptions } = useMealOptions();
  const { toast } = useToast();
  const addButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    addButtonRef.current?.focus();
  }, []);

  const showMealBanner = mealOptions.length === 0;

  const handleQuickAddMeals = () => {
    addMealOptions(QUICK_ADD_MEALS);
    toast({
      title: 'Meal options added',
      description: `${QUICK_ADD_MEALS.join(', ')} are ready to assign.`,
    });
  };

  return (
    <Card className="animate-fade-in-up mx-auto max-w-2xl">
      <CardContent className="px-6 py-10 sm:px-10 sm:py-12">
        {showMealBanner && (
          <div
            role="status"
            className="border-warning/30 bg-warning/10 text-warning mb-6 flex flex-col gap-3 rounded-md border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-2">
              <UtensilsCrossed className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="text-sm">
                <p className="font-medium">No meal options configured</p>
                <p className="text-xs opacity-90">
                  Guests will default to &ldquo;No Meal Selected&rdquo; until you add some.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleQuickAddMeals}
              className="border-warning/40 text-warning hover:bg-warning/10 hover:text-warning hover:border-warning/40 sm:shrink-0"
            >
              Quick add 5 defaults
            </Button>
          </div>
        )}

        <div className="flex flex-col items-center text-center">
          <div className="bg-primary/10 text-primary mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Users className="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 className="text-foreground text-2xl font-semibold">Let&apos;s add your guests</h2>
          <p className="text-muted-foreground mt-2 max-w-md text-sm">
            Enter guests one at a time, or upload a CSV or Excel list to get started fast.
          </p>

          <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
            <Button
              ref={addButtonRef}
              onClick={onAddGuest}
              size="lg"
              className="flex items-center justify-center gap-2 sm:min-w-44"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Add First Guest
            </Button>
            <Button
              onClick={onUploadFile}
              size="lg"
              variant="outline"
              className="flex items-center justify-center gap-2 sm:min-w-44"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload Guest List
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
