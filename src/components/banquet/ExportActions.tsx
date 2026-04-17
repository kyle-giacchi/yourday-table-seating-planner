import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Printer, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SummaryViewModel } from '@/utils/summaryViewModel';
import { formatBanquetSummaryText } from '@/utils/banquetSummaryText';

interface ExportActionsProps {
  vm: SummaryViewModel;
}

export const ExportActions = ({ vm }: ExportActionsProps) => {
  const { toast } = useToast();

  const handlePrintSummary = () => {
    window.print();
  };

  const handleEmailSummary = () => {
    const subject = encodeURIComponent('Banquet Team Summary');
    const text = formatBanquetSummaryText(vm);
    const trimmed =
      text.length > 1800 ? text.slice(0, 1800) + '\n… (truncated — use Copy for full)' : text;
    const body = encodeURIComponent(trimmed);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(formatBanquetSummaryText(vm));
      toast({
        title: 'Summary copied',
        description: 'Full event summary is now in your clipboard',
      });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopySummary}
        className="flex items-center gap-2"
      >
        <Copy className="h-4 w-4" />
        Copy
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleEmailSummary}
        className="flex items-center gap-2"
      >
        <Mail className="h-4 w-4" />
        Email
      </Button>
      <Button
        variant="default"
        size="sm"
        onClick={handlePrintSummary}
        className="flex items-center gap-2"
      >
        <Printer className="h-4 w-4" />
        Print
      </Button>
    </div>
  );
};
