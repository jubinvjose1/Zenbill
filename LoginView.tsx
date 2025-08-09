import React, { useState } from 'react';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { ZenBillLogo, AlertTriangleIcon } from './icons';

interface LoginViewProps {
  onAuth: (isLogin: boolean, name: string, password: string, shopName?: string) => Promise<string | null>;
}

const LoginView: React.FC<LoginViewProps> = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && password && (isLogin || shopName)) {
      setError(null);
      setIsLoading(true);
      const errorMessage = await onAuth(isLogin, name, password, isLogin ? undefined : shopName);
      setIsLoading(false);
      if (errorMessage) {
        setError(errorMessage);
      }
    }
  };
  
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setName('');
    setPassword('');
    setShopName('');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md !p-10">
        <div className="text-center mb-8">
            <ZenBillLogo className="h-14 w-auto mx-auto mb-4" />
            <p className="text-on-surface-secondary">Modern Billing, Simplified.</p>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-on-surface mb-6">
          {isLogin ? 'Login' : 'Create Your Shop'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="name" label="Username" type="text" value={name} onChange={e => setName(e.target.value)} required autoComplete="username" />
          {!isLogin && (
            <Input id="shop-name" label="Shop Name" type="text" value={shopName} onChange={e => setShopName(e.target.value)} required />
          )}
          <Input id="password" label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"/>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm flex items-center gap-2">
              <AlertTriangleIcon className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full !mt-6 !py-2.5" disabled={isLoading}>
            {isLoading ? (isLogin ? 'Logging in...' : 'Creating Account...') : (isLogin ? 'Login' : 'Create Account')}
          </Button>
        </form>
        <div className="mt-6 text-center">
            <p className="text-sm text-on-surface-secondary">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button onClick={toggleMode} className="font-medium text-primary hover:text-primary-dark ml-1">
                    {isLogin ? 'Sign Up' : 'Login'}
                </button>
            </p>
        </div>
      </Card>
    </div>
  );
};

export default LoginView;