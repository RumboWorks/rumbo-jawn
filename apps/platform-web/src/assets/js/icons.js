// Lucide icon initialization. Shared so dynamically inserted markup (e.g. an
// inline-edit row swapped in after an AJAX save) can re-render its icons by
// calling initIcons() again — createIcons only processes remaining
// <i data-lucide> elements, so re-running it is idempotent.
import {
  createIcons,
  Activity, AlertTriangle, ArrowLeftRight, AudioLines, Award, Boxes, Braces, Brain, Building2, CheckCircle2,
  CircleAlert, CircleX, ClipboardCheck, ClipboardList, Clock, Copy, Cpu, FileText, Globe, Info,
  BarChart3, Filter, Handshake, KeyRound, LayoutDashboard, ListChecks, Loader, LogIn, LogOut,
  Mic2, PanelLeft, Pencil, Plus, Save, SlidersHorizontal, Sparkles, Tag, Trash2, Trophy, User, Users, X, XCircle,
} from 'lucide';

const ICONS = {
  Activity, AlertTriangle, ArrowLeftRight, AudioLines, Award, Boxes, Braces, Brain, Building2, CheckCircle2,
  CircleAlert, CircleX, ClipboardCheck, ClipboardList, Clock, Copy, Cpu, FileText, Globe, Info,
  BarChart3, Filter, Handshake, KeyRound, LayoutDashboard, ListChecks, Loader, LogIn, LogOut,
  Mic2, PanelLeft, Pencil, Plus, Save, SlidersHorizontal, Sparkles, Tag, Trash2, Trophy, User, Users, X, XCircle,
};

export function initIcons() {
  createIcons({ icons: ICONS });
}
