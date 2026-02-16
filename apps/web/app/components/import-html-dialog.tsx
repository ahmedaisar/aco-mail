import { DialogClose } from '@radix-ui/react-dialog';
import { useMutation } from '@tanstack/react-query';
import { FileUpIcon, Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { httpPost } from '~/lib/http';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { Database } from '~/types/database';

type ImportTemplateResponse = {
  template: Database['public']['Tables']['mails']['Row'];
};

export function ImportHtmlDialog() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [fileName, setFileName] = useState('');

  const { mutateAsync: importTemplate, isPending } = useMutation({
    mutationFn: async (data: {
      title: string;
      previewText: string;
      html: string;
    }) => {
      return httpPost<ImportTemplateResponse>('/api/v1/templates/import', data);
    },
    onSuccess: (data) => {
      setOpen(false);
      navigate(`/templates/${data.template.id}`);
      toast.success('Template imported successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to import template');
    },
  });

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    // Auto-populate title from filename if empty
    if (!title) {
      // Remove extension while handling multiple dots and dot-prefixed filenames
      const parts = file.name.split('.');
      const nameWithoutExt = parts.length > 1 ? parts.slice(0, -1).join('.') : file.name;
      setTitle(nameWithoutExt || file.name);
    }

    try {
      const text = await file.text();
      setHtmlContent(text);
    } catch (err) {
      toast.error('Failed to read file');
    }
  };

  const handleImport = async () => {
    const trimmedTitle = title.trim();
    const trimmedPreviewText = previewText.trim();

    if (!trimmedTitle || trimmedTitle.length < 3) {
      toast.error('Title must be at least 3 characters');
      return;
    }

    if (!htmlContent) {
      toast.error('Please select an HTML file to import');
      return;
    }

    await importTemplate({
      title: trimmedTitle,
      previewText: trimmedPreviewText,
      html: htmlContent,
    });
  };

  const handleDialogChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setTitle('');
      setPreviewText('');
      setHtmlContent('');
      setFileName('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger className="flex min-h-[28px] cursor-pointer items-center justify-center rounded-md bg-white px-2 py-1 text-sm text-black hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 max-lg:w-7">
        <FileUpIcon className="inline-block size-4 shrink-0 lg:mr-1" />
        <span className="hidden lg:inline-block">Import HTML</span>
      </DialogTrigger>

      <DialogContent className="w-full max-w-md p-6">
        <DialogHeader>
          <DialogTitle>Import HTML Template</DialogTitle>
          <DialogDescription>
            Upload an HTML file to create a new email template
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="html-file">HTML File</Label>
            <Input
              id="html-file"
              type="file"
              accept=".html,.htm"
              onChange={handleFileChange}
              disabled={isPending}
            />
            {fileName && (
              <p className="text-xs text-gray-500">Selected: {fileName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-title">
              Template Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="template-title"
              type="text"
              placeholder="My Email Template"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preview-text">Preview Text (Optional)</Label>
            <Input
              id="preview-text"
              type="text"
              placeholder="Email preview text..."
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <DialogClose asChild>
            <button
              className="flex min-h-[28px] w-full cursor-pointer items-center justify-center rounded-md bg-gray-100 px-2 py-1.5 text-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              disabled={isPending}
            >
              Cancel
            </button>
          </DialogClose>
          <button
            className="flex min-h-[28px] w-full cursor-pointer items-center justify-center rounded-md bg-black px-2 py-1.5 text-sm text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={isPending}
            onClick={handleImport}
          >
            {isPending ? (
              <Loader2Icon className="inline-block size-4 shrink-0 animate-spin" />
            ) : (
              'Import'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
