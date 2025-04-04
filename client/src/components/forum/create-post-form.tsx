import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Send, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { analyzeContent, getContentWarningLevel, filterInappropriateContent, FilterLevel } from '@/utils/language-filter';
import ContentFilterAlert from './content-filter-alert';

type CreatePostFormProps = {
  categoryId: number;
  onPostCreated: () => void;
  onCancel?: () => void;
};

const formSchema = z.object({
  title: z.string().min(3, {
    message: 'Title must be at least 3 characters long',
  }).max(100, {
    message: 'Title cannot be longer than 100 characters',
  }),
  content: z.string().min(10, {
    message: 'Content must be at least 10 characters long',
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreatePostForm({ categoryId, onPostCreated, onCancel }: CreatePostFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentFilterLevel, setContentFilterLevel] = useState<FilterLevel>('none');
  const [acknowledgedFilter, setAcknowledgedFilter] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a post',
        variant: 'destructive',
      });
      return;
    }

    // Check content filter level
    const filterLevel = getContentWarningLevel(data.content);
    
    if (filterLevel !== 'none' && !acknowledgedFilter) {
      setContentFilterLevel(filterLevel);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/forum/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryId,
          userId: user.id,
          title: data.title,
          content: data.content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      toast({
        title: 'Success',
        description: 'Your post has been created successfully',
      });

      form.reset();
      onPostCreated();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create post',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    form.setValue('content', newContent);
    form.trigger('content'); // Validate the field

    // Reset content filter acknowledgment when content changes
    if (acknowledgedFilter) {
      setAcknowledgedFilter(false);
    }
  };

  const handleAcknowledgeFilter = () => {
    setAcknowledgedFilter(true);
  };

  return (
    <Card className="w-full mb-6 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Create New Post</CardTitle>
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter post title..." {...field} />
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
                      placeholder="Write your post here..." 
                      className="min-h-[200px]" 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleContentChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Use clear and concise language. Be respectful of others.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!acknowledgedFilter && contentFilterLevel !== 'none' && (
              <ContentFilterAlert 
                level={contentFilterLevel} 
                onAcknowledge={handleAcknowledgeFilter}
              />
            )}

            {form.formState.errors.root && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {form.formState.errors.root.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isSubmitting || (contentFilterLevel !== 'none' && !acknowledgedFilter)}
              className="ml-auto"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Creating...' : 'Create Post'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}