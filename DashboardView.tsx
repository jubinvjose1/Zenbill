import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Card from './ui/Card';
import { Sale, Product, User } from '../types';
import { getAiChatResponse } from '../services/geminiService';
import { LoadingSpinner, RevenueIcon, TotalSalesIcon, LowStockIcon, StarIcon, AlertTriangleIcon, HistoryIcon, LightbulbIcon, ChartBarIcon, SendIcon } from './icons';
import Button from './ui/Button';
import BarChart from './ui/BarChart';

interface DashboardViewProps {
  sales: Sale[];
  products: Product[];
  currentUser: User;
}

type ChatMessage = {
  role: 'user' | 'model';
  text: string;
};

const StatCard = ({ icon, title, value, colorClass }: { icon: React.ReactNode, title: string, value: string | number, colorClass: string}) => (
    <Card className="flex items-center p-4 transition-transform transform hover:scale-105">
        <div className={`p-3 rounded-full ${colorClass}`}>
            {icon}
        </div>
        <div className="ml-4">
            <h4 className="text-sm font-medium text-on-surface-secondary">{title}</h4>
            <p className="text-2xl font-bold text-on-surface">{value}</p>
        </div>
    </Card>
);

const DashboardView: React.FC<DashboardViewProps> = ({ sales, products, currentUser }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<'7days' | '30days'>('7days');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
  const totalSales = sales.length;
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 5).length;

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [chatHistory]);

  const fetchInitialGreeting = useCallback(async () => {
    if (!process.env.API_KEY) {
        setChatError("AI features are disabled. An API key needs to be configured by the developer.");
        return;
    }
    if(chatHistory.length > 0) return;

    setIsChatLoading(true);
    setChatError(null);
    try {
      const result = await getAiChatResponse("Hello!", [], sales);
      setChatHistory([{ role: 'model', text: result }]);
    } catch (e: any) {
      setChatError(e.message);
    } finally {
      setIsChatLoading(false);
    }
  }, [sales, chatHistory.length]);

  useEffect(() => {
    fetchInitialGreeting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isChatLoading) return;

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: userInput }];
    setChatHistory(newHistory);
    setUserInput('');
    setIsChatLoading(true);
    setChatError(null);

    try {
        const geminiHistory = newHistory.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));
        // Remove last element as it's the current user input
        geminiHistory.pop(); 

        const result = await getAiChatResponse(userInput, geminiHistory, sales);
        setChatHistory(prev => [...prev, { role: 'model', text: result }]);
    } catch (e: any) {
        setChatError(e.message);
        // Optionally remove the user's message if the call fails
        setChatHistory(prev => prev.slice(0, -1));
    } finally {
        setIsChatLoading(false);
    }
  };
  
   const handleSuggestionClick = (suggestion: string) => {
    setUserInput(suggestion);
   };

  const salesChartData = useMemo(() => {
    const days = chartRange === '7days' ? 7 : 30;
    const today = new Date();
    const data: { [key: string]: number } = {};

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const isoDateKey = date.toISOString().split('T')[0];
      data[isoDateKey] = 0;
    }
    
    sales.forEach(sale => {
      const saleDate = new Date(sale.date);
      const isoDateKey = saleDate.toISOString().split('T')[0];
      const timeDiff = today.getTime() - saleDate.getTime();
      const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (diffDays <= days && data.hasOwnProperty(isoDateKey)) {
        data[isoDateKey] += sale.total;
      }
    });

    return Object.keys(data).sort().map(isoDateKey => ({
      label: new Date(isoDateKey + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: data[isoDateKey],
    }));
  }, [sales, chartRange]);

  return (
    <div>
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center mb-8">
            {currentUser.shopLogo && (
                <img src={currentUser.shopLogo} alt={`${currentUser.shopName} Logo`} className="h-24 w-24 object-contain rounded-lg bg-surface shadow-md border-2 border-surface" />
            )}
            <div>
                <h1 className="text-4xl font-bold text-on-surface">{currentUser.shopName}</h1>
                <p className="text-on-surface-secondary mt-1">{currentUser.shopAddress || 'No address set'}</p>
                 <p className="text-sm text-on-surface-secondary mt-2">Welcome back, <span className="font-semibold">{currentUser.name}</span>!</p>
            </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
            icon={<RevenueIcon className="w-6 h-6 text-white"/>}
            title="Total Revenue"
            value={`₹${totalRevenue.toFixed(2)}`}
            colorClass="bg-primary"
        />
        <StatCard
            icon={<TotalSalesIcon className="w-6 h-6 text-white"/>}
            title="Total Sales"
            value={totalSales}
            colorClass="bg-secondary"
        />
        <StatCard
            icon={<LowStockIcon className="w-6 h-6 text-white"/>}
            title="Low Stock Items"
            value={lowStockProducts}
            colorClass="bg-yellow-500"
        />
      </div>

      <Card className="mb-8">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <ChartBarIcon className="w-6 h-6 text-primary"/>
                Sales Performance
            </h3>
            <div className="flex gap-2">
                <Button 
                    variant={chartRange === '7days' ? 'primary' : 'ghost'} 
                    onClick={() => setChartRange('7days')}
                    className="!px-3 !py-1 text-sm"
                >
                    Last 7 Days
                </Button>
                <Button 
                    variant={chartRange === '30days' ? 'primary' : 'ghost'}
                    onClick={() => setChartRange('30days')}
                    className="!px-3 !py-1 text-sm"
                >
                    Last 30 Days
                </Button>
            </div>
        </div>
        {sales.length > 0 ? (
           <BarChart data={salesChartData} title="Daily Sales" />
        ) : (
            <div className="text-center py-16 text-on-surface-secondary">
                <p>No sales data available to display chart.</p>
                <p>Start making sales to see your performance here.</p>
            </div>
        )}
      </Card>

      <Card>
        <h3 className="text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
          <LightbulbIcon className="w-6 h-6 text-primary" />
          Chat with Your AI Analyst
        </h3>
        <div className="bg-gray-50 h-96 flex flex-col p-4 rounded-lg border">
            <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                         {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0">Z</div>}
                         <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary-dark text-white' : 'bg-surface shadow-sm'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                         </div>
                    </div>
                ))}
                {isChatLoading && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0">Z</div>
                        <div className="max-w-xl p-3 rounded-lg bg-surface shadow-sm flex items-center gap-2">
                            <span className="text-sm text-on-surface-secondary">Zen is typing...</span>
                            <LoadingSpinner className="w-4 h-4 text-primary" />
                        </div>
                    </div>
                )}
                 {chatError && (
                     <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{chatError}</div>
                 )}
                <div ref={chatEndRef}></div>
            </div>
            
            {chatHistory.length === 0 && !isChatLoading && (
                 <div className="text-sm text-center text-on-surface-secondary p-4">
                     <p className="font-semibold mb-2">Try asking:</p>
                     <div className="flex flex-wrap justify-center gap-2">
                         <button onClick={() => handleSuggestionClick("What was my best-selling product last week?")} className="bg-gray-200 px-2 py-1 rounded-md hover:bg-gray-300">"What was my best-selling product last week?"</button>
                         <button onClick={() => handleSuggestionClick("Which day had the most sales?")} className="bg-gray-200 px-2 py-1 rounded-md hover:bg-gray-300">"Which day had the most sales?"</button>
                         <button onClick={() => handleSuggestionClick("Give me advice for my slow-moving items.")} className="bg-gray-200 px-2 py-1 rounded-md hover:bg-gray-300">"Give me advice for my slow-moving items."</button>
                     </div>
                 </div>
            )}

            <form onSubmit={handleChatSubmit} className="mt-4 flex gap-3 flex-shrink-0">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ask a question about your sales..."
                    className="flex-grow w-full px-4 py-2 bg-surface border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isChatLoading || !!chatError}
                />
                <Button type="submit" disabled={isChatLoading || !userInput.trim()}>
                    <SendIcon className="w-5 h-5"/>
                </Button>
            </form>
        </div>
      </Card>
    </div>
  );
};

export default DashboardView;