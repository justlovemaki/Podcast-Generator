'use client';

import { useState, useEffect } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    async function processMarkdown() {
      const processedContent = await unified()
        .use(remarkParse)
        .use(remarkHtml)
        .process(content);
      setHtmlContent(processedContent.toString());
    }
    processMarkdown();
  }, [content]);

  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}