
'use client';

import { useState, useEffect } from 'react';
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
import { LogOut, FileJson, FileText, FileDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from './theme-toggle';
import type { JournalEntry } from '@/lib/types';
import { MOODS } from '@/lib/constants';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

interface UserMenuProps {
  user: User;
  showThemeToggle?: boolean;
  entries?: JournalEntry[];
}

export function UserMenu({ user, showThemeToggle = true, entries = [] }: UserMenuProps) {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isExporting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isExporting]);


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
  
  const checkPermissionsAndData = () => {
    if (!user.emailVerified) {
        toast({
            variant: 'destructive',
            title: 'Email Verification Required',
            description: 'Please verify your email to export your journal entries.',
        });
        return false;
    }

    if (!entries || entries.length === 0) {
      toast({
        title: 'No Data to Export',
        description: 'You have no journal entries to download.',
      });
      return false;
    }
    return true;
  }

  const handleExportJSON = () => {
    if (!checkPermissionsAndData()) return;

    try {
      const dataToExport = entries.map(entry => ({
        ...entry,
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
    if (!checkPermissionsAndData()) return;

    try {
      const headers = ['date', 'mood', 'content', 'tags', 'imageUrl'];
      
      const formatCsvField = (field: any): string => {
        if (field === null || field === undefined) return '';
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csvRows = [headers.join(',')];

      for (const entry of entries) {
        const date = entry.date ? ((entry.date as any).toDate ? (entry.date as any).toDate().toISOString() : entry.date) : '';
        const mood = MOODS[entry.mood]?.label || entry.mood;
        const content = entry.content || '';
        const tags = entry.tags?.join('; ') || '';
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

  const createTagsImage = async (tags: string[]): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const tagHeight = 22;
    const tagPaddingX = 12;
    const tagGap = 8;
    const fontSize = 12;
    
    ctx.font = `${fontSize}px sans-serif`;

    const tagWidths = tags.map(tag => ctx.measureText(tag).width);
    const totalWidth = tagWidths.reduce((sum, width) => sum + width + (tagPaddingX * 2), 0) + (tagGap * (tags.length - 1));

    canvas.width = totalWidth;
    canvas.height = tagHeight;
    ctx.font = `${fontSize}px sans-serif`; // Reset font after canvas resize
    ctx.textBaseline = 'middle';

    let currentX = 0;
    for (let i = 0; i < tags.length; i++) {
        const tag = tags[i];
        const tagWidth = tagWidths[i] + (tagPaddingX * 2);

        // Draw background
        ctx.fillStyle = '#f1f5f9'; // bg-slate-100
        ctx.beginPath();
        ctx.roundRect(currentX, 0, tagWidth, tagHeight, tagHeight / 2);
        ctx.fill();

        // Draw text
        ctx.fillStyle = '#475569'; // text-slate-600
        ctx.fillText(tag, currentX + tagPaddingX, tagHeight / 2);
        
        currentX += tagWidth + tagGap;
    }

    return canvas.toDataURL('image/png');
  };

  const handleExportPDF = async () => {
    if (!checkPermissionsAndData() || isExporting) return;

    setIsExporting(true);
    toast({
        title: 'Preparing PDF Export',
        description: `This may take a moment for ${entries.length} entries...`,
    });

    try {
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const margin = 40;
        const contentWidth = pdfWidth - (margin * 2);

        // Sort entries chronologically for the book
        const sortedEntries = [...entries].sort((a, b) => {
            const dateA = a.date ? ((a.date as any).toDate ? (a.date as any).toDate() : new Date(a.date as string)) : new Date(0);
            const dateB = b.date ? ((b.date as any).toDate ? (b.date as any).toDate() : new Date(b.date as string)) : new Date(0);
            return dateA.getTime() - dateB.getTime();
        });

        for (let i = 0; i < sortedEntries.length; i++) {
            const entry = sortedEntries[i];
            const entryDate = entry.date ? ((entry.date as any).toDate ? (entry.date as any).toDate() : new Date(entry.date as string)) : new Date();

            let tagsImageHtml = '';
            if (entry.tags && entry.tags.length > 0) {
              const tagsImageUrl = await createTagsImage(entry.tags);
              tagsImageHtml = `
                <div style="margin-top: 16pt; padding-top: 8pt; border-top: 1px solid #eee;">
                    <h2 style="font-weight: bold; font-size: 10pt; margin-bottom: 8pt; color: #555;">Tags</h2>
                    <img src="${tagsImageUrl}" style="height: 22px; width: auto;" />
                </div>`;
            }

            const entryElement = document.createElement('div');
            entryElement.style.position = 'absolute';
            entryElement.style.left = '-9999px';
            entryElement.style.width = `${contentWidth}pt`;
            entryElement.style.padding = `${margin}pt`;
            entryElement.style.fontFamily = 'serif';
            entryElement.style.fontSize = '12pt';
            entryElement.style.lineHeight = '1.5';
            entryElement.style.color = '#333';
            entryElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 8pt; margin-bottom: 16pt;">
                    <h1 style="font-size: 16pt; font-weight: bold; margin: 0;">${format(entryDate, "MMMM d, yyyy")}</h1>
                    <span style="font-size: 24pt;">${MOODS[entry.mood].emoji}</span>
                </div>
                ${entry.imageUrl ? `<img src="${entry.imageUrl}" style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 16pt;" />` : ''}
                <div style="white-space: pre-wrap; word-wrap: break-word;">${entry.content.replace(/\n/g, '<br />')}</div>
                ${tagsImageHtml}
            `;
            document.body.appendChild(entryElement);

            const canvas = await html2canvas(entryElement, { 
                scale: 2, 
                useCORS: true,
            });
            const imgData = canvas.toDataURL('image/png');
            const imgHeight = (canvas.height * contentWidth) / canvas.width;
            
            if (i > 0) {
                pdf.addPage();
            }
            pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, imgHeight);

            document.body.removeChild(entryElement);
        }

        pdf.save('reflectwell_export.pdf');
        toast({
            title: 'Export Complete!',
            description: 'Your journal has been downloaded as a PDF.',
        });

    } catch (error) {
        console.error('PDF Export Error:', error);
        toast({
            variant: 'destructive',
            title: 'Export Failed',
            description: 'Could not generate PDF. Please try again.',
        });
    } finally {
        setIsExporting(false);
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
             <DropdownMenuItem onClick={handleExportJSON} disabled={isExporting}>
              <FileJson className="mr-2 h-4 w-4" />
              <span>Export to JSON</span>
            </DropdownMenuItem>
             <DropdownMenuItem onClick={handleExportCSV} disabled={isExporting}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Export to CSV</span>
            </DropdownMenuItem>
             <DropdownMenuItem onClick={handleExportPDF} disabled={isExporting}>
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                <span>Export to PDF</span>
             </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} disabled={isExporting}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
