import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSeating } from '@/hooks/useSeating';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, AlertCircle, X, Download } from 'lucide-react';
import type { ParsedGuestData } from '@/lib/fileUtils';
import { parseCSVFile, parseExcelFile, validateFileType } from '@/lib/fileUtils';
import { useMealOptions } from '@/contexts/MealOptionsContext';
import { processGuestImport } from '@/services/guestImportService';
import { sanitizeGuestData } from '@/lib/security';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
}

export const FileUploadModal = ({ open, onClose }: FileUploadModalProps) => {
  const { addGuest, updateGuest, seatingData } = useSeating();
  const { mealOptions, addMealOptions } = useMealOptions();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedGuestData[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!validateFileType(file)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a CSV or Excel file (.csv, .xlsx)',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: 'File Too Large',
        description: 'File size must not exceed 5 MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setParseErrors([]);
    setParsedData([]);

    try {
      let result;
      if (file.name.toLowerCase().endsWith('.csv')) {
        result = await parseCSVFile(file);
      } else {
        result = await parseExcelFile(file);
      }

      if (result.success && result.data.length > 0) {
        // Sanitize each row directly for preview display (1:1 index alignment).
        // The full processGuestImport is called later in processGuestData when
        // the user confirms the import.
        const sanitizedData: ParsedGuestData[] = result.data.map((raw) => {
          const cleaned = sanitizeGuestData({
            firstName: raw.firstName,
            lastName: raw.lastName,
            party: raw.partyName,
            mealSelection: raw.mealSelection,
          });
          return {
            firstName: cleaned.firstName ?? raw.firstName,
            lastName: cleaned.lastName ?? raw.lastName,
            partyName: cleaned.party ?? raw.partyName,
            mealSelection: cleaned.mealSelection,
            table: raw.table,
          };
        });

        setParsedData(sanitizedData);
        setShowPreview(true);
        toast({
          title: 'File Parsed Successfully',
          description: `Found ${result.data.length} valid guest records`,
        });
      } else {
        setParseErrors(result.errors);
        toast({
          title: 'Parsing Errors',
          description: `Found ${result.errors.length} errors in your file`,
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to process file',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processGuestData = async () => {
    setIsProcessing(true);

    try {
      // Gather all existing guests (assigned + unassigned) for duplicate detection
      const allExistingGuests = [
        ...seatingData.unassignedGuests,
        ...seatingData.tables.flatMap((table) => table.guests),
      ];

      // Delegate all business logic (sanitization, deduplication, meal extraction)
      // to the import service
      const importResult = processGuestImport(
        parsedData,
        allExistingGuests,
        mealOptions.map((m) => m.label),
      );

      let addedCount = 0;
      let updatedCount = 0;

      for (let i = 0; i < importResult.guests.length; i++) {
        const guestData = importResult.guests[i];
        const raw = parsedData[i];

        // Determine whether this is a new guest or an update by matching against
        // the existing roster with the same key logic used in the service
        const existingGuest = allExistingGuests.find((existing) => {
          const parts = existing.fullName.split(' ');
          const fn = parts[0] ?? '';
          const ln = parts.slice(1).join(' ');
          return (
            fn.toLowerCase() === (raw.firstName ?? '').toLowerCase() &&
            ln.toLowerCase() === (raw.lastName ?? '').toLowerCase() &&
            existing.party.toLowerCase() === (raw.partyName ?? '').toLowerCase()
          );
        });

        if (existingGuest) {
          updateGuest(existingGuest.id, {
            fullName: guestData.fullName,
            mealSelection: guestData.mealSelection || existingGuest.mealSelection,
            party: guestData.party,
          });
          updatedCount++;
        } else {
          addGuest({
            fullName: guestData.fullName,
            mealSelection: guestData.mealSelection || 'No Meal Selected',
            party: guestData.party,
          });
          addedCount++;
        }
      }

      // Register any newly discovered meal types from the import
      if (importResult.newMealTypes.length > 0) {
        addMealOptions(importResult.newMealTypes);
      }

      const parts: string[] = [];
      if (addedCount > 0) parts.push(`${addedCount} new`);
      if (updatedCount > 0) parts.push(`${updatedCount} updated`);
      if (importResult.duplicateCount > 0) {
        parts.push(
          `${importResult.duplicateCount} duplicate${importResult.duplicateCount === 1 ? '' : 's'}`,
        );
      }
      toast({
        title: 'Upload Complete',
        description: parts.length > 0 ? parts.join(' · ') : 'No guests imported',
      });

      // Reset modal state
      setParsedData([]);
      setShowPreview(false);
      setParseErrors([]);
      onClose();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to process guest data',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setParsedData([]);
    setShowPreview(false);
    setParseErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleDownloadTemplate = () => {
    const exampleMeal = mealOptions[0]?.label ?? 'Chicken';
    const altMeal = mealOptions[1]?.label ?? 'Vegetarian';
    const rows = [
      ['First Name', 'Last Name', 'Party Name', 'Meal Selection', 'Table'],
      ['John', 'Doe', 'Smith Family', exampleMeal, 'Table 1'],
      ['Jane', 'Smith', 'Smith Family', altMeal, 'Table 2'],
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'guest-list-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: 'Template downloaded',
      description: 'Fill in your guests, then drag the file back here.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Guest List</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!showPreview ? (
            <>
              {/* File Upload Area */}
              <div
                className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-input hover:border-muted-foreground'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-medium">Upload CSV or Excel File</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Drag and drop your file here, or click to browse
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="mb-4"
                >
                  {isProcessing ? 'Processing...' : 'Choose File'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>

              {/* Format Instructions */}
              <div className="border-primary/20 bg-primary/5 rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="text-primary flex items-center gap-2 font-medium">
                    <FileText className="h-4 w-4" />
                    Required Format
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="h-7 gap-1.5 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Template
                  </Button>
                </div>
                <p className="text-foreground mb-3 text-sm">
                  Your file must have columns in this exact order:
                </p>
                <div className="bg-card rounded border p-3 font-mono text-sm">
                  <div className="text-success font-semibold">
                    First Name, Last Name, Party Name, Meal Selection, Table
                  </div>
                  <div className="text-muted-foreground mt-1">
                    John, Doe, Smith Family, Chicken, Table 1
                  </div>
                  <div className="text-muted-foreground">
                    Jane, Smith, Smith Family, Vegetarian, Table 2
                  </div>
                </div>
                <p className="text-primary mt-2 text-xs">
                  * First Name, Last Name, and Party Name are required
                  <br />
                  * Meal Selection and Table are optional
                  <br />* Current meals: {mealOptions.map((m) => m.label).join(', ')}
                </p>
              </div>

              {/* Parse Errors */}
              {parseErrors.length > 0 && (
                <div className="border-destructive/30 bg-destructive/10 rounded-lg border p-4">
                  <h4 className="text-destructive mb-2 flex items-center gap-2 font-medium">
                    <AlertCircle className="h-4 w-4" />
                    Parsing Errors ({parseErrors.length})
                  </h4>
                  <div className="max-h-32 overflow-y-auto">
                    {parseErrors.slice(0, 10).map((error) => (
                      <p key={error} className="text-destructive text-sm">
                        {error}
                      </p>
                    ))}
                    {parseErrors.length > 10 && (
                      <p className="text-destructive text-sm font-medium">
                        ... and {parseErrors.length - 10} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Preview Section */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-medium">
                  <CheckCircle className="text-success h-5 w-5" />
                  Preview ({parsedData.length} guests)
                </h3>
                <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                  <X className="mr-1 h-4 w-4" />
                  Back to Upload
                </Button>
              </div>

              <div className="max-h-96 overflow-y-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Party</th>
                      <th className="px-3 py-2 text-left">Meal</th>
                      <th className="px-3 py-2 text-left">Table</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((guest) => (
                      <tr
                        key={`${guest.firstName}-${guest.lastName}-${guest.partyName}`}
                        className="hover:bg-muted/50 border-b"
                      >
                        <td className="px-3 py-2">
                          {guest.firstName} {guest.lastName}
                        </td>
                        <td className="px-3 py-2">{guest.partyName}</td>
                        <td className="px-3 py-2">{guest.mealSelection || 'No Meal Selected'}</td>
                        <td className="px-3 py-2">{guest.table || 'Unassigned'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={processGuestData} disabled={isProcessing} className="flex-1">
                  {isProcessing ? 'Processing...' : 'Import Guests'}
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
