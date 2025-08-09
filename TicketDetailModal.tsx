import React, { useState, useRef, useEffect } from 'react';
import { Ticket, User, TicketStatus } from '../types.ts';
import Modal from './ui/Modal.tsx';
import Button from './ui/Button.tsx';
import { UserIcon } from './icons.tsx';

interface TicketDetailModalProps {
  ticket: Ticket;
  currentUser: User;
  onClose: () => void;
  onAddMessage: (ticketId: string, message: string) => void;
  onUpdateStatus?: (ticketId: string, status: TicketStatus) => void;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket, currentUser, onClose, onAddMessage, onUpdateStatus }) => {
  const [newMessage, setNewMessage] = useState('');
  const [newStatus, setNewStatus] = useState<TicketStatus>(ticket.status);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket.messages]);

  useEffect(() => {
    setNewStatus(ticket.status);
  }, [ticket.status]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onAddMessage(ticket.id, newMessage.trim());
      setNewMessage('');
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value as TicketStatus;
    setNewStatus(status);
    if(onUpdateStatus) {
        onUpdateStatus(ticket.id, status);
    }
  };

  const isSuperAdmin = currentUser.role === 'SuperAdmin';
  const isClosed = ticket.status === 'Closed';

  return (
    <Modal isOpen={true} onClose={onClose} title={`Ticket: ${ticket.subject}`}>
      <div className="flex flex-col h-[70vh]">
        {isSuperAdmin && onUpdateStatus && (
          <div className="flex items-center justify-between p-3 bg-gray-100 rounded-md mb-4 flex-shrink-0">
            <span className="font-semibold text-on-surface-secondary">Status:</span>
            <select
              value={newStatus}
              onChange={handleStatusChange}
              className="pl-3 pr-10 py-1.5 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        )}
        
        <div className="flex-grow bg-gray-50 p-4 rounded-lg overflow-y-auto space-y-4">
          {ticket.messages.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-3 ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
              {msg.senderId !== currentUser.id && <UserIcon className="w-8 h-8 p-1.5 bg-gray-300 text-white rounded-full flex-shrink-0" />}
              <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.senderId === currentUser.id ? 'bg-primary text-white' : 'bg-white shadow-sm'}`}>
                <p className="text-sm font-bold mb-1">{msg.senderName}</p>
                <p className="text-sm">{msg.message}</p>
                <p className={`text-xs mt-2 opacity-70 ${msg.senderId === currentUser.id ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
               {msg.senderId === currentUser.id && <UserIcon className="w-8 h-8 p-1.5 bg-primary-dark text-white rounded-full flex-shrink-0" />}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {!isClosed ? (
            <form onSubmit={handleSendMessage} className="mt-4 flex gap-3 flex-shrink-0">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your reply..."
                rows={2}
                className="flex-grow block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
              <Button type="submit" className="self-end">Send</Button>
            </form>
        ) : (
            <div className="mt-4 p-3 text-center bg-gray-100 rounded-md text-on-surface-secondary font-semibold flex-shrink-0">
                This ticket is closed.
            </div>
        )}
      </div>
    </Modal>
  );
};

export default TicketDetailModal;