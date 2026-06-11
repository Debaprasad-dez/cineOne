import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSettingsStore } from '@/stores/settingsStore';

interface NavItem {
  to: string;
  label: string;
  icon: JSX.Element;
}

const baseItems: NavItem[] = [
  {
    to: '/',
    label: 'Home',
    icon: (
      <path d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
    ),
  },
  {
    to: '/discover',
    label: 'Discover',
    icon: <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m14.5-6.5-1.4 1.4M7.9 16.1l-1.4 1.4m11.6 0-1.4-1.4M7.9 7.9 6.5 6.5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />,
  },
  {
    to: '/galaxy',
    label: 'Galaxy',
    icon: <path d="M12 3a9 9 0 1 0 9 9m-9-9c4 4 4 14 0 18m0-18C8 7 8 17 12 21m-9-9h18" />,
  },
  {
    to: '/search',
    label: 'Search',
    icon: <path d="m21 21-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />,
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: <path d="M5 20a7 7 0 0 1 14 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />,
  },
];

const compatItem: NavItem = {
  to: '/compatibility',
  label: 'Compatibility',
  icon: <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z" />,
};

const questsItem: NavItem = {
  to: '/quests',
  label: 'Quests',
  icon: <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Zm-2 9 1.5 1.5L15 9" />,
};

const settingsItem: NavItem = {
  to: '/settings',
  label: 'Settings',
  icon: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3a8 8 0 0 0-.2-1.8l2-1.5-2-3.4-2.3 1a8 8 0 0 0-3-1.8L14 1h-4l-.5 2.7a8 8 0 0 0-3 1.8l-2.3-1-2 3.4 2 1.5A8 8 0 0 0 4 12c0 .6 0 1.2.2 1.8l-2 1.5 2 3.4 2.3-1a8 8 0 0 0 3 1.8L10 23h4l.5-2.7a8 8 0 0 0 3-1.8l2.3 1 2-3.4-2-1.5c.1-.6.2-1.2.2-1.8Z" />,
};

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const flags = useSettingsStore((s) => s.flags);

  const items: NavItem[] = [
    ...baseItems,
    ...(flags.quests ? [questsItem] : []),
    ...(flags.friendCompat ? [compatItem] : []),
    settingsItem,
  ];

  return (
    <motion.aside
      onHoverStart={() => setExpanded(true)}
      onHoverEnd={() => setExpanded(false)}
      animate={{ width: expanded ? 240 : 72 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className="fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-glass bg-void-2/70 py-6 backdrop-blur-glass md:flex"
    >
      <div className="mb-10 flex items-center gap-3 px-5">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="CinemaOne" className="h-9 w-9 shrink-0 object-contain" />
        {expanded && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="whitespace-nowrap font-ui text-xl font-bold tracking-tight text-text-primary"
          >
            Cinema<span className="text-accent-violet">One</span>
          </motion.span>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            data-hoverable
            className={({ isActive }) =>
              `group relative flex items-center gap-4 rounded-xl px-3 py-3 transition-colors ${
                isActive
                  ? 'bg-surface-2 text-text-primary'
                  : 'text-text-muted hover:text-text-primary'
              }`
            }
          >
            <motion.svg
              whileHover={{ scale: 1.15 }}
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              {it.icon}
            </motion.svg>
            {expanded && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="whitespace-nowrap font-ui text-sm"
              >
                {it.label}
              </motion.span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3">
        <NavLink
          to="/profile"
          data-hoverable
          className="flex items-center gap-3 rounded-xl px-2 py-2 text-text-muted hover:text-text-primary"
        >
          <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-accent-violet to-accent-crimson" />
          {expanded && <span className="font-ui text-sm">You</span>}
        </NavLink>
      </div>
    </motion.aside>
  );
}
