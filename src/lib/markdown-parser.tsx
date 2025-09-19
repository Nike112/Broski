import React from 'react';

// Simple markdown parser for basic formatting
export function parseMarkdown(text: string): string {
  if (!text) return '';
  
  let html = text;
  
  // Convert **bold** to <strong>bold</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert *italic* to <em>italic</em>
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert line breaks to <br> tags
  html = html.replace(/\n/g, '<br>');
  
  // Convert bullet points
  html = html.replace(/^•\s+(.*)$/gm, '• $1');
  
  return html;
}

// React component for rendering parsed markdown
export function MarkdownText({ content }: { content: string }) {
  const html = parseMarkdown(content);
  
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: html }}
      className="markdown-content prose dark:prose-invert max-w-none"
      style={{
        lineHeight: '1.6',
      }}
    />
  );
}
