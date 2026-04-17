import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Guest, AllergyFlag, RsvpStatus } from '@/types/seating';
import { useSeating } from '@/hooks/useSeating';
import { useSeatingData } from '@/contexts/SeatingDataContext';
import { useToast } from '@/hooks/use-toast';
import {
  validateGuestName,
  validatePartyName,
  sanitizeInput,
  getGenericErrorMessage,
} from '@/lib/security';

const ALLERGY_FLAGS: Array<{ value: AllergyFlag; label: string }> = [
  { value: 'nut', label: 'Nut' },
  { value: 'gluten', label: 'Gluten' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'shellfish', label: 'Shellfish' },
  { value: 'egg', label: 'Egg' },
  { value: 'soy', label: 'Soy' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'kosher', label: 'Kosher' },
  { value: 'halal', label: 'Halal' },
];

interface FormState {
  firstName: string;
  lastName: string;
  mealSelection: string;
  party: string;
  dietaryNotes: string;
  allergyFlags: AllergyFlag[];
  rsvpStatus: RsvpStatus;
}

const INITIAL_FORM: FormState = {
  firstName: '',
  lastName: '',
  mealSelection: 'No Meal Selected',
  party: '',
  dietaryNotes: '',
  allergyFlags: [],
  rsvpStatus: 'pending',
};

interface GuestFormModalProps {
  open: boolean;
  onClose: () => void;
  editingGuest?: Guest | null;
}

export const GuestFormModal = ({ open, onClose, editingGuest }: GuestFormModalProps) => {
  const { addGuest, updateGuest } = useSeating();
  const { seatingData } = useSeatingData();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Get all guests from tables and unassigned
  const allGuests = useMemo(() => {
    const tableGuests = seatingData.tables.flatMap((table) => table.guests);
    return [...seatingData.unassignedGuests, ...tableGuests];
  }, [seatingData]);

  // Create dynamic meal options from existing guests plus default
  const mealOptions = useMemo(() => {
    const existingMeals = new Set(allGuests.map((guest) => guest.mealSelection).filter(Boolean));
    const allMeals = ['No Meal Selected', ...Array.from(existingMeals)];
    return [...new Set(allMeals)].map((meal) => ({ value: meal, label: meal }));
  }, [allGuests]);

  useEffect(() => {
    if (editingGuest) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs form state from editingGuest prop when user opens edit modal; idiomatic alternative requires caller-side key remount
      setForm({
        firstName: editingGuest.firstName || editingGuest.fullName.split(' ')[0] || '',
        lastName:
          editingGuest.lastName || editingGuest.fullName.split(' ').slice(1).join(' ') || '',
        mealSelection: editingGuest.mealSelection,
        party: editingGuest.party,
        dietaryNotes: editingGuest.dietaryNotes ?? '',
        allergyFlags: editingGuest.allergyFlags ?? [],
        rsvpStatus: editingGuest.rsvpStatus ?? 'pending',
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setErrors({});
  }, [editingGuest, open]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate first name
    if (!form.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else {
      const nameValidation = validateGuestName(form.firstName.trim());
      if (!nameValidation.valid) {
        newErrors.firstName = nameValidation.message || 'Invalid first name';
      }
    }

    // Validate last name
    if (!form.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else {
      const nameValidation = validateGuestName(form.lastName.trim());
      if (!nameValidation.valid) {
        newErrors.lastName = nameValidation.message || 'Invalid last name';
      }
    }

    // Validate party name
    const partyValidation = validatePartyName(form.party);
    if (!partyValidation.valid) {
      newErrors.party = partyValidation.message || 'Invalid party name';
    }

    // Validate meal selection
    if (form.mealSelection && !mealOptions.some((option) => option.value === form.mealSelection)) {
      newErrors.mealSelection = 'Please select a valid meal option';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const sanitizedData = {
        fullName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
        mealSelection: form.mealSelection || 'No Meal Selected',
        party: sanitizeInput(form.party.trim()),
        dietaryNotes: form.dietaryNotes.trim() || undefined,
        allergyFlags: form.allergyFlags.length > 0 ? form.allergyFlags : undefined,
        rsvpStatus: form.rsvpStatus,
      };

      if (editingGuest) {
        updateGuest(editingGuest.id, sanitizedData);
        toast({
          title: 'Success',
          description: 'Guest updated successfully',
        });
      } else {
        addGuest(sanitizedData);
        toast({
          title: 'Success',
          description: 'Guest added successfully',
        });
      }

      onClose();
    } catch (error) {
      console.error('Guest form submission error:', error);
      toast({
        title: 'Error',
        description: getGenericErrorMessage('guest'),
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingGuest ? 'Edit Guest' : 'Add New Guest'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                placeholder="First name"
                maxLength={50}
                required
              />
              {errors.firstName && (
                <p className="text-destructive mt-1 text-sm">{errors.firstName}</p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                placeholder="Last name"
                maxLength={50}
                required
              />
              {errors.lastName && (
                <p className="text-destructive mt-1 text-sm">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="mealSelection">Meal Selection</Label>
            <Select
              value={form.mealSelection}
              onValueChange={(val) => setForm((prev) => ({ ...prev, mealSelection: val }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select meal option" />
              </SelectTrigger>
              <SelectContent>
                {mealOptions.map((meal) => (
                  <SelectItem key={meal.value} value={meal.value}>
                    {meal.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.mealSelection && (
              <p className="text-destructive mt-1 text-sm">{errors.mealSelection}</p>
            )}
          </div>

          <div>
            <Label htmlFor="party">Party</Label>
            <Input
              id="party"
              value={form.party}
              onChange={(e) => setForm((prev) => ({ ...prev, party: e.target.value }))}
              placeholder="Enter party name"
              maxLength={50}
              required
            />
            {errors.party && <p className="text-destructive mt-1 text-sm">{errors.party}</p>}
          </div>

          <div className="space-y-2">
            <Label>Allergies &amp; dietary flags</Label>
            <div className="grid grid-cols-3 gap-2">
              {ALLERGY_FLAGS.map((flag) => {
                const checked = form.allergyFlags.includes(flag.value);
                return (
                  <label
                    key={flag.value}
                    className="text-foreground flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      aria-label={flag.label}
                      checked={checked}
                      onChange={() =>
                        setForm((prev) => ({
                          ...prev,
                          allergyFlags: checked
                            ? prev.allergyFlags.filter((f) => f !== flag.value)
                            : [...prev.allergyFlags, flag.value],
                        }))
                      }
                    />
                    {flag.label}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="dietaryNotes">Dietary notes</Label>
            <textarea
              id="dietaryNotes"
              value={form.dietaryNotes}
              onChange={(e) => setForm((prev) => ({ ...prev, dietaryNotes: e.target.value }))}
              rows={2}
              maxLength={500}
              placeholder="Free-text allergies or preferences"
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <Label htmlFor="rsvpStatus">RSVP</Label>
            <select
              id="rsvpStatus"
              value={form.rsvpStatus}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, rsvpStatus: e.target.value as RsvpStatus }))
              }
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="pending">Pending</option>
              <option value="attending">Attending</option>
              <option value="declined">Declined</option>
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {editingGuest ? 'Update Guest' : 'Add Guest'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
