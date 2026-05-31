import '../scss/main.scss';
import { createIcons, Activity, Building2, CircleX, Info, LayoutDashboard, LogIn, LogOut, User, Users } from 'lucide';

// ---- Icons ----
// Add named imports above as new icons appear in Twig templates.
createIcons({
  icons: { Activity, Building2, CircleX, Info, LayoutDashboard, LogIn, LogOut, User, Users },
});

// ---- Theme switcher ----
// Theme is applied before paint via inline script in <head>.
// This wires the <select> to update data-theme and persist the choice.
const select = document.getElementById('rj-theme-select');
if (select) {
  const current = document.documentElement.getAttribute('data-theme') || 'rumboworks';
  select.value = current;

  select.addEventListener('change', () => {
    const theme = select.value;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rj-theme', theme);
    // Sync any other switchers on the page
    document.querySelectorAll('#rj-theme-select').forEach(el => { el.value = theme; });
  });
}
