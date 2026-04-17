import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Guest } from '@/types/seating';
import { GuestGridRow } from './GuestGridRow';
import { Search, ArrowUpDown, Download, Upload, Plus } from 'lucide-react';

interface GuestGridProps {
  guests: Guest[];
  onEditGuest: (guest: Guest) => void;
  onAddGuest: () => void;
  onUploadFile: () => void;
  onDownloadList: () => void;
}

type SortField = 'firstName' | 'lastName' | 'mealSelection' | 'party' | 'assignment';
type SortDirection = 'asc' | 'desc';

interface SortableHeaderProps {
  field: SortField;
  children: React.ReactNode;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

const SortableHeader = ({
  field,
  children,
  sortField,
  sortDirection,
  onSort,
}: SortableHeaderProps) => {
  const ariaSortValue =
    sortField === field ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none';

  return (
    <TableHead aria-sort={ariaSortValue as 'ascending' | 'descending' | 'none'}>
      <button
        onClick={() => onSort(field)}
        className="hover:text-foreground flex items-center gap-1 transition-colors"
        aria-label={`Sort by ${children}${sortField === field ? `, currently ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : ''}`}
      >
        {children}
        <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
      </button>
    </TableHead>
  );
};

export const GuestGrid = ({
  guests,
  onEditGuest,
  onAddGuest,
  onUploadFile,
  onDownloadList,
}: GuestGridProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('lastName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const filteredAndSortedGuests = useMemo(() => {
    const getFirstName = (guest: Guest) => guest.firstName || guest.fullName.split(' ')[0] || '';
    const getLastName = (guest: Guest) =>
      guest.lastName || guest.fullName.split(' ').slice(1).join(' ') || '';

    const filtered = guests.filter((guest) => {
      const firstName = getFirstName(guest).toLowerCase();
      const lastName = getLastName(guest).toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      return (
        firstName.includes(searchLower) ||
        lastName.includes(searchLower) ||
        guest.fullName.toLowerCase().includes(searchLower) ||
        guest.mealSelection.toLowerCase().includes(searchLower) ||
        guest.party.toLowerCase().includes(searchLower)
      );
    });

    // Global sorting with smart family grouping
    filtered.sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortField) {
        case 'firstName':
          aValue = getFirstName(a);
          bValue = getFirstName(b);
          break;
        case 'lastName':
          aValue = getLastName(a);
          bValue = getLastName(b);
          break;
        case 'mealSelection':
          aValue = a.mealSelection;
          bValue = b.mealSelection;
          break;
        case 'party':
          // Use lowercase for sort comparison so "Smith Family" and
          // "smith family" sort into the same place.
          aValue = a.party.toLowerCase();
          bValue = b.party.toLowerCase();
          break;
        case 'assignment':
          aValue = 'Unassigned'; // Will be enhanced with actual table assignment
          bValue = 'Unassigned';
          break;
        default:
          aValue = getLastName(a);
          bValue = getLastName(b);
      }

      const primaryComparison = aValue.localeCompare(bValue);
      const sortedComparison = sortDirection === 'asc' ? primaryComparison : -primaryComparison;

      // If sorting by party, use primary sort only
      if (sortField === 'party') {
        return sortedComparison;
      }

      // For other fields, use secondary sort by party to keep families together when values are equal
      if (sortedComparison === 0) {
        return a.party.toLowerCase().localeCompare(b.party.toLowerCase());
      }

      return sortedComparison;
    });

    return filtered;
  }, [guests, searchTerm, sortField, sortDirection]);

  const paginatedGuests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedGuests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedGuests, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedGuests.length / itemsPerPage);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>
            Guests (<span aria-live="polite">{filteredAndSortedGuests.length}</span>)
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform"
                aria-hidden="true"
              />
              <Input
                placeholder="Search guests..."
                aria-label="Search guests by name, meal, or party"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-48 pl-10 sm:w-64"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDownloadList}
              aria-label="Download guest list"
              className="text-muted-foreground hover:text-primary"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUploadFile}
              aria-label="Upload guest file"
              className="text-muted-foreground hover:text-primary"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button onClick={onAddGuest} size="sm" className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Add Guest
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader
                  field="firstName"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  First Name
                </SortableHeader>
                <SortableHeader
                  field="lastName"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  Last Name
                </SortableHeader>
                <SortableHeader
                  field="party"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  Party
                </SortableHeader>
                <SortableHeader
                  field="mealSelection"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  Meal Selection
                </SortableHeader>
                <SortableHeader
                  field="assignment"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  Table
                </SortableHeader>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedGuests.map((guest) => (
                <GuestGridRow key={guest.id} guest={guest} onEdit={onEditGuest} />
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-muted-foreground text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {filteredAndSortedGuests.length === 0 && (
          <div className="text-muted-foreground py-8 text-center">
            {searchTerm ? 'No guests found matching your search.' : 'No guests added yet.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
