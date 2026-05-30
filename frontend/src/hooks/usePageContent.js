import { useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';
import { pageContentDefaults, parsePageContent } from '../content/pageContentDefaults.js';

export default function usePageContent(pageName) {
  const fallback = pageContentDefaults[pageName] || {};
  const [content, setContent] = useState(fallback);

  useEffect(() => {
    let active = true;

    api.get(`/content/page/${pageName}`)
      .then((response) => {
        if (active) setContent(parsePageContent(response.data?.content, fallback));
      })
      .catch(() => {
        if (active) setContent(fallback);
      });

    return () => {
      active = false;
    };
  }, [pageName]);

  return useMemo(() => content, [content]);
}

export const lines = (value) => String(value || '').split('\n');
