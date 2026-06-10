import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, BarChart3, Brain } from 'lucide-react';

export default function Sidebar() {
  const links = [
    { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Priority Issues', path: '/dashboard/priority', icon: <AlertTriangle className="w-5 h-5" /> },
    { name: 'Analytics', path: '/dashboard/analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { name: 'AI Predictions', path: '/dashboard/ai', icon: <Brain className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-full flex flex-col hidden md:flex">
      <div className="p-6">
        <h2 className="text-lg font-heading font-bold text-primary">Control Panel</h2>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive ? 'bg-primary/10 text-primary font-medium' : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            {link.icon}
            {link.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
