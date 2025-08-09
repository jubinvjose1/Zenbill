import React from 'react';
import { View, User } from '../types';
import { DashboardIcon, StockIcon, NewSaleIcon, HistoryIcon, LogoutIcon, SettingsIcon, ZenBillLogo, ActivityLogIcon, UserIcon, SupportIcon } from './icons';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  currentUser: User;
}

const NavItem = ({ icon, label, isActive, onClick }: { icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }) => (
  <li
    onClick={onClick}
    className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors ${
      isActive
        ? 'bg-primary-light text-primary-dark font-bold'
        : 'text-on-surface-secondary hover:bg-gray-200'
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onLogout, currentUser }) => {
  const iconClass = 'w-6 h-6';
  const { role, shopName, name, shopLogo } = currentUser;

  if (role === 'SuperAdmin') {
    return (
        <aside className="w-64 bg-surface h-screen flex flex-col p-4 shadow-lg fixed">
            <div className="mb-10 flex items-center justify-center h-16">
                <ZenBillLogo className="h-10 w-auto" />
            </div>
            <nav className="flex-grow">
                <ul>
                    <NavItem
                        icon={<UserIcon className={iconClass} />}
                        label="Customers"
                        isActive={currentView === View.SUPER_ADMIN_DASHBOARD}
                        onClick={() => onNavigate(View.SUPER_ADMIN_DASHBOARD)}
                    />
                    <NavItem
                        icon={<SupportIcon className={iconClass} />}
                        label="Support Tickets"
                        isActive={currentView === View.SUPER_ADMIN_SUPPORT}
                        onClick={() => onNavigate(View.SUPER_ADMIN_SUPPORT)}
                    />
                     <NavItem
                        icon={<ActivityLogIcon className={iconClass} />}
                        label="Activity Log"
                        isActive={currentView === View.SUPER_ADMIN_ACTIVITY_LOG}
                        onClick={() => onNavigate(View.SUPER_ADMIN_ACTIVITY_LOG)}
                    />
                </ul>
            </nav>
            <div className="mt-auto">
                <div className="p-3 mb-2 rounded-lg bg-gray-100">
                    <p className="text-sm font-semibold text-on-surface">{name}</p>
                    <p className="text-xs text-on-surface-secondary">{role}</p>
                </div>
                <NavItem
                    icon={<LogoutIcon className="w-6 h-6" />}
                    label="Logout"
                    isActive={false}
                    onClick={onLogout}
                />
            </div>
        </aside>
    );
  }

  return (
    <aside className="w-64 bg-surface h-screen flex flex-col p-4 shadow-lg fixed">
      <div className="mb-10 flex items-center justify-center h-16">
        {shopLogo ? (
            <img src={shopLogo} alt={`${shopName} Logo`} className="max-h-full max-w-full object-contain" />
        ) : (
            <ZenBillLogo className="h-10 w-auto" />
        )}
      </div>
      <nav className="flex-grow">
        <ul>
          {role === 'Admin' &&
            <NavItem
              icon={<DashboardIcon className={iconClass} />}
              label="Dashboard"
              isActive={currentView === View.DASHBOARD}
              onClick={() => onNavigate(View.DASHBOARD)}
            />
          }
          {(role === 'Admin' || role === 'Accountant') &&
            <NavItem
              icon={<StockIcon className={iconClass} />}
              label="Stock Management"
              isActive={currentView === View.STOCK}
              onClick={() => onNavigate(View.STOCK)}
            />
          }
          {(role === 'Admin' || role === 'Cashier') &&
            <NavItem
              icon={<NewSaleIcon className={iconClass} />}
              label="New Sale"
              isActive={currentView === View.NEW_SALE}
              onClick={() => onNavigate(View.NEW_SALE)}
            />
          }
          <NavItem
            icon={<HistoryIcon className={iconClass} />}
            label="Sales History"
            isActive={currentView === View.SALES_HISTORY}
            onClick={() => onNavigate(View.SALES_HISTORY)}
          />
           {role === 'Admin' &&
            <NavItem
              icon={<SettingsIcon className={iconClass} />}
              label="Settings"
              isActive={currentView === View.SETTINGS}
              onClick={() => onNavigate(View.SETTINGS)}
            />
          }
          {role === 'Admin' &&
            <NavItem
              icon={<ActivityLogIcon className={iconClass} />}
              label="Activity Log"
              isActive={currentView === View.ACTIVITY_LOG}
              onClick={() => onNavigate(View.ACTIVITY_LOG)}
            />
          }
        </ul>
      </nav>
      <div className="mt-auto">
        <div className="border-t pt-4">
            <NavItem
              icon={<SupportIcon className={iconClass} />}
              label="Support"
              isActive={currentView === View.SUPPORT}
              onClick={() => onNavigate(View.SUPPORT)}
            />
        </div>
        <div className="p-3 my-2 rounded-lg bg-gray-100">
            <p className="text-sm font-semibold text-on-surface">{name}</p>
            <p className="text-xs text-on-surface-secondary">{role} at {shopName}</p>
        </div>
        <NavItem
          icon={<LogoutIcon className="w-6 h-6" />}
          label="Logout"
          isActive={false}
          onClick={onLogout}
        />
      </div>
    </aside>
  );
};

export default Sidebar;