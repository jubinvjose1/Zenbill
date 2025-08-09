import React, { useState } from 'react';
import { User, UserRole } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { TrashIcon, PlusIcon, UserIcon, UploadIcon } from './icons';

interface SettingsViewProps {
  adminUser: User;
  allUsers: User[];
  onUpdateProfile: (name: string, shopName: string, gstNumber: string, sgstPercentage: number, cgstPercentage: number, shopAddress: string, shopLogo: string, shopPhoneNumber: string) => void;
  onAddUser: (user: Omit<User, 'id' | 'shopId' | 'shopName'>) => void;
  onRemoveUser: (userId: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ adminUser, allUsers, onUpdateProfile, onAddUser, onRemoveUser }) => {
  const [adminName, setAdminName] = useState(adminUser.name);
  const [shopName, setShopName] = useState(adminUser.shopName);
  const [gstNumber, setGstNumber] = useState(adminUser.gstNumber || '');
  const [sgstPercentage, setSgstPercentage] = useState(adminUser.sgstPercentage || 0);
  const [cgstPercentage, setCgstPercentage] = useState(adminUser.cgstPercentage || 0);
  const [shopAddress, setShopAddress] = useState(adminUser.shopAddress || '');
  const [shopLogo, setShopLogo] = useState(adminUser.shopLogo || '');
  const [shopPhoneNumber, setShopPhoneNumber] = useState(adminUser.shopPhoneNumber || '');
  
  const [showSuccess, setShowSuccess] = useState(false);

  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Cashier');

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(adminName, shopName, gstNumber, sgstPercentage, cgstPercentage, shopAddress, shopLogo, shopPhoneNumber);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setShopLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserPassword) {
      alert('Please provide a username and password.');
      return;
    }
    onAddUser({ name: newUserName, password: newUserPassword, role: newUserRole });
    setNewUserName('');
    setNewUserPassword('');
    setNewUserRole('Cashier');
  };

  const otherUsers = allUsers.filter(u => u.role !== 'Admin');

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-on-surface mb-6">Settings</h1>
      
      <form onSubmit={handleProfileUpdate} className="space-y-8">
        <Card>
            <h2 className="text-2xl font-bold text-on-surface mb-4 border-b pb-3">Shop Profile</h2>
            <div className="space-y-6">
                <Input 
                    id="merchant-id"
                    label="Your Merchant ID"
                    type="text"
                    value={adminUser.merchantId || 'N/A'}
                    disabled
                    className="!bg-gray-100"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input 
                      id="admin-name" 
                      label="Your Name (Admin)" 
                      type="text" 
                      value={adminName} 
                      onChange={(e) => setAdminName(e.target.value)} 
                      required 
                    />
                    <Input 
                      id="shop-name-profile" 
                      label="Shop Name" 
                      type="text" 
                      value={shopName} 
                      onChange={(e) => setShopName(e.target.value)} 
                      required 
                    />
                </div>
                <div>
                    <label htmlFor="shop-address" className="block text-sm font-medium text-on-surface-secondary">Shop Address</label>
                    <textarea 
                        id="shop-address"
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        value={shopAddress}
                        onChange={(e) => setShopAddress(e.target.value)}
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      id="shop-phone-number"
                      label="Shop Phone Number"
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={shopPhoneNumber}
                      onChange={(e) => setShopPhoneNumber(e.target.value)}
                    />
                     <Input
                      id="gst-number"
                      label="GST Number"
                      type="text"
                      placeholder="e.g. 22AAAAA0000A1Z5"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                    />
                </div>
                 <div>
                    <label htmlFor="logo-upload" className="block text-sm font-medium text-on-surface-secondary mb-1">Shop Logo</label>
                    <div className="flex items-center gap-4">
                        {shopLogo ? (
                            <img src={shopLogo} alt="Shop Logo Preview" className="h-20 w-20 object-contain rounded-lg bg-gray-100 p-1 border" />
                        ) : (
                            <div className="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center text-on-surface-secondary text-xs text-center border">No Logo</div>
                        )}
                        <label htmlFor="logo-upload" className="cursor-pointer bg-white border border-gray-300 rounded-md shadow-sm px-4 py-2 text-sm font-medium text-on-surface-secondary hover:bg-gray-50 flex items-center gap-2">
                            <UploadIcon className="w-5 h-5"/>
                            <span>Upload Image</span>
                        </label>
                        <input id="logo-upload" name="logo-upload" type="file" className="sr-only" onChange={handleLogoChange} accept="image/*"/>
                    </div>
                </div>
            </div>
        </Card>

        <Card>
            <h2 className="text-2xl font-bold text-on-surface mb-4 border-b pb-3">Tax Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Input
                    id="sgst-percentage"
                    label="SGST (%)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={sgstPercentage}
                    onChange={(e) => setSgstPercentage(parseFloat(e.target.value) || 0)}
                    required
                  />
                  <Input
                    id="cgst-percentage"
                    label="CGST (%)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={cgstPercentage}
                    onChange={(e) => setCgstPercentage(parseFloat(e.target.value) || 0)}
                    required
                  />
            </div>
        </Card>
        
         <div className="flex items-center justify-end gap-4">
             {showSuccess && (
                <div className="text-center p-2 rounded-md bg-green-100 text-green-700 font-semibold text-sm">
                    ✓ Changes Saved Successfully!
                </div>
            )}
            <Button type="submit" className="!py-2.5">
              Save All Changes
            </Button>
         </div>
      </form>


      <Card className="mt-8">
        <h2 className="text-2xl font-bold text-on-surface mb-4 border-b pb-3">User Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <form onSubmit={handleAddUser} className="space-y-4">
                <h3 className="font-bold text-lg text-on-surface">Add New User</h3>
                 <Input 
                    id="new-user-name" 
                    label="Username" 
                    type="text" 
                    value={newUserName} 
                    onChange={(e) => setNewUserName(e.target.value)} 
                    required 
                />
                 <Input 
                    id="new-user-password" 
                    label="Password" 
                    type="password" 
                    value={newUserPassword} 
                    onChange={(e) => setNewUserPassword(e.target.value)} 
                    required 
                />
                <div>
                    <label htmlFor="user-role" className="block text-sm font-medium text-on-surface-secondary">Role</label>
                    <select 
                        id="user-role" 
                        value={newUserRole} 
                        onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    >
                        <option>Cashier</option>
                        <option>Accountant</option>
                    </select>
                </div>
                <Button type="submit" className="w-full">
                    <PlusIcon className="w-5 h-5" /> Add User
                </Button>
            </form>
            <div>
              <h3 className="font-bold text-lg text-on-surface mb-2">Existing Users</h3>
              {otherUsers.length > 0 ? (
                <ul className="space-y-3">
                  {otherUsers.map(user => (
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
                    <p>No other users have been added yet.</p>
                </div>
              )}
            </div>
        </div>
      </Card>
    </div>
  );
};

export default SettingsView;