'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components';
import { Search, Plus, Users, MessageSquare, ChevronRight } from 'lucide-react';

const DUMMY_CONVERSATIONS = [
  { type: 'direct', id: 'u1', name: 'Jane Smith', username: 'janesmith', lastMessage: 'Thanks for sharing that record!', lastMessageAt: '2026-02-22T10:30:00Z', unreadCount: 2 },
  { type: 'direct', id: 'u2', name: 'Robert Johnson', username: 'rjohnson', lastMessage: 'I found the census record you were looking for.', lastMessageAt: '2026-02-21T15:45:00Z', unreadCount: 0 },
  { type: 'group', id: 'g1', name: 'Smith Family Research', description: 'Collaborative research group', memberCount: 5, lastMessage: 'Has anyone checked the church records?', lastMessageAt: '2026-02-22T08:15:00Z', unreadCount: 3 },
  { type: 'direct', id: 'u3', name: 'Maria Garcia', username: 'mgarcia', lastMessage: 'The DNA match looks promising!', lastMessageAt: '2026-02-20T12:00:00Z', unreadCount: 0 },
  { type: 'group', id: 'g2', name: 'Tree Maintainers', description: 'Discussion for tree maintainers', memberCount: 3, lastMessage: 'I updated the source citations.', lastMessageAt: '2026-02-19T09:30:00Z', unreadCount: 0 },
];

const DUMMY_MESSAGES = {
  u1: [
    { id: 'm1', senderId: 'u1', senderName: 'Jane Smith', content: 'Hi! I noticed we share some common ancestors in the Cork area.', createdAt: '2026-02-22T09:00:00Z' },
    { id: 'm2', senderId: 'me', senderName: 'You', content: 'Really? Which surnames are you researching?', createdAt: '2026-02-22T09:15:00Z' },
    { id: 'm3', senderId: 'u1', senderName: 'Jane Smith', content: 'The Murphy and Sullivan lines. I have records going back to 1820.', createdAt: '2026-02-22T09:30:00Z' },
    { id: 'm4', senderId: 'me', senderName: 'You', content: 'That is incredible! I have Sullivans in my tree too. Let me share what I have.', createdAt: '2026-02-22T10:00:00Z' },
    { id: 'm5', senderId: 'u1', senderName: 'Jane Smith', content: 'Thanks for sharing that record!', createdAt: '2026-02-22T10:30:00Z' },
  ],
  u2: [
    { id: 'm6', senderId: 'u2', senderName: 'Robert Johnson', content: 'I found the census record you were looking for.', createdAt: '2026-02-21T15:45:00Z' },
  ],
  g1: [
    { id: 'm7', senderId: 'u3', senderName: 'Maria Garcia', content: 'I found a new lead on the Smith family in Hamilton County.', createdAt: '2026-02-22T07:00:00Z' },
    { id: 'm8', senderId: 'me', senderName: 'You', content: 'Great find! Which year is the record from?', createdAt: '2026-02-22T07:30:00Z' },
    { id: 'm9', senderId: 'u1', senderName: 'Jane Smith', content: 'Has anyone checked the church records?', createdAt: '2026-02-22T08:15:00Z' },
  ],
};

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function ConversationList({ conversations, selectedId, onSelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = searchTerm
    ? conversations.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : conversations;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-base-content/10 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-base-content">Messages</h2>
          <div className="flex gap-1">
            <button className="btn btn-ghost btn-sm btn-square" aria-label="New message" title="New message">
              <Plus size={18} />
            </button>
            <button className="btn btn-ghost btn-sm btn-square" aria-label="New group" title="New group">
              <Users size={18} />
            </button>
          </div>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="input input-bordered input-sm w-full pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="p-6 text-center text-base-content/50 text-sm">No conversations found</div>
        )}
        {filtered.map((conv) => (
          <button
            key={`${conv.type}-${conv.id}`}
            type="button"
            onClick={() => onSelect(conv)}
            className={`w-full flex items-start gap-3 p-4 text-left hover:bg-base-200 transition-colors border-b border-base-content/5 ${selectedId === conv.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {conv.type === 'group' ? <Users size={18} className="text-primary" /> : (
                <span className="text-sm font-bold text-primary">{conv.name?.[0]?.toUpperCase() || '?'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm text-base-content truncate">{conv.name}</span>
                <span className="text-xs text-base-content/50 shrink-0">{formatTime(conv.lastMessageAt)}</span>
              </div>
              {conv.type === 'group' && (
                <span className="text-xs text-base-content/40">{conv.memberCount} members</span>
              )}
              <p className="text-xs text-base-content/60 truncate mt-0.5">{conv.lastMessage || 'No messages yet'}</p>
            </div>
            {conv.unreadCount > 0 && (
              <span className="badge badge-primary badge-sm">{conv.unreadCount}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageThread({ conversation }) {
  const [newMessage, setNewMessage] = useState('');
  const messages = DUMMY_MESSAGES[conversation?.id] || [];

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-base-content/40">
        <div className="text-center space-y-2">
          <MessageSquare size={48} className="mx-auto" />
          <p>Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-base-content/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          {conversation.type === 'group' ? <Users size={18} className="text-primary" /> : (
            <span className="text-sm font-bold text-primary">{conversation.name?.[0]?.toUpperCase() || '?'}</span>
          )}
        </div>
        <div>
          <div className="font-medium text-base-content">{conversation.name}</div>
          {conversation.type === 'group' && (
            <div className="text-xs text-base-content/50">{conversation.memberCount} members</div>
          )}
          {conversation.type === 'direct' && conversation.username && (
            <div className="text-xs text-base-content/50">@{conversation.username}</div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-base-content/40 text-sm py-8">No messages yet. Start the conversation!</div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === 'me';
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isMe ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content'} rounded-2xl px-4 py-2.5`}>
                {!isMe && <div className="text-xs font-medium opacity-70 mb-1">{msg.senderName}</div>}
                <p className="text-sm">{msg.content}</p>
                <div className={`text-xs mt-1 ${isMe ? 'text-primary-content/60' : 'text-base-content/40'}`}>
                  {formatTime(msg.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-base-content/10 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="input input-bordered flex-1"
        />
        <button type="submit" className="btn btn-primary" disabled={!newMessage.trim()}>Send</button>
      </form>
    </div>
  );
}

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(null);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex">
        <div className="w-full sm:w-80 lg:w-96 border-r border-base-content/10 bg-base-100 flex-shrink-0">
          <ConversationList
            conversations={DUMMY_CONVERSATIONS}
            selectedId={selectedConversation?.id}
            onSelect={setSelectedConversation}
          />
        </div>
        <div className="hidden sm:flex flex-1 flex-col bg-base-100">
          <MessageThread conversation={selectedConversation} />
        </div>
      </div>
    </DashboardLayout>
  );
}
