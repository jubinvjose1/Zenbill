import React, { useState, useMemo } from 'react';
import { Ticket, TicketStatus, User } from '../types.ts';
import Card from './ui/Card.tsx';
import Button from './ui/Button.tsx';
import { SupportIcon } from './icons.tsx';
import TicketDetailModal from './TicketDetailModal.tsx';

interface SuperAdminSupportViewProps {
  tickets: Ticket[];
  currentUser: User;
  onAddMessage: (ticketId: string, message: string) => void;
  onUpdateStatus: (ticketId: string, status: TicketStatus) => void;
}

const TicketStatusBadge = ({ status }: { status: string }) => {
    const colorClasses = {
        'Open': 'bg-blue-100 text-blue-800',
        'In Progress': 'bg-yellow-100 text-yellow-800',
        'Closed': 'bg-gray-100 text-gray-800',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClasses[status as keyof typeof colorClasses]}`}>{status}</span>;
}

const SuperAdminSupportView: React.FC<SuperAdminSupportViewProps> = ({ tickets, currentUser, onAddMessage, onUpdateStatus }) => {
  const [filter, setFilter] = useState<TicketStatus | 'All'>('All');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const selectedTicket = useMemo(() =>
    tickets.find(t => t.id === selectedTicketId),
    [tickets, selectedTicketId]
  );

  const filteredTickets = useMemo(() => {
    return tickets
      .filter(ticket => filter === 'All' || ticket.status === filter)
      .sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [tickets, filter]);
  
  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicketId(ticket.id);
  };
  
  const handleCloseDetailModal = () => {
    setSelectedTicketId(null);
  };

  const FilterButton = ({ type, label }: { type: TicketStatus | 'All', label: string }) => (
    <Button
        variant={filter === type ? 'primary' : 'ghost'}
        onClick={() => setFilter(type)}
        className="text-sm px-3 py-1.5"
    >
        {label}
    </Button>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-on-surface mb-6">Support Tickets</h1>
      
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-on-surface-secondary">Filter by status:</span>
            <FilterButton type="All" label="All" />
            <FilterButton type="Open" label="Open" />
            <FilterButton type="In Progress" label="In Progress" />
            <FilterButton type="Closed" label="Closed" />
        </div>
      </Card>

      <Card>
        {filteredTickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-sm font-semibold text-on-surface-secondary">Subject</th>
                  <th className="p-4 text-sm font-semibold text-on-surface-secondary">Customer</th>
                  <th className="p-4 text-sm font-semibold text-on-surface-secondary">Status</th>
                  <th className="p-4 text-sm font-semibold text-on-surface-secondary">Last Updated</th>
                  <th className="p-4 text-sm font-semibold text-on-surface-secondary text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="p-4 font-medium text-on-surface">{ticket.subject}</td>
                    <td className="p-4 text-on-surface-secondary">{ticket.customerName}</td>
                    <td className="p-4"><TicketStatusBadge status={ticket.status} /></td>
                    <td className="p-4 text-on-surface-secondary">{new Date(ticket.updatedAt).toLocaleString()}</td>
                    <td className="p-4 text-right">
                       <Button onClick={() => handleViewTicket(ticket)} className="text-sm py-1 px-3">
                        View Ticket
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <SupportIcon className="w-16 h-16 mx-auto text-on-surface-secondary opacity-50" />
            <h3 className="mt-4 text-xl font-semibold text-on-surface">No Tickets Found</h3>
            <p className="mt-2 text-on-surface-secondary">
              There are no tickets matching the current filter.
            </p>
          </div>
        )}
      </Card>
      
      {selectedTicket && (
        <TicketDetailModal 
          ticket={selectedTicket}
          currentUser={currentUser}
          onClose={handleCloseDetailModal}
          onAddMessage={onAddMessage}
          onUpdateStatus={onUpdateStatus}
        />
      )}
    </div>
  );
};

export default SuperAdminSupportView;