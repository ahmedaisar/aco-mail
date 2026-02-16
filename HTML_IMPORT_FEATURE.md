# HTML Template Import Feature

## Overview
This feature allows users to import custom HTML templates into the Maily email editor. HTML files are automatically converted to the TipTap JSON format used by the editor.

## Usage

### From the UI
1. Open the email editor (playground or template editor)
2. Click the "Import HTML" button in the toolbar
3. Select an HTML file (.html or .htm)
4. Enter a template title (auto-populated from filename)
5. Optionally add preview text
6. Click "Import" to create the template

### API Endpoint
**POST** `/api/v1/templates/import`

**Request Body:**
```json
{
  "title": "My Template",
  "previewText": "Optional preview text",
  "html": "<html>...</html>"
}
```

**Response:**
```json
{
  "template": {
    "id": "uuid",
    "title": "My Template",
    "preview_text": "Optional preview text",
    "content": "{...tiptap json...}",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

## Supported HTML Elements

The converter supports the following HTML elements:

### Block Elements
- **Headings**: `<h1>` to `<h6>` - Converted to TipTap heading nodes with level attributes
- **Paragraphs**: `<p>` - Converted to paragraph nodes
- **Lists**: `<ul>` and `<ol>` - Converted to bulletList/orderedList with listItem children
- **Horizontal Rules**: `<hr>` - Converted to horizontalRule nodes
- **Line Breaks**: `<br>` - Converted to hardBreak nodes
- **Divs**: `<div>` - Processed based on content (container or paragraph)

### Inline Elements
- **Bold**: `<strong>` or `<b>` - Converted to bold marks
- **Italic**: `<em>` or `<i>` - Converted to italic marks
- **Underline**: `<u>` - Converted to underline marks
- **Links**: `<a>` - Converted to link marks with href and target attributes

## Implementation Details

### Files Added/Modified

1. **`apps/web/app/lib/html-to-tiptap.ts`**
   - Core conversion utility
   - Parses HTML using node-html-parser
   - Recursively converts HTML elements to TipTap JSON nodes
   - Handles block and inline elements
   - Preserves text formatting as marks

2. **`apps/web/app/routes/api.v1.templates.import.ts`**
   - API endpoint for importing HTML
   - Validates input with Zod
   - Calls html-to-tiptap converter
   - Saves template to Supabase database
   - Requires authentication

3. **`apps/web/app/components/import-html-dialog.tsx`**
   - UI component for file upload
   - Dialog with file input, title, and preview text fields
   - Auto-populates title from filename
   - Integrated into email editor toolbar

4. **`apps/web/app/components/email-editor-sandbox.tsx`**
   - Modified to include Import HTML button
   - Button appears next to other editor actions

5. **`apps/web/app/lib/html-to-tiptap.test.ts`**
   - Unit tests for HTML converter
   - 8 test cases covering common scenarios
   - All tests passing

### Dependencies Added
- `node-html-parser`: Added to `apps/web/package.json` for HTML parsing

## Limitations

1. **Custom Email Components**: The converter doesn't automatically create Maily's custom email components (buttons, sections, columns, etc.). These would need to be added manually in the editor after import.

2. **CSS Styles**: Inline styles and CSS classes are not preserved during conversion. The editor uses its own styling system.

3. **Images**: Image elements can be converted, but complex image layouts may need adjustment.

4. **Complex Layouts**: Nested structures and complex layouts may need manual adjustment after import.

## Future Enhancements

Potential improvements for future versions:

1. **HTML Button Detection**: Detect HTML buttons and convert them to Maily button components
2. **Style Preservation**: Attempt to preserve some inline styles where applicable
3. **Image Handling**: Better support for images and image attributes
4. **Table Support**: Add support for HTML tables
5. **Export Improvements**: Add HTML download feature (currently only copies to clipboard)
6. **Template Library**: Support importing from template libraries or URLs
7. **Preview Before Import**: Show a preview of how the imported template will look

## Testing

Run tests with:
```bash
cd apps/web
npx vitest run app/lib/html-to-tiptap.test.ts
```

All 8 tests should pass:
- ✓ Simple paragraph conversion
- ✓ Heading conversion
- ✓ Bold text marks
- ✓ Link conversion
- ✓ Unordered lists
- ✓ Ordered lists
- ✓ Empty HTML handling
- ✓ Complex nested formatting

## Security

- CodeQL security scan: ✓ No issues found
- Input validation with Zod schemas
- Authentication required for API endpoint
- HTML parsing uses safe node-html-parser library
