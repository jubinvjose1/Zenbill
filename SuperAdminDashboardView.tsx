import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, Ticket, Activity } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { UserIcon, EditIcon, InformationCircleIcon, UsersIcon, SettingsIcon, PlusIcon, TrashIcon, SupportIcon, ActivityLogIcon } from './icons';
import Input from './ui/Input';

interface SuperAdminDashboardViewProps {
  customers: User[];
  allUsers: User[];
  tickets: Ticket[];
  activities: Activity[];
  onUpdateCustomer: (userId: string, updates: Partial<Pick<User, 'isDisabled' | 'disabledMessage' | 'isBannerVisible' | 'bannerText'>>) => void;
  onAddUser: (customerAdmin: User, newUser: Omit<User, 'id' | 'shopId' | 'shopName'>) => void;
  onRemoveUser: (userId: string) => void;
}

const StatCard = ({ icon, title, value, colorClass }: { icon: React.ReactNode, title: string, value: string | number, colorClass: string}) => (
    <Card className="flex items-center p-4">
        <div className={`p-3 rounded-full ${colorClass}`}>
            {icon}
        </div>
        <div className="ml-4">
            <h4 className="text-sm font-medium text-on-surface-secondary">{title}</h4>
            <p className="text-2xl font-bold text-on-surface">{value}</p>
        </div>
    </Card>
);

