import React from 'react';
import parse, { attributesToProps } from 'html-react-parser';
import dimensions from './content/image-dimensions.json';

export function ContentImage({ src, alt = '', loading = 'lazy', ...props }) {
  return <img {...props} {...dimensions[src]} src={src} alt={alt} loading={loading} decoding="async" />;
}

// Only repository-owned editorial HTML is parsed here, never user-submitted HTML.
export function parseContent(content, isCase = false) {
  return parse(content, { replace(node) {
    if (node.name !== 'img') return;
    const props = attributesToProps(node.attribs);
    const src = new URL(props.src, isCase ? 'https://portfolio.local/cases/' : 'https://portfolio.local/').pathname;
    const isCover = props.className?.split(' ').includes('case-cover');
    return <ContentImage {...props} src={src} loading={isCover ? 'eager' : 'lazy'} fetchPriority={isCover ? 'high' : undefined} />;
  } });
}
