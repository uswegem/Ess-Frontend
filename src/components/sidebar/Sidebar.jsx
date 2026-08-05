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

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: EqualizerOutlined, show: () => true },
  { to: '/tenants', label: 'FSP Tenants', icon: BusinessOutlined, show: ({ isPlatformAdmin }) => isPlatformAdmin },
  { to: '/onboarding', label: 'Onboarding', icon: AddBusinessOutlined, show: ({ isPlatformAdmin }) => isPlatformAdmin },
  { to: '/users', label: 'Users', icon: PeopleOutline, show: ({ can }) => can('users:manage') },
  { to: '/products', label: 'Products', icon: ShoppingCartOutlined, show: () => true },
  { to: '/loan', label: 'Loans', icon: PaidOutlined, show: () => true },
  { to: '/notifications', label: 'Notifications', icon: RoomService, show: () => true },
  { to: '/messages/pending', label: 'Messages', icon: MessageOutlined, show: () => true },
  { to: '/messages/trigger', label: 'Trigger Message', icon: MessageOutlined, show: ({ can }) => can('messages:trigger') },
  { to: '/settings', label: 'Settings', icon: SettingsOutlined, show: ({ can, isPlatformAdmin }) => isPlatformAdmin || can('tenant:read') },
  { to: '/audit', label: 'Audit', icon: HistoryOutlined, show: ({ can }) => can('audit:read') },
];

export default function Sidebar() {
  const perms = usePermissions();

  return (
    <div className="sidebar">
      <div className="sidebarWrapper">
        {NAV_ITEMS.filter((item) => item.show(perms)).map(({ to, label, icon: Icon }) => (
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
    </div>
  );
}
