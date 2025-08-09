import React, { useState, useMemo } from 'react';
import { Ticket, User } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Input from './ui/Input';
import { PlusIcon, SupportIcon } from './icons';
import TicketDetailModal from './TicketDetailModal';

interface SupportViewProps {
  tickets: Ticket[];
  currentUser: User;
  onCreateTicket: (subject: string, message: string) => void;
  onAddMessage: (ticketId: string, message: string) => void;
}

const TicketStatusBadge = ({ status }: { status: string }) => {
    const colorClasses = {
        'Open': 'bg-blue-100 text-blue-800',
        'In Progress': 'bg-yellow-100 text-yellow-800',
        'Closed': 'bg-gray-100 text-gray-800',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClasses[status as keyof typeof colorClasses]}`}>{status}</span>;
}

const SupportView: React.FC<SupportViewProps> = ({ tickets, currentUser, onCreateTicket, onAddMessage }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const selectedTicket = useMemo(() => 
    tickets.find(t => t.id === selectedTicketId),
    [tickets, selectedTicketId]
  );
  
  const sortedTickets = [...tickets].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject && message) {
      onCreateTicket(subject, message);
      setIsCreateModalOpen(false);
      setSubject('');
      setMessage('');
    }
  };
  
  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicketId(ticket.id);
  };
  
  const handleCloseDetailModal = () => {
    setSelectedTicketId(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-on-surface">Support Center</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon className="w-5 h-5" /> Create New Ticket
        </Button>
      </div>

      <Card>
        {sortedTickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-sm font-semibold text-on-surface-secondary">Ticket ID</th>
                  <th className="p-4 text-sm font-semibold text-on-surface-secondary">Subject</th>
                  <th className="p-4 text-sm font-semibold text-on-surface-secondary">Status</th>
                  <th className="p-4 text-sm font-semibold text-on-surface-secondary">Last Updated</th>
                  <th className="p-4 text-sm font-semibold text-on-surface-secondary text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="p-4 font-mono text-xs text-on-surface">{ticket.id.substring(0, 12)}...</td>
                    <td className="p-4 font-medium text-on-surface">{ticket.subject}</td>
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
            <h3 className="mt-4 text-xl font-semibold text-on-surface">No Support Tickets Found</h3>
            <p className="mt-2 text-on-surface-secondary">
              If you have any issues, feel free to create a new ticket.
            </p>
          </div>
        )}
      </Card>
      
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create a New Support Ticket">
         <form onSubmit={handleCreateTicket} className="space-y-4">
            <Input id="ticket-subject" label="Subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            <div>
              <label htmlFor="ticket-message" className="block text-sm font-medium text-on-surface-secondary">Message</label>
              <textarea 
                  id="ticket-message"
                  rows={5}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please describe your issue in detail."
                  required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                <Button type="submit">
                    Submit Ticket
                </Button>
            </div>
        </form>
      </Modal>
      
      {selectedTicket && (
        <TicketDetailModal 
          ticket={selectedTicket}
          currentUser={currentUser}
          onClose={handleCloseDetailModal}
          onAddMessage={onAddMessage}
        />
      )}
    </div>
  );
};

export default SupportView;