import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { isVisualCmsExcluded, visualPageName } from './visualCmsKeys.js';
import './visualCms.css';

const emptyState = { texts: {}, links: {}, images: {}, sections: {}, addedSections: [] };
const textSelector = [
  'a',
  'button',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'span',
  'li',
  '.logo',
  '.nl',
  '.dl',
  '.footer-brand',
].join(',');

const imageSelector = [
  'img',
  '[class*="img"]',
  '[class*="image"]',
  '[class*="bg"]',
  '[class*="hero"]',
  '[class*="photo"]',
].join(',');

const sectionSelector = [
  'nav.atelier-nav',
  'section',
  'footer',
  '.mbar',
  '.lkb',
  '.fbar',
  '.grid-sec',
  '.craft',
].join(',');

const parseContent = (content) => {
  if (!content) return emptyState;
  try {
    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
    return {
      ...emptyState,
      ...parsed,
      texts: parsed.texts || {},
      links: parsed.links || {},
      images: parsed.images || {},
      sections: parsed.sections || {},
      addedSections: parsed.addedSections || [],
    };
  } catch {
    return emptyState;
  }
};

const visibleText = (element) =>
  Array.from(element.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent)
    .join('')
    .trim();

const pathFor = (element, root) => {
  const parts = [];
  let current = element;
  while (current && current !== root && current.nodeType === Node.ELEMENT_NODE) {
    const parent = current.parentElement;
    if (!parent) break;
    const index = Array.from(parent.children).indexOf(current);
    const tag = current.tagName.toLowerCase();
    const classHint = String(current.className || '').split(' ').filter(Boolean).slice(0, 2).join('.');
    parts.unshift(`${tag}${classHint ? `.${classHint}` : ''}:nth(${index})`);
    current = parent;
  }
  return parts.join('>');
};

const isBlockedTextTarget = (element) =>
  element.closest('input, textarea, select, svg, .cart-drawer, .vcms-controls, .vcms-image-upload, .vcms-added-section');

function useVisualPageState(pathname, enabled) {
  const pageName = useMemo(() => visualPageName(pathname), [pathname]);
  const [state, setState] = useState(emptyState);
  const [status, setStatus] = useState('');
  const saveTimer = useRef(null);

  useEffect(() => {
    if (isVisualCmsExcluded(pathname)) return undefined;
    let active = true;
    api.get(`/content/page/${pageName}`)
      .then((response) => {
        if (active) setState(parseContent(response.data?.content));
      })
      .catch(() => {
        if (active) setState(emptyState);
      });
    return () => {
      active = false;
    };
  }, [pageName, pathname]);

  const persist = (next) => {
    setState(next);
    if (!enabled) return;
    setStatus('Saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await api.put(`/content/page/${pageName}`, { content: JSON.stringify(next, null, 2) });
        setStatus('Saved');
      } catch {
        setStatus('Could not save');
      }
    }, 250);
  };

  return { state, setState: persist, status };
}

