
'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import type { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { LogOut, Download, FileJson, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from './theme-toggle';
import type { JournalEntry } from '@/lib/types';
import { MOODS } from '@/lib/constants';

interface UserMenuProps {
  user: User;
  showThemeToggle?: boolean;
  entries?: JournalEntry[];
}

export function UserMenu({ user, showThemeToggle = true, entries = [] }: UserMenuProps) {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      window.location.href = '/login';
    } catch (error: any) {
      console.error('Logout Error:', error);
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'Could not log you out. Please try again.',
      });
    }
  };

  const handleExportJSON = () => {
    if (!entries || entries.length === 0) {
      toast({
        title: 'No Data to Export',
        description: 'You have no journal entries to download.',
      });
      return;
    }

    try {
      const dataToExport = entries.map(entry => ({
        ...entry,
        // Convert Firestore Timestamp to a readable ISO string
        date: entry.date ? ((entry.date as any).toDate ? (entry.date as any).toDate().toISOString() : entry.date) : null,
      }));

      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'reflectwell_export.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: `Your ${entries.length} journal entries have been downloaded as JSON.`,
      });
    } catch (error) {
      console.error('Export Error:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Could not export your data. Please try again.',
      });
    }
  };

  const handleExportCSV = () => {
    if (!entries || entries.length === 0) {
      toast({
        title: 'No Data to Export',
        description: 'You have no journal entries to download.',
      });
      return;
    }

    try {
      const headers = ['date', 'mood', 'content', 'tags', 'imageUrl'];
      
      // Helper to format a value for CSV, handling commas and quotes
      const formatCsvField = (field: any): string => {
        if (field === null || field === undefined) {
          return '';
        }
        const str = String(field);
        // If the string contains a comma, double quote, or newline, wrap it in double quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          // Escape existing double quotes by doubling them
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csvRows = [headers.join(',')]; // Header row

      for (const entry of entries) {
        const date = entry.date ? ((entry.date as any).toDate ? (entry.date as any).toDate().toISOString() : entry.date) : '';
        const mood = MOODS[entry.mood]?.label || entry.mood;
        const content = entry.content || '';
        const tags = entry.tags?.join('; ') || ''; // Use semicolon to avoid comma conflicts
        const imageUrl = entry.imageUrl || '';

        const row = [date, mood, content, tags, imageUrl].map(formatCsvField).join(',');
        csvRows.push(row);
      }

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'reflectwell_export.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: `Your ${entries.length} journal entries have been downloaded as CSV.`,
      });
    } catch (error) {
      console.error('CSV Export Error:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Could not export your data to CSV. Please try again.',
      });
    }
  };

  const getInitials = (email: string | null) => {
    if (!email) return 'U';
    return email[0].toUpperCase();
  };

  return (
    <div className="flex items-center gap-2">
      {showThemeToggle && <ThemeToggle />}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">My Account</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
             <DropdownMenuLabel>Export Data</DropdownMenuLabel>
             <DropdownMenuItem onClick={handleExportJSON}>
              <FileJson className="mr-2 h-4 w-4" />
              <span>Export to JSON</span>
            </DropdownMenuItem>
             <DropdownMenuItem onClick={handleExportCSV}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Export to CSV</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
