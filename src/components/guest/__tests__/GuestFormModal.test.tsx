import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GuestFormModal } from '@/components/guest/GuestFormModal';
import { TestProviders, createMockGuest } from '@/test/helpers';

describe('GuestFormModal', () => {
  it('renders allergy checkboxes, dietary notes, and RSVP status for an editing guest', () => {
    render(
      <TestProviders>
        <GuestFormModal
          open
          onClose={() => {}}
          editingGuest={createMockGuest({
            allergyFlags: ['nut'],
            dietaryNotes: 'No shellfish',
            rsvpStatus: 'attending',
          })}
        />
      </TestProviders>,
    );
    expect(screen.getByLabelText(/^nut$/i)).toBeChecked();
    expect(screen.getByLabelText(/dietary notes/i)).toHaveValue('No shellfish');
    expect(screen.getByLabelText(/rsvp/i)).toHaveValue('attending');
  });
});