export default function VisualCmsRuntime({ children, admin = false, previewPath }) {
  const location = useLocation();
  const pathname = previewPath || location.pathname;
  const rootRef = useRef(null);
  const navigate = useNavigate();
  const enabled = admin && !isVisualCmsExcluded(pathname);
  const { state, setState, status } = useVisualPageState(pathname, enabled);

  const patchState = (recipe) => {
    setState(recipe(state));
  };

  const uploadImage = async (key, file, element) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const response = await api.post('/content/upload', { image: reader.result });
        patchState((current) => ({
          ...current,
          images: { ...current.images, [key]: response.data.url },
        }));
        applyImage(element, response.data.url);
      } catch {
        // Status is set by the next save attempt; keep the preview unchanged on upload failure.
      }
    };
    reader.readAsDataURL(file);
  };

  const applyImage = (element, url) => {
    if (!url) return;
    if (element.tagName === 'IMG') {
      element.setAttribute('src', url);
      return;
    }
    element.style.backgroundImage = `url("${url}")`;
    element.style.backgroundSize = 'cover';
    element.style.backgroundPosition = 'center';
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root || isVisualCmsExcluded(pathname)) return undefined;

    root.querySelectorAll('[data-vcms-id], [data-vcms-section], .vcms-image-upload, .vcms-controls').forEach((node) => {
      if (node.classList?.contains('vcms-image-upload') || node.classList?.contains('vcms-controls')) node.remove();
      else {
        node.removeAttribute('contenteditable');
        node.classList.remove('vcms-editable-text', 'vcms-editable-image', 'vcms-editable-section', 'vcms-hidden-section');
      }
    });

    root.querySelectorAll(sectionSelector).forEach((section) => {
      if (section.closest('.cart-drawer, .vcms-added-section')) return;
      const key = pathFor(section, root);
      const sectionState = state.sections[key] || {};
      section.dataset.vcmsSection = key;
      section.style.order = sectionState.order ?? '';
      section.classList.toggle('vcms-hidden-section', Boolean(sectionState.hidden));
      if (!enabled) return;
      section.classList.add('vcms-editable-section');
      const controls = document.createElement('div');
      controls.className = 'vcms-controls';
      controls.innerHTML = '<button type="button" data-act="up">Up</button><button type="button" data-act="down">Down</button><button type="button" data-act="hide">Remove</button>';
      controls.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const action = event.target?.dataset?.act;
        patchState((current) => {
          const previous = current.sections[key] || {};
          const order = Number(previous.order || 0);
          const next = { ...previous };
          if (action === 'hide') next.hidden = true;
          if (action === 'up') next.order = order - 1;
          if (action === 'down') next.order = order + 1;
          return { ...current, sections: { ...current.sections, [key]: next } };
        });
      });
      section.appendChild(controls);
    });

    const sectionGroups = new Map();
    root.querySelectorAll('[data-vcms-section]').forEach((section, index) => {
      const parent = section.parentElement;
      if (!parent) return;
      if (!sectionGroups.has(parent)) sectionGroups.set(parent, []);
      sectionGroups.get(parent).push({ section, index });
    });
    sectionGroups.forEach((items) => {
      items
        .sort((a, b) => {
          const aState = state.sections[a.section.dataset.vcmsSection] || {};
          const bState = state.sections[b.section.dataset.vcmsSection] || {};
          return Number(aState.order || 0) - Number(bState.order || 0) || a.index - b.index;
        })
        .forEach(({ section }) => section.parentElement.appendChild(section));
    });

    root.querySelectorAll(textSelector).forEach((element) => {
      if (isBlockedTextTarget(element)) return;
      const text = visibleText(element);
      if (!text) return;
      const key = pathFor(element, root);
      element.dataset.vcmsId = key;
      if (state.texts[key] !== undefined) {
        Array.from(element.childNodes).find((node) => node.nodeType === Node.TEXT_NODE).textContent = state.texts[key];
      }
      if (element.tagName === 'A' && state.links[key]) {
        element.setAttribute('href', state.links[key]);
      }
      if (!enabled) return;
      element.contentEditable = 'true';
      element.spellcheck = false;
      element.classList.add('vcms-editable-text');
      element.onclick = preventAdminNavigation;
      element.ondblclick = (event) => {
        const link = event.currentTarget.closest('a');
        if (!link) return;
        event.preventDefault();
        const nextHref = window.prompt('Edit link target', link.getAttribute('href') || '');
        if (nextHref === null) return;
        link.setAttribute('href', nextHref);
        patchState((current) => ({
          ...current,
          links: { ...current.links, [key]: nextHref },
        }));
      };
      element.onblur = () => {
        const nextText = visibleText(element);
        patchState((current) => ({
          ...current,
          texts: { ...current.texts, [key]: nextText },
        }));
      };
    });

    root.querySelectorAll(imageSelector).forEach((element) => {
      if (element.closest('.cart-drawer, .vcms-controls, .vcms-added-section')) return;
      const rect = element.getBoundingClientRect();
      if (rect.width < 48 || rect.height < 48) return;
      const key = pathFor(element, root);
      if (state.images[key]) applyImage(element, state.images[key]);
      if (!enabled) return;
      element.classList.add('vcms-editable-image');
      if (getComputedStyle(element).position === 'static') element.style.position = 'relative';
      const label = document.createElement('label');
      label.className = 'vcms-image-upload';
      label.innerHTML = 'Change Image<input type="file" accept="image/*" />';
      label.querySelector('input').addEventListener('change', (event) => {
        const file = event.target.files?.[0];
        if (file) uploadImage(key, file, element);
        event.target.value = '';
      });
      element.appendChild(label);
    });

    return () => {
      root.querySelectorAll('[contenteditable="true"]').forEach((element) => {
        element.onclick = null;
        element.ondblclick = null;
        element.onblur = null;
      });
    };
  }, [state, enabled, pathname]);

  const addSection = () => {
    patchState((current) => ({
      ...current,
      addedSections: [
        ...(current.addedSections || []),
        { id: Date.now().toString(16), eyebrow: 'New Section', title: 'Edit this section', body: 'Click this copy to edit it visually.' },
      ],
    }));
  };

  const updateAddedSection = (id, field, value) => {
    patchState((current) => ({
      ...current,
      addedSections: current.addedSections.map((section) =>
        section.id === id ? { ...section, [field]: value } : section
      ),
    }));
  };

  return (
    <div className={enabled ? 'vcms-runtime is-admin' : 'vcms-runtime'} ref={rootRef}>
      {children}
      {(state.addedSections || []).map((section) => (
        <section className="vcms-added-section" key={section.id}>
          <div
            className="vcms-added-eyebrow vcms-editable-text"
            contentEditable={enabled}
            suppressContentEditableWarning
            onBlur={(event) => updateAddedSection(section.id, 'eyebrow', event.currentTarget.innerText)}
          >
            {section.eyebrow}
          </div>
          <h2
            className="vcms-added-title vcms-editable-text"
            contentEditable={enabled}
            suppressContentEditableWarning
            onBlur={(event) => updateAddedSection(section.id, 'title', event.currentTarget.innerText)}
          >
            {section.title}
          </h2>
          <p
            className="vcms-added-body vcms-editable-text"
            contentEditable={enabled}
            suppressContentEditableWarning
            onBlur={(event) => updateAddedSection(section.id, 'body', event.currentTarget.innerText)}
          >
            {section.body}
          </p>
        </section>
      ))}
      {enabled && (
        <div className="vcms-floating">
          <button type="button" onClick={addSection}>Add Section</button>
          <span>{status || 'Visual editor'}</span>
        </div>
      )}
    </div>
  );
}

function preventAdminNavigation(event) {
  const interactive = event.currentTarget.closest('a, button');
  if (interactive) event.preventDefault();
}
