import React, { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Download,
  Upload,
  LayoutDashboard,
  Users,
  Armchair,
  ClipboardList,
  Settings,
  Palette,
  RotateCcw,
} from 'lucide-react';
import { NavLink } from './NavLink';
import { ThemeColorPicker } from './ThemeColorPicker';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useColorTheme } from '@/contexts/ColorThemeContext';
import { downloadConfiguration, importCompleteConfiguration } from '@/utils/configExportUtils';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { safeLocalStorage } from '@/lib/safeStorage';

const navigationItems = [
  { label: 'Room Layout', path: '/room-layout', icon: LayoutDashboard },
  { label: 'Guests', path: '/guest-management', icon: Users },
  { label: 'Seating', path: '/seat-assignments', icon: Armchair },
  { label: 'Summary', path: '/banquet-summary', icon: ClipboardList },
] as const;

export const TopNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settingsTooltipEnabled, setSettingsTooltipEnabled] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedTheme, setSelectedTheme } = useColorTheme();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRestart = () => {
    if (
      !window.confirm(
        'Are you sure you want to restart? This will clear all your data including guests, tables, assets, and meal options.',
      )
    ) {
      return;
    }
    safeLocalStorage.clear();
    navigate('/');
    window.location.reload();
  };

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
    event.target.value = '';
  };

  return (
    <nav className="border-border bg-card fixed top-0 right-0 left-0 z-50 border-b shadow-xs print:hidden">
      <div className="container mx-auto px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Left — Brand */}
          <div className="flex shrink-0 items-center">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <span className="text-primary-foreground text-sm font-bold">Y</span>
              </div>
              <span className="text-foreground text-lg font-bold">YourDay</span>
            </Link>
          </div>

          {/* Center — Page navigation (desktop) */}
          <div className="hidden items-center md:flex">
            {navigationItems.map((item) => (
              <div key={item.path} className="flex items-center">
                <NavLink
                  to={item.path}
                  label={item.label}
                  icon={item.icon}
                  isActive={location.pathname === item.path}
                />
              </div>
            ))}
          </div>

          {/* Right — Actions + Auth (desktop) */}
          <div className="hidden items-center gap-1 md:flex">
            {/* Settings dropdown */}
            <DropdownMenu
              onOpenChange={(open) => {
                if (!open) {
                  // Suppress tooltip briefly so focus-return doesn't trigger it
                  setSettingsTooltipEnabled(false);
                  setTimeout(() => setSettingsTooltipEnabled(true), 500);
                }
              }}
            >
              <Tooltip open={settingsTooltipEnabled ? undefined : false}>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:bg-primary/10 hover:text-primary h-9 w-9 cursor-pointer transition-colors duration-200"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">Settings</span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={handleRestart}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restart Project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Project
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={handleUpload}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="flex items-center gap-2 text-xs">
                  <Palette className="h-3.5 w-3.5" />
                  Theme Color
                </DropdownMenuLabel>
                <ThemeColorPicker
                  selectedTheme={selectedTheme}
                  setSelectedTheme={setSelectedTheme}
                />
                <DropdownMenuSeparator />
                <div className="text-muted-foreground px-2 pt-1 pb-1.5 text-[10px] tracking-wide">
                  Built by{' '}
                  <a
                    href="https://www.linkedin.com/in/kylegiacchi/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary font-medium underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current"
                  >
                    Kyle Giacchi
                  </a>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="focus:ring-primary text-muted-foreground hover:bg-muted hover:text-foreground rounded-md p-2 focus:ring-2 focus:outline-hidden"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="border-border border-t pb-4 md:hidden">
            {/* Page links */}
            <div className="space-y-1 px-2 pt-2 pb-3">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium transition-colors',
                      location.pathname === item.path
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted hover:text-foreground',
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Settings section */}
            <div className="border-border border-t px-2 pt-3">
              <p className="text-muted-foreground px-3 pb-2 text-xs font-semibold tracking-wider uppercase">
                Settings
              </p>
              <button
                type="button"
                className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium transition-colors"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleRestart();
                }}
              >
                <RotateCcw className="h-5 w-5" />
                Restart Project
              </button>
              <button
                type="button"
                className="text-foreground hover:bg-muted hover:text-foreground flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium transition-colors"
                onClick={() => {
                  handleDownload();
                  setIsMobileMenuOpen(false);
                }}
              >
                <Download className="h-5 w-5" />
                Download Project
              </button>
              <button
                type="button"
                className="text-foreground hover:bg-muted hover:text-foreground flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium transition-colors"
                onClick={() => {
                  handleUpload();
                  setIsMobileMenuOpen(false);
                }}
              >
                <Upload className="h-5 w-5" />
                Upload Project
              </button>
              <div className="px-3 pt-3 pb-1">
                <p className="text-muted-foreground flex items-center gap-2 pb-2 text-xs font-semibold tracking-wider uppercase">
                  <Palette className="h-3.5 w-3.5" />
                  Theme Color
                </p>
                <ThemeColorPicker
                  selectedTheme={selectedTheme}
                  setSelectedTheme={setSelectedTheme}
                />
              </div>
              <div className="text-muted-foreground px-3 pt-3 pb-1 text-[10px] tracking-wide">
                Built by{' '}
                <a
                  href="https://www.linkedin.com/in/kylegiacchi/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary font-medium underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current"
                >
                  Kyle Giacchi
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </nav>
  );
};
