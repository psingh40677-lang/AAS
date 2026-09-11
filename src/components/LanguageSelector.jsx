import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe2, Search, X } from 'lucide-react';
import { useLanguage } from '../i18n';

export default function LanguageSelector({ compact = false }) {
  const { language, languages, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  const filteredLanguages = languages.filter((item) =>
    `${item.english} ${item.native}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())
  );

  useEffect(() => {
    if (!open) return undefined;
    inputRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const handlePointerDown = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open]);

  const chooseLanguage = (code) => {
    setLanguage(code);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className={`language-selector ${compact ? 'language-selector-compact' : ''}`} ref={panelRef}>
      <button
        className="language-trigger"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Globe2 size={18} aria-hidden="true" />
        <span>{t('language')}</span>
        <b>{language.native}</b>
        <ChevronDown size={15} aria-hidden="true" className={open ? 'language-chevron-open' : ''} />
      </button>

      {open && (
        <div className="language-panel" role="dialog" aria-label={t('selectLanguage')}>
          <div className="language-panel-head">
            <div>
              <strong>{t('selectLanguage')}</strong>
              <span>{languages.length} languages available</span>
            </div>
            <button type="button" className="language-close" onClick={() => setOpen(false)} aria-label={t('close')}>
              <X size={18} />
            </button>
          </div>
          <label className="language-search">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">{t('searchLanguage')}</span>
            <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchLanguage')} />
          </label>
          <div className="language-list" role="listbox" aria-label={t('selectLanguage')}>
            {filteredLanguages.map((item) => (
              <button
                key={item.code}
                type="button"
                role="option"
                aria-selected={language.code === item.code}
                className={`language-option ${language.code === item.code ? 'selected' : ''}`}
                onClick={() => chooseLanguage(item.code)}
              >
                <span><strong>{item.english}</strong><span>{item.native}</span></span>
                {language.code === item.code && <Check size={19} aria-label="Selected" />}
              </button>
            ))}
            {!filteredLanguages.length && <p className="language-empty">No language found</p>}
          </div>
        </div>
      )}
    </div>
  );
}
