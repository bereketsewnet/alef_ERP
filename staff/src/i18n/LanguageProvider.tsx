import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { amharic, translateStatic, type StaffLanguage } from "./translations";

type LanguageContextValue = {
  language: StaffLanguage;
  setLanguage: (language: StaffLanguage) => void;
  toggleLanguage: () => void;
  t: (text: string) => string;
};
const LanguageContext = createContext<LanguageContextValue | null>(null);
const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const attributes = ["placeholder", "title", "aria-label"];

function translateTree(root: Node, language: StaffLanguage) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node as Text,
      parent = text.parentElement;
    if (
      !parent ||
      parent.closest('[data-i18n-dynamic="true"]') ||
      ["SCRIPT", "STYLE"].includes(parent.tagName)
    )
      continue;
    if (!originalText.has(text)) originalText.set(text, text.data);
    const original = originalText.get(text)!,
      trimmed = original.trim();
    if (!trimmed) continue;
    const translated = translateStatic(trimmed, language);
    text.data = original.replace(trimmed, translated);
  }
  if (root instanceof Element) {
    const elements = [root, ...Array.from(root.querySelectorAll("*"))];
    for (const el of elements) {
      if (el.closest('[data-i18n-dynamic="true"]')) continue;
      let saved = originalAttributes.get(el);
      if (!saved) {
        saved = new Map();
        originalAttributes.set(el, saved);
      }
      for (const attr of attributes) {
        const value = el.getAttribute(attr);
        if (value !== null && !saved.has(attr)) saved.set(attr, value);
        const original = saved.get(attr);
        if (original)
          el.setAttribute(attr, translateStatic(original, language));
      }
    }
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<StaffLanguage>(() =>
    localStorage.getItem("alef-staff-language") === "am" ? "am" : "en",
  );
  const setLanguage = (next: StaffLanguage) => {
    localStorage.setItem("alef-staff-language", next);
    setLanguageState(next);
  };
  useEffect(() => {
    document.documentElement.lang = language === "am" ? "am" : "en";
    document.documentElement.dir = "ltr";
  }, [language]);
  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage(language === "en" ? "am" : "en"),
      t: (text: string) => translateStatic(text, language),
    }),
    [language],
  );
  return (
    <LanguageContext.Provider value={value}>
      <StaticUiTranslator language={language} />
      {children}
    </LanguageContext.Provider>
  );
}

function StaticUiTranslator({ language }: { language: StaffLanguage }) {
  useLayoutEffect(() => {
    let applying = false;
    const apply = (root: Node) => {
      if (applying) return;
      applying = true;
      observer.disconnect();
      translateTree(root, language);
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: attributes,
      });
      applying = false;
    };
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "childList") record.addedNodes.forEach(apply);
        else {
          // React can reuse a node when replacing a static loading label with
          // API data. Refresh the source so user/database content is preserved.
          if (record.type === "characterData")
            originalText.delete(record.target as Text);
          if (record.type === "attributes" && record.attributeName)
            originalAttributes
              .get(record.target as Element)
              ?.delete(record.attributeName);
          apply(record.target);
        }
      }
    });
    apply(document.body);
    return () => observer.disconnect();
  }, [language]);
  return null;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value)
    throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}

export const staticTranslationCount = Object.keys(amharic).length;
