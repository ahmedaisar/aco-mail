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
  
  // Handle divs as paragraphs
  if (tagName === 'div') {
    const children: JSONContent[] = [];
    for (const child of element.childNodes) {
      if (child.nodeType === 1) {
        const converted = convertElement(child as HTMLElement);
        if (converted) {
          children.push(converted);
        }
      } else if (child.nodeType === 3 && child.textContent?.trim()) {
        // Text node in div, treat as paragraph
        return {
          type: 'paragraph',
          content: convertInlineContent(element),
        };
      }
    }
    // If div contains block elements, return them as separate nodes
    return children.length > 0 ? children[0] : null;
  }
  
  // Handle unordered lists
  if (tagName === 'ul') {
    return {
      type: 'bulletList',
      content: Array.from(element.querySelectorAll('li')).map((li) => ({
        type: 'listItem',
        content: [
          {
            type: 'paragraph',
            content: convertInlineContent(li),
          },
        ],
      })),
    };
  }
  
  // Handle ordered lists
  if (tagName === 'ol') {
    return {
      type: 'orderedList',
      content: Array.from(element.querySelectorAll('li')).map((li) => ({
        type: 'listItem',
        content: [
          {
            type: 'paragraph',
            content: convertInlineContent(li),
          },
        ],
      })),
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
      const marks: any[] = [];
      
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
