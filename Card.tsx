import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-surface rounded-lg shadow-md p-6 ${className}`}>
      {title && <h3 className="text-xl font-bold text-on-surface mb-4">{title}</h3>}
      {children}
    </div>
  );
};

export default Card;
