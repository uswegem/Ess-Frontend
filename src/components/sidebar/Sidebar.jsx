import './sidebar.css';
import { NavLink } from 'react-router-dom';
import {
  EqualizerOutlined,
  PeopleOutline,
  RoomService,
  MessageOutlined,
  BusinessOutlined,
  SettingsOutlined,
  HistoryOutlined,
  AddBusinessOutlined,
  PaidOutlined,
  ShoppingCartOutlined,
} from '@mui/icons-material';
import { usePermissions } from '../../hooks/usePermissions';

// Same items/routes/permission-gating as before - only regrouped under section labels for
// display (design-handoff's "Sidebar nav — grouped under section labels" grouping). No
// functional change: `to`/`show` per item are byte-identical to the previous flat NAV_ITEMS.
const NAV_GROUPS = [
  {
    section: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: EqualizerOutlined, show: () => true },
    ],
  },
  {
    section: 'Operations',
    items: [
      { to: '/tenants', label: 'FSP Tenants', icon: BusinessOutlined, show: ({ isPlatformAdmin }) => isPlatformAdmin },
      { to: '/onboarding', label: 'Onboarding', icon: AddBusinessOutlined, show: ({ isPlatformAdmin }) => isPlatformAdmin },
      { to: '/products', label: 'Products', icon: ShoppingCartOutlined, show: () => true },
      { to: '/loan', label: 'Loans', icon: PaidOutlined, show: () => true },
      { to: '/users', label: 'Users', icon: PeopleOutline, show: ({ can }) => can('users:manage') },
    ],
  },
  {
    section: 'Communications',
    items: [
      { to: '/messages/pending', label: 'Messages', icon: MessageOutlined, show: () => true },
      { to: '/messages/trigger', label: 'Trigger Message', icon: MessageOutlined, show: ({ can }) => can('messages:trigger') },
      { to: '/notifications', label: 'Notifications', icon: RoomService, show: () => true },
    ],
  },
  {
    section: 'System',
    items: [
      { to: '/settings', label: 'Settings', icon: SettingsOutlined, show: ({ can, isPlatformAdmin }) => isPlatformAdmin || can('tenant:read') },
      { to: '/audit', label: 'Audit', icon: HistoryOutlined, show: ({ can }) => can('audit:read') },
    ],
  },
];

export default function Sidebar() {
  const perms = usePermissions();

  return (
    <div className="sidebar">
      <div className="sidebarWrapper">
        {NAV_GROUPS.map(({ section, items }) => {
          const visibleItems = items.filter((item) => item.show(perms));
          if (visibleItems.length === 0) return null; // whole section hidden if nothing in it is visible
          return (
            <div className="sidebarGroup" key={section}>
              <div className="sidebarGroupLabel">{section}</div>
              {visibleItems.map(({ to, label, icon: Icon }) => (
                <div className="sidebarMenu" key={to}>
                  <NavLink to={to}>
                    <div className="sidebarSelect">
                      <div className="sidebarSelectHead">
                        <Icon className="icon" />
                        <span>{label}</span>
                      </div>
                    </div>
                  </NavLink>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
