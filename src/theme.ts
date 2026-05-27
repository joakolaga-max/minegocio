export interface Theme {
  bg: string;
  bgSecondary: string;
  card: string;
  cardBorder: string;
  cardHover: string;
  header: string;
  headerBorder: string;
  bottomNav: string;
  menu: string;
  menuBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  inputBg: string;
  inputBorder: string;
  inputBorderFocus: string;
  divider: string;
  sectionBg: string;
}

export const darkTheme: Theme = {
  bg: '#0d1117',
  bgSecondary: '#111827',
  card: '#161b27',
  cardBorder: '#1e2535',
  cardHover: 'rgba(99,102,241,0.05)',
  header: 'rgba(13,17,23,0.95)',
  headerBorder: '#1e2535',
  bottomNav: 'rgba(13,17,23,0.98)',
  menu: '#1e2230',
  menuBorder: '#1e2535',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#6b7280',
  inputBg: '#1e2230',
  inputBorder: '#374151',
  inputBorderFocus: '#6366f1',
  divider: '#1e2535',
  sectionBg: '#111827',
};

export const lightTheme: Theme = {
  bg: '#f1f5f9',
  bgSecondary: '#e2e8f0',
  card: '#ffffff',
  cardBorder: '#e2e8f0',
  cardHover: 'rgba(99,102,241,0.05)',
  header: 'rgba(255,255,255,0.95)',
  headerBorder: '#e2e8f0',
  bottomNav: 'rgba(255,255,255,0.98)',
  menu: '#ffffff',
  menuBorder: '#e2e8f0',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  inputBg: '#f8fafc',
  inputBorder: '#cbd5e1',
  inputBorderFocus: '#6366f1',
  divider: '#e2e8f0',
  sectionBg: '#f8fafc',
};