const SuperAdminDashboardView: React.FC<SuperAdminDashboardViewProps> = ({ customers, allUsers, tickets, activities, onUpdateCustomer, onAddUser, onRemoveUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'settings'>('profile');

  // State for settings tab
  const [isDisabled, setIsDisabled] = useState(false);
  const [disabledMessage, setDisabledMessage] = useState('');
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [bannerText, setBannerText] = useState('');

  // State for user management tab
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Cashier');
  
  const customerUsers = useMemo(() => {
    if (!selectedCustomer) return [];
    return allUsers.filter(u => u.shopId === selectedCustomer.shopId && u.role !== 'Admin');
  }, [selectedCustomer, allUsers]);

  const shopNameMap = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach(c => map.set(c.shopId, c.shopName));
    return map;
  }, [customers]);

  useEffect(() => {
    if (selectedCustomer) {
      setIsDisabled(selectedCustomer.isDisabled || false);
      setDisabledMessage(selectedCustomer.disabledMessage || '');
      setIsBannerVisible(selectedCustomer.isBannerVisible || false);
      setBannerText(selectedCustomer.bannerText || '');
    }
  }, [selectedCustomer]);

  const openManageModal = (customer: User) => {
    setSelectedCustomer(customer);
    setActiveTab('profile');
    setIsModalOpen(true);
  };

  const closeManageModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
    setNewUserName('');
    setNewUserPassword('');
    setNewUserRole('Cashier');
  };

  const handleSaveChanges = () => {
    if (selectedCustomer) {
      onUpdateCustomer(selectedCustomer.id, {
        isDisabled,
        disabledMessage,
        isBannerVisible,
        bannerText,
      });
      closeManageModal();
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCustomer && newUserName && newUserPassword) {
        onAddUser(selectedCustomer, { name: newUserName, password: newUserPassword, role: newUserRole });
        setNewUserName('');
        setNewUserPassword('');
        setNewUserRole('Cashier');
    }
  };

  const TabButton = ({ label, icon, isActive, onClick }: { label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void; }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
        isActive ? 'border-primary text-primary' : 'border-transparent text-on-surface-secondary hover:text-primary'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const totalCustomers = customers.length;
  const totalUsers = allUsers.filter(u => u.role !== 'SuperAdmin').length;
  const openTickets = tickets.filter(t => t.status !== 'Closed').length;
  const recentPlatformActivities = activities.filter(a => a.shopId !== 'super-admin-hq').slice(0, 5);

  return (
    <div>
      <h1 className="text-3xl font-bold text-on-surface mb-6">Super Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
            icon={<UsersIcon className="w-6 h-6 text-white"/>}
            title="Total Customers"
            value={totalCustomers}
            colorClass="bg-primary"
        />
        <StatCard
            icon={<UserIcon className="w-6 h-6 text-white"/>}
            title="Total Users"
            value={totalUsers}
            colorClass="bg-secondary"
        />
        <StatCard
            icon={<SupportIcon className="w-6 h-6 text-white"/>}
            title="Open Support Tickets"
            value={openTickets}
            colorClass="bg-yellow-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
            <h2 className="text-xl font-bold text-on-surface p-4 border-b">Customer Management</h2>
            <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                <tr className="border-b">
                    <th className="p-4 text-sm font-semibold text-on-surface-secondary">Shop Name</th>
                    <th className="p-4 text-sm font-semibold text-on-surface-secondary">Status</th>
                    <th className="p-4 text-sm font-semibold text-on-surface-secondary text-right">Actions</th>
                </tr>
                </thead>
                <tbody>
                {customers.length > 0 ? (
                    customers.map((customer) => (
                    <tr key={customer.id} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="p-4 font-medium text-on-surface">{customer.shopName}</td>
                        <td className="p-4">
                        {customer.isDisabled ? (
                            <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">
                            Disabled
                            </span>
                        ) : (
                            <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                            Enabled
                            </span>
                        )}
                        </td>
                        <td className="p-4 text-right">
                        <Button onClick={() => openManageModal(customer)}>
                            <EditIcon className="w-5 h-5 mr-2" /> Manage
                        </Button>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                    <td colSpan={3} className="text-center py-16">
                        <UserIcon className="w-16 h-16 mx-auto text-on-surface-secondary opacity-50" />
                        <h3 className="mt-4 text-xl font-semibold text-on-surface">No Customers Found</h3>
                        <p className="mt-2 text-on-surface-secondary">No shops have been created yet.</p>
                    </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
        </Card>
        <Card>
            <h2 className="text-xl font-bold text-on-surface p-4 border-b">Recent Platform Activity</h2>
             {recentPlatformActivities.length > 0 ? (
                <ul className="space-y-3 p-4">
                    {recentPlatformActivities.map(activity => (
                    <li key={activity.id} className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200">
                                <ActivityLogIcon className="h-4 w-4 text-on-surface-secondary" />
                            </span>
                        </div>
                        <div className="text-sm">
                            <p className="text-on-surface">{activity.description}</p>
                            <p className="text-xs text-on-surface-secondary">
                                <span className="font-semibold">{shopNameMap.get(activity.shopId) || 'Unknown Shop'}</span> - {new Date(activity.timestamp).toLocaleTimeString()}
                            </p>
                        </div>
                    </li>
                    ))}
                </ul>
                ) : (
                <div className="text-center py-16 text-on-surface-secondary">
                    <p>No customer activity yet.</p>
                </div>
                )}
        </Card>
      </div>


      {selectedCustomer && (
        <Modal isOpen={isModalOpen} onClose={closeManageModal} title={`Manage Customer: ${selectedCustomer.shopName}`}>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4">
              <TabButton label="Profile" icon={<InformationCircleIcon className="w-5 h-5"/>} isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
              <TabButton label="User Management" icon={<UsersIcon className="w-5 h-5"/>} isActive={activeTab === 'users'} onClick={() => setActiveTab('users')} />
              <TabButton label="Settings" icon={<SettingsIcon className="w-5 h-5"/>} isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            </nav>
          </div>
          <div className="pt-6">
            {activeTab === 'profile' && (
               <div className="flex items-start gap-4">
                  {selectedCustomer.shopLogo ? (
                        <img src={selectedCustomer.shopLogo} alt="Shop Logo Preview" className="h-20 w-20 object-contain rounded-lg bg-white p-1 border" />
                    ) : (
                        <div className="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center text-on-surface-secondary text-xs text-center border">No Logo</div>
                    )}
                  <div className="text-sm space-y-1.5 text-on-surface-secondary">
                      <p><strong>Merchant ID:</strong> {selectedCustomer.merchantId || 'N/A'}</p>
                      <p><strong>Shop Name:</strong> {selectedCustomer.shopName}</p>
                      <p><strong>Admin Name:</strong> {selectedCustomer.name}</p>
                      <p><strong>Address:</strong> {selectedCustomer.shopAddress || 'Not set'}</p>
                      <p><strong>GSTIN:</strong> {selectedCustomer.gstNumber || 'Not set'}</p>
                  </div>
              </div>
            )}
            {activeTab === 'users' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-lg text-on-surface mb-2">Existing Users</h4>
                  {customerUsers.length > 0 ? (
                     <ul className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {customerUsers.map(user => (
                          <li key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border">
                            <div className="flex items-center gap-3">
                              <UserIcon className="w-6 h-6 text-on-surface-secondary"/>
                              <div>
                                  <p className="font-semibold text-on-surface">{user.name}</p>
                                  <p className="text-sm text-on-surface-secondary">{user.role}</p>
                              </div>
                            </div>
                            <Button variant="danger" onClick={() => onRemoveUser(user.id)} className="p-2">
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                  ) : (
                    <div className="text-center p-6 text-on-surface-secondary bg-gray-50 rounded-lg border">
                      <p>No other users have been added to this shop.</p>
                    </div>
                  )}
                </div>
                <form onSubmit={handleAddUser} className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-bold text-lg text-on-surface">Add New User</h4>
                    <Input id="new-user-name" label="Username" type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required />
                    <Input id="new-user-password" label="Password" type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required />
                    <div>
                        <label htmlFor="user-role" className="block text-sm font-medium text-on-surface-secondary">Role</label>
                        <select id="user-role" value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as UserRole)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                            <option>Cashier</option>
                            <option>Accountant</option>
                        </select>
                    </div>
                    <Button type="submit" className="w-full">
                        <PlusIcon className="w-5 h-5" /> Add User
                    </Button>
                </form>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                  <div className="p-4 rounded-md border bg-gray-50">
                      <h4 className="font-bold text-lg flex items-center gap-2 mb-3 text-yellow-600">Announcement Banner</h4>
                      <div className="flex items-center mb-2">
                          <input type="checkbox" id="isBannerVisible" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" checked={isBannerVisible} onChange={(e) => setIsBannerVisible(e.target.checked)} />
                          <label htmlFor="isBannerVisible" className="ml-2 block text-sm font-medium text-gray-900">Enable announcement banner</label>
                      </div>
                      <textarea id="bannerText" rows={2} className="mt-1 block w-full text-sm" value={bannerText} onChange={(e) => setBannerText(e.target.value)} placeholder="e.g., Important: Upcoming maintenance on Sunday." disabled={!isBannerVisible} />
                  </div>
                  <div className="p-4 rounded-md border bg-gray-50">
                      <h4 className="font-bold text-lg flex items-center gap-2 mb-3 text-red-600">Account Status</h4>
                      <div className="flex items-center mb-2">
                          <input type="checkbox" id="isDisabled" className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" checked={isDisabled} onChange={(e) => setIsDisabled(e.target.checked)} />
                          <label htmlFor="isDisabled" className="ml-2 block text-sm font-medium text-gray-900">Disable this customer's account</label>
                      </div>
                      <textarea id="disabledMessage" rows={2} className="mt-1 block w-full text-sm" value={disabledMessage} onChange={(e) => setDisabledMessage(e.target.value)} placeholder="e.g., Your subscription has expired." disabled={!isDisabled} />
                  </div>
              </div>
            )}
          </div>
          <div className="flex justify-end items-center pt-6 mt-6 border-t gap-3">
            <Button type="button" variant="ghost" onClick={closeManageModal}>Cancel</Button>
            <Button type="button" onClick={handleSaveChanges}>Save Changes</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SuperAdminDashboardView;