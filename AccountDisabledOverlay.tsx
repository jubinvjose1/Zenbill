import React from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { ZenBillLogo, AlertTriangleIcon, LogoutIcon } from './icons';

interface AccountDisabledOverlayProps {
  message: string;
  onLogout: () => void;
}

const AccountDisabledOverlay: React.FC<AccountDisabledOverlayProps> = ({ message, onLogout }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center !p-10">
        <ZenBillLogo className="h-12 w-auto mx-auto mb-4" />
        <AlertTriangleIcon className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-on-surface mb-2">Account Disabled</h2>
        <p className="text-on-surface-secondary mb-8">
          {message || 'Your account has been disabled. Please contact support for more information.'}
        </p>
        <Button variant="danger" onClick={onLogout} className="w-full max-w-xs mx-auto !py-3">
          <LogoutIcon className="w-5 h-5" />
          Logout
        </Button>
      </Card>
    </div>
  );
};

export default AccountDisabledOverlay;
