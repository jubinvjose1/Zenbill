import React from 'react';
import { InformationCircleIcon } from './icons';

interface CustomerBannerProps {
  text: string;
}

const CustomerBanner: React.FC<CustomerBannerProps> = ({ text }) => {
  return (
    <div className="bg-yellow-400 text-yellow-900 flex items-center justify-center gap-3 p-3 font-semibold text-center w-full z-10 shadow-md">
      <InformationCircleIcon className="w-6 h-6 flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
};

export default CustomerBanner;