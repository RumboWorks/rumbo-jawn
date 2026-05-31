import '../scss/main.scss';
import {
  createIcons,
  Activity, AlertTriangle, Brain, Building2, CheckCircle2,
  CircleX, Clock, Copy, FileText, Globe, Info,
  LayoutDashboard, Loader, LogIn, LogOut,
  Mic2, Pencil, Plus, Sparkles, Tag, User, Users, XCircle,
} from 'lucide';

// Replace all <i data-lucide="icon-name"> elements with inline SVGs.
// Add named imports above as new icons appear in Twig templates.
createIcons({
  icons: {
    Activity, AlertTriangle, Brain, Building2, CheckCircle2,
    CircleX, Clock, Copy, FileText, Globe, Info,
    LayoutDashboard, Loader, LogIn, LogOut,
    Mic2, Pencil, Plus, Sparkles, Tag, User, Users, XCircle,
  },
});

// ---- Theme switcher ----
const select = document.getElementById('rj-theme-select');
if (select) {
  const current = document.documentElement.getAttribute('data-theme') || 'rumboworks';
  select.value = current;

  select.addEventListener('change', () => {
    const theme = select.value;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rj-theme', theme);
    document.querySelectorAll('#rj-theme-select').forEach(el => { el.value = theme; });
  });
}
