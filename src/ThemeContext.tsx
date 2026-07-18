import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme, darkTheme, lightTheme } from './theme';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  customColors: Partial<Theme>;
  setCustomColor: (key: keyof Theme, value: string) => void;
  saveCustomColors: (colors: Partial<Theme>) => void;
  resetCustomColors: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: darkTheme,
  isDark: true,
  toggleTheme: () => {},
  customColors: {},
  setCustomColor: () => {},
  saveCustomColors: () => {},
  resetCustomColors: () => {},
});

const customKey = (isDark: boolean) => `mn_custom_colors_${isDark ? 'dark' : 'light'}`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('mn_theme') !== 'light'; } catch { return true; }
  });

  const [customColors, setCustomColors] = useState<Partial<Theme>>(() => {
    try {
      const raw = localStorage.getItem(customKey(localStorage.getItem('mn_theme') !== 'light'));
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(customKey(isDark));
      setCustomColors(raw ? JSON.parse(raw) : {});
    } catch { setCustomColors({}); }
  }, [isDark]);

  const theme: Theme = { ...(isDark ? darkTheme : lightTheme), ...customColors };

  const toggleTheme = () => {
    setIsDark(v => {
      const next = !v;
      try { localStorage.setItem('mn_theme', next ? 'dark' : 'light'); } catch {}
      return next;
    });
  };

  const setCustomColor = (key: keyof Theme, value: string) => {
    setCustomColors(prev => ({ ...prev, [key]: value }));
  };

  const saveCustomColors = (colors: Partial<Theme>) => {
    setCustomColors(colors);
    try { localStorage.setItem(customKey(isDark), JSON.stringify(colors)); } catch {}
  };

  const resetCustomColors = () => {
    setCustomColors({});
    try { localStorage.removeItem(customKey(isDark)); } catch {}
  };

  // Inject CSS variables for inputs/global styles
  useEffect(() => {
    const t = theme;
    document.body.style.background = t.bg;
    document.body.style.color = t.text;
    // Patch global input styles
    let style = document.getElementById('mn-theme-style') as HTMLStyleElement;
    if (!style) {
      style = document.createElement('style');
      style.id = 'mn-theme-style';
      document.head.appendChild(style);
    }
    style.textContent = `
      .input-field, input[type="text"], input[type="email"], input[type="password"],
      input[type="number"], input[type="search"], input[type="tel"], textarea, select {
        background: ${t.inputBg} !important;
        color: ${t.text} !important;
        -webkit-text-fill-color: ${t.text} !important;
        caret-color: ${t.text} !important;
        border-color: ${t.inputBorder} !important;
      }
      .input-field:focus, input:focus, textarea:focus,
      .input-field:active, input:active, textarea:active {
        border-color: ${t.inputBorderFocus} !important;
        background: ${t.inputBg} !important;
        color: ${t.text} !important;
        -webkit-text-fill-color: ${t.text} !important;
        caret-color: ${t.text} !important;
        outline: none !important;
      }
      input:-webkit-autofill, input:-webkit-autofill:hover,
      input:-webkit-autofill:focus, input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 9999px ${t.inputBg} inset !important;
        -webkit-text-fill-color: ${t.text} !important;
        caret-color: ${t.text} !important;
      }
      input::placeholder, textarea::placeholder { 
        color: ${t.textMuted} !important; 
        opacity: 1 !important; 
      }
      input:focus::placeholder, textarea:focus::placeholder {
        color: ${t.textMuted} !important;
        opacity: 0.6 !important;
      }
      .card {
        background: ${t.card} !important;
        border-color: ${t.cardBorder} !important;
      }
      .section-title { color: ${t.text} !important; }
      .btn-ghost {
        border-color: ${t.inputBorder} !important;
        color: ${t.textSecondary} !important;
      }
      * { color: inherit; }
      body { color: ${t.text}; }
    `;
  }, [isDark, customColors]);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, customColors, setCustomColor, saveCustomColors, resetCustomColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
