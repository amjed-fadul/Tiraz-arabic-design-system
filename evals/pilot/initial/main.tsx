import { createRoot } from 'react-dom/client';
import { SystemProvider, ToastProvider, defaultConfig } from './design library/src/system';
import './design library/styles.css';
import { Pilot } from './Pilot';
const query = new URLSearchParams(location.search);
const language = query.get('lang') === 'en' ? 'en' : 'ar';
const direction = query.get('dir') === 'ltr' ? 'ltr' : 'rtl';
const theme = query.get('theme') === 'dark' ? 'dark' : 'light';
document.documentElement.lang = language;
createRoot(document.getElementById('root')!).render(
  <SystemProvider config={{ ...defaultConfig, direction, theme, reducedMotion: true }}>
    <ToastProvider label={language === 'ar' ? 'الإشعارات' : 'Notifications'} closeLabel={language === 'ar' ? 'إغلاق الإشعار' : 'Dismiss notification'}>
      <Pilot language={language} />
    </ToastProvider>
  </SystemProvider>
);
