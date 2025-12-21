
'use client';

import { useState } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { JournalTemplate } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, FileText, Loader2 } from 'lucide-react';

interface TemplateManagerProps {
  templates: JournalTemplate[];
}

const templateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long.'),
  content: z.string().min(10, 'Template content must be at least 10 characters long.'),
});

export function TemplateManager({ templates }: TemplateManagerProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<JournalTemplate | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const handleOpenDialog = (template: JournalTemplate | null = null) => {
    setEditingTemplate(template);
    form.reset(template ? { title: template.title, content: template.content } : { title: '', content: '' });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof templateSchema>) => {
    if (!user || !firestore) return;

    setIsSubmitting(true);

    try {
      if (editingTemplate) {
        // Update existing template
        const templateRef = doc(firestore, 'users', user.uid, 'templates', editingTemplate.id);
        await updateDocumentNonBlocking(templateRef, values);
        toast({ title: 'Template Updated', description: `"${values.title}" has been saved.` });
      } else {
        // Create new template
        const templatesRef = collection(firestore, 'users', user.uid, 'templates');
        await addDocumentNonBlocking(templatesRef, {
          ...values,
          userId: user.uid,
        });
        toast({ title: 'Template Created', description: `"${values.title}" has been added to your templates.` });
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving template:', error);
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the template.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const confirmDelete = () => {
    if (!user || !firestore || !deleteCandidateId) return;

    const templateRef = doc(firestore, 'users', user.uid, 'templates', deleteCandidateId);
    deleteDocumentNonBlocking(templateRef);

    toast({
      title: "Template Deleted",
      description: "Your journal template has been removed.",
    });
    setDeleteCandidateId(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex-col sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Journal Templates</CardTitle>
              <CardDescription>Create and manage reusable templates for your journal entries.</CardDescription>
            </div>
            <div className="flex justify-start sm:justify-end pt-4 sm:pt-0">
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog()}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Template
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingTemplate ? 'Edit' : 'Create'} Template</DialogTitle>
                        <DialogDescription>
                            {editingTemplate ? 'Modify your template below.' : 'Create a new reusable template for your entries.'}
                        </DialogDescription>
                    </DialogHeader>
                    <FormProvider {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Daily Check-in" {...field} disabled={isSubmitting} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Content</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Today's High: \nToday's Low: \nI'm grateful for: "
                                                rows={8}
                                                {...field}
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                                    ) : 'Save Template'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </FormProvider>
                </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {templates.map(template => (
                <AccordionItem value={template.id} key={template.id}>
                   <div className="flex items-center w-full">
                    <AccordionTrigger>
                      <span className="font-medium">{template.title}</span>
                    </AccordionTrigger>
                     <div className="flex items-center gap-2 pr-4 pl-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(template)}
                          aria-label="Edit template"
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteCandidateId(template.id)}
                          aria-label="Delete template"
                        >
                          <Trash2 className="h-5 w-5 text-destructive/80 hover:text-destructive" />
                        </Button>
                      </div>
                   </div>
                  <AccordionContent className="whitespace-pre-wrap text-muted-foreground p-4 bg-secondary/20 rounded-md">
                    {template.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
              <FileText className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Templates Yet</h3>
              <p>Click "New Template" to create your first one and streamline your journaling.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
       <AlertDialog open={!!deleteCandidateId} onOpenChange={(open) => !open && setDeleteCandidateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this template. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteCandidateId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
