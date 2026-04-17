import React, { useState } from 'react';
import { useSeating } from '@/hooks/useSeating';
import { GuestFormModal } from '@/components/guest/GuestFormModal';
import { FileUploadModal } from '@/components/guest/FileUploadModal';
import { GuestGrid } from '@/components/guest/GuestGrid';
import { GuestStatsCard } from '@/components/guest/GuestStatsCard';
import { GuestEmptyState } from '@/components/guest/GuestEmptyState';
import { useToast } from '@/hooks/use-toast';
import type { Guest } from '@/types/seating';
import { exportGuestsToCSV } from '@/lib/guestExportUtils';

const GuestManagement = () => {
  const { seatingData } = useSeating();
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  const allGuests = [
    ...seatingData.unassignedGuests,
    ...seatingData.tables.flatMap((table) => table.guests),
  ];

  const handleEditGuest = (guest: Guest) => {
    setEditingGuest(guest);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingGuest(null);
  };

  const handleDownloadGuestList = () => {
    try {
      exportGuestsToCSV(seatingData.unassignedGuests, seatingData.tables);
      toast({
        title: 'Download Complete',
        description: 'Guest list has been exported to CSV file',
      });
    } catch {
      toast({
        title: 'Export Failed',
        description: 'Failed to export guest list',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Guest Management</h1>
      </div>

      {allGuests.length === 0 ? (
        <GuestEmptyState
          onAddGuest={() => setShowAddModal(true)}
          onUploadFile={() => setShowUploadModal(true)}
        />
      ) : (
        <>
          {/* Statistics */}
          <GuestStatsCard guests={seatingData.unassignedGuests} tables={seatingData.tables} />

          {/* Guest Grid */}
          <GuestGrid
            guests={allGuests}
            onEditGuest={handleEditGuest}
            onAddGuest={() => setShowAddModal(true)}
            onUploadFile={() => setShowUploadModal(true)}
            onDownloadList={handleDownloadGuestList}
          />
        </>
      )}

      {/* Modals */}
      <GuestFormModal open={showAddModal} onClose={handleCloseModal} editingGuest={editingGuest} />

      <FileUploadModal open={showUploadModal} onClose={() => setShowUploadModal(false)} />
    </div>
  );
};

export default GuestManagement;
