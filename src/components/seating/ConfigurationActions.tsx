import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { downloadConfiguration, importCompleteConfiguration } from '@/utils/configExportUtils';
import { useToast } from '@/hooks/use-toast';
export const ConfigurationActions = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDownload = () => {
    try {
      downloadConfiguration();
      toast({
        title: 'Configuration Downloaded',
        description: 'Your room configuration has been saved successfully.',
      });
    } catch {
      toast({
        title: 'Download Failed',
        description: 'Could not download configuration. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const result = importCompleteConfiguration(jsonString);

        if (result.success) {
          toast({
            title: 'Configuration Imported',
            description: 'Your room configuration has been loaded successfully.',
          });

          // Reload the page to apply all changes including color theme
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          toast({
            title: 'Import Failed',
            description: result.error || 'Could not import configuration file.',
            variant: 'destructive',
          });
        }
      } catch {
        toast({
          title: 'Import Failed',
          description: 'Invalid configuration file format.',
          variant: 'destructive',
        });
      }
    };

    reader.readAsText(file);

    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Download
        </Button>

        <Button onClick={handleUpload} variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
};
