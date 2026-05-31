import '../scss/main.scss';
import { createIcons, Activity, Building2, CircleX, Info, LayoutDashboard, LogIn, LogOut, User, Users } from 'lucide';

// Replace all <i data-lucide="icon-name"> elements with inline SVGs.
// Add imports above as new icons appear in Twig templates.
createIcons({
  icons: { Activity, Building2, CircleX, Info, LayoutDashboard, LogIn, LogOut, User, Users },
});
