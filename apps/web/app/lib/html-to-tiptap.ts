import { parse, HTMLElement } from 'node-html-parser';
import type { JSONContent } from '@tiptap/core';

/**
 * Converts HTML string to TipTap JSON format
 * This is a basic converter that handles common HTML elements
 */
export function htmlToTiptapJson(html: string): JSONContent {
  const root = parse(html);
  
  const content: JSONContent[] = [];
  
  // Process all direct children of body or root
  const bodyElement = root.querySelector('body') || root;
  
  for (const child of bodyElement.childNodes) {
    if (child.nodeType === 1) { // Element node
      const element = child as HTMLElement;
      const converted = convertElement(element);
      if (converted) {
        content.push(converted);
      }
    }
  }
  
  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph' }],
  };
}

function convertElement(element: HTMLElement): JSONContent | null {
  const tagName = element.tagName.toLowerCase();
  
  // Handle headings
  if (tagName.match(/^h[1-6]$/)) {
    const level = parseInt(tagName[1]);
    return {
      type: 'heading',
      attrs: { level },
      content: convertInlineContent(element),
    };
  }
  
  // Handle paragraphs
  if (tagName === 'p') {
    const content = convertInlineContent(element);
    return {
      type: 'paragraph',
      content: content.length > 0 ? content : undefined,
    };
  }
  
  // Handle divs - check if it contains block or inline content
  if (tagName === 'div') {
    // Check if div contains any text directly
    let hasDirectText = false;
    for (const child of element.childNodes) {
      if (child.nodeType === 3 && child.textContent?.trim()) {
        hasDirectText = true;
        break;
      }
    }
    
    // If has direct text, treat as paragraph
    if (hasDirectText) {
      return {
        type: 'paragraph',
        content: convertInlineContent(element),
      };
    }
    
    // Otherwise, it's a container - skip it and process children
    // This will be handled by the main loop in htmlToTiptapJson
    return null;
  }
  
  // Handle unordered lists
  if (tagName === 'ul') {
    const listItems = [];
    for (const child of element.childNodes) {
      if (child.nodeType === 1 && (child as HTMLElement).tagName.toLowerCase() === 'li') {
        listItems.push({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: convertInlineContent(child as HTMLElement),
            },
          ],
        });
      }
    }
    return {
      type: 'bulletList',
      content: listItems,
    };
  }
  
  // Handle ordered lists
  if (tagName === 'ol') {
    const listItems = [];
    for (const child of element.childNodes) {
      if (child.nodeType === 1 && (child as HTMLElement).tagName.toLowerCase() === 'li') {
        listItems.push({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: convertInlineContent(child as HTMLElement),
            },
          ],
        });
      }
    }
    return {
      type: 'orderedList',
      content: listItems,
    };
  }
  
  // Handle horizontal rules
  if (tagName === 'hr') {
    return {
      type: 'horizontalRule',
    };
  }
  
  // Handle breaks
  if (tagName === 'br') {
    return {
      type: 'hardBreak',
    };
  }
  
  // For other block elements, try to extract text content
  const textContent = element.textContent?.trim();
  if (textContent) {
    return {
      type: 'paragraph',
      content: [{ type: 'text', text: textContent }],
    };
  }
  
  return null;
}

function convertInlineContent(element: HTMLElement): JSONContent[] {
  const content: JSONContent[] = [];
  
  for (const child of element.childNodes) {
    if (child.nodeType === 3) {
      // Text node
      const text = child.textContent || '';
      if (text) {
        content.push({
          type: 'text',
          text,
        });
      }
    } else if (child.nodeType === 1) {
      // Element node
      const el = child as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      
      // Handle inline formatting
      if (tagName === 'strong' || tagName === 'b') {
        const innerContent = convertInlineContent(el);
        innerContent.forEach((node) => {
          if (node.type === 'text') {
            content.push({
              ...node,
              marks: [...(node.marks || []), { type: 'bold' }],
            });
          }
        });
        continue;
      }
      
      if (tagName === 'em' || tagName === 'i') {
        const innerContent = convertInlineContent(el);
        innerContent.forEach((node) => {
          if (node.type === 'text') {
            content.push({
              ...node,
              marks: [...(node.marks || []), { type: 'italic' }],
            });
          }
        });
        continue;
      }
      
      if (tagName === 'u') {
        const innerContent = convertInlineContent(el);
        innerContent.forEach((node) => {
          if (node.type === 'text') {
            content.push({
              ...node,
              marks: [...(node.marks || []), { type: 'underline' }],
            });
          }
        });
        continue;
      }
      
      if (tagName === 'a') {
        const href = el.getAttribute('href') || '';
        const innerContent = convertInlineContent(el);
        innerContent.forEach((node) => {
          if (node.type === 'text') {
            content.push({
              ...node,
              marks: [
                ...(node.marks || []),
                {
                  type: 'link',
                  attrs: {
                    href,
                    target: el.getAttribute('target') || '_blank',
                    rel: 'noopener noreferrer nofollow',
                    class: null,
                  },
                },
              ],
            });
          }
        });
        continue;
      }
      
      if (tagName === 'br') {
        content.push({
          type: 'hardBreak',
        });
        continue;
      }
      
      // For other inline elements, just extract text
      const text = el.textContent?.trim();
      if (text) {
        content.push({
          type: 'text',
          text,
        });
      }
    }
  }
  
  return content;
}
