import { createSupabaseServerClient } from '~/lib/supabase/server';
import type { Route } from './+types/api.v1.templates.import';
import { z } from 'zod';
import { json } from '~/lib/response';
import { serializeZodError } from '~/lib/errors';
import { htmlToTiptapJson } from '~/lib/html-to-tiptap';

export async function action(args: Route.ActionArgs) {
  const { request } = args;
  if (!['POST'].includes(request.method)) {
    return json(
      { status: 405, message: 'Method Not Allowed', errors: [] },
      { status: 405 }
    );
  }

  const headers = new Headers();
  const supabase = createSupabaseServerClient(request, headers);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return json(
      {
        status: 401,
        message: 'Unauthorized',
        errors: ['Unauthorized'],
      },
      { status: 401 }
    );
  }

  const body = await request.json();
  const schema = z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters'),
    previewText: z.string().trim().optional(),
    html: z.string().min(1, 'HTML content is required'),
  });

  const { data, error } = schema.safeParse(body);
  if (error) {
    return serializeZodError(error);
  }

  const { title, previewText, html } = data;

  // Convert HTML to TipTap JSON
  let tiptapJson;
  try {
    tiptapJson = htmlToTiptapJson(html);
  } catch (err) {
    return json(
      {
        errors: [],
        message: 'Failed to parse HTML content',
        status: 400,
      },
      { status: 400 }
    );
  }

  // Save the template
  const { error: insertError, data: insertData } = await supabase
    .from('mails')
    .insert({
      title,
      preview_text: previewText || '',
      content: JSON.stringify(tiptapJson),
      user_id: user.id,
    })
    .select()
    .single();

  if (insertError) {
    return json(
      { errors: [], message: 'Failed to insert template', status: 500 },
      { status: 500 }
    );
  }

  return json({ template: insertData });
}
