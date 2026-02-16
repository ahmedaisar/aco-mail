import { describe, it, expect } from 'vitest';
import { htmlToTiptapJson } from './html-to-tiptap';

describe('htmlToTiptapJson', () => {
  it('should convert simple paragraph to TipTap JSON', () => {
    const html = '<p>Hello world</p>';
    const result = htmlToTiptapJson(html);
    
    expect(result.type).toBe('doc');
    expect(result.content).toHaveLength(1);
    expect(result.content?.[0].type).toBe('paragraph');
  });

  it('should convert heading to TipTap JSON', () => {
    const html = '<h1>Title</h1>';
    const result = htmlToTiptapJson(html);
    
    expect(result.type).toBe('doc');
    expect(result.content).toHaveLength(1);
    expect(result.content?.[0].type).toBe('heading');
    expect(result.content?.[0].attrs?.level).toBe(1);
  });

  it('should convert bold text to marked text', () => {
    const html = '<p>This is <strong>bold</strong> text</p>';
    const result = htmlToTiptapJson(html);
    
    const paragraph = result.content?.[0];
    expect(paragraph?.type).toBe('paragraph');
    expect(paragraph?.content).toHaveLength(3);
    
    const boldText = paragraph?.content?.[1];
    expect(boldText?.type).toBe('text');
    expect(boldText?.marks).toHaveLength(1);
    expect(boldText?.marks?.[0].type).toBe('bold');
  });

  it('should convert links to marked text', () => {
    const html = '<p>Visit <a href="https://example.com">example</a></p>';
    const result = htmlToTiptapJson(html);
    
    const paragraph = result.content?.[0];
    const linkText = paragraph?.content?.[1];
    
    expect(linkText?.type).toBe('text');
    expect(linkText?.marks).toHaveLength(1);
    expect(linkText?.marks?.[0].type).toBe('link');
    expect(linkText?.marks?.[0].attrs?.href).toBe('https://example.com');
  });

  it('should convert unordered lists', () => {
    const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    const result = htmlToTiptapJson(html);
    
    const list = result.content?.[0];
    expect(list?.type).toBe('bulletList');
    expect(list?.content).toHaveLength(2);
    expect(list?.content?.[0].type).toBe('listItem');
  });

  it('should convert ordered lists', () => {
    const html = '<ol><li>First</li><li>Second</li></ol>';
    const result = htmlToTiptapJson(html);
    
    const list = result.content?.[0];
    expect(list?.type).toBe('orderedList');
    expect(list?.content).toHaveLength(2);
  });

  it('should handle empty HTML', () => {
    const html = '';
    const result = htmlToTiptapJson(html);
    
    expect(result.type).toBe('doc');
    expect(result.content).toHaveLength(1);
    expect(result.content?.[0].type).toBe('paragraph');
  });

  it('should handle complex nested formatting', () => {
    const html = '<p>Text with <strong>bold</strong> and <em>italic</em> and <strong><em>both</em></strong></p>';
    const result = htmlToTiptapJson(html);
    
    const paragraph = result.content?.[0];
    expect(paragraph?.type).toBe('paragraph');
    expect(paragraph?.content).toBeDefined();
  });
});
