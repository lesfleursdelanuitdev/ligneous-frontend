'use client';

import { useState } from 'react';
import Link from 'next/link';

// Mock notification data - will be replaced with real data
const mockNotifications = [
  {
    id: '1',
    type: 'access_request',
    title: 'Access Request',
    message: 'mike@email.com wants to view Gonsalves Family Tree',
    time: '2 hours ago',
    read: false,
    actions: ['approve', 'deny'],
    metadata: {
      userId: 'user-123',
      treeId: 'tree-456',
    },
  },
  {
    id: '2',
    type: 'mention',
    title: 'Jane mentioned you',
    message: '"Check out @John\'s father, he was a remarkable..."',
    time: '5 hours ago',
    read: false,
    link: '/trees/tree-456/individuals/i-789',
    metadata: {
      treeName: 'Smith Family Tree',
    },
  },
  {
    id: '3',
    type: 'new_relative',
    title: 'New relative added',
    message: 'Jane added Maria Gonsalves (your great-aunt) to the tree',
    time: '2 days ago',
    read: true,
    link: '/trees/tree-456/individuals/i-101',
  },
  {
    id: '4',
    type: 'tree_update',
    title: 'Tree updated',
    message: '3 new individuals added to Gonsalves Family Tree',
    time: '3 days ago',
    read: true,
    link: '/trees/tree-456',
  },
  {
    id: '5',
    type: 'access_granted',
    title: 'Access granted',
    message: 'You now have viewer access to Miller Archives',
    time: '1 week ago',
    read: true,
    link: '/trees/tree-789',
  },
];

const notificationIcons = {
  access_request: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  ),
  mention: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  new_relative: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  tree_update: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  access_granted: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  duplicate: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

const notificationColors = {
  access_request: 'text-info bg-info/20',
  mention: 'text-secondary bg-secondary/20',
  new_relative: 'text-success bg-success/20',
  tree_update: 'text-warning bg-warning/20',
  access_granted: 'text-success bg-success/20',
  duplicate: 'text-warning bg-warning/20',
};

export default function NotificationPanel({ 
  isOpen, 
  onClose,
  user,
}) {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState('all'); // 'all', 'unread'

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleAction = (notification, action) => {
    // TODO: Implement actual action handling
    console.log(`Action: ${action} for notification:`, notification);
    markAsRead(notification.id);
  };

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const isToday = notification.time.includes('hour') || notification.time.includes('minute');
    const isThisWeek = notification.time.includes('day');
    
    let group = 'Earlier';
    if (isToday) group = 'Today';
    else if (isThisWeek) group = 'This Week';
    
    if (!groups[group]) groups[group] = [];
    groups[group].push(notification);
    return groups;
  }, {});

  return (
    <div 
      className={`
        fixed top-0 right-0 bottom-0 w-full sm:w-96 z-50
        bg-base-100 shadow-2xl
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        flex flex-col
      `}
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-base-content/10">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-base-content">Notifications</h2>
          {unreadCount > 0 && (
            <span className="badge badge-primary badge-sm">{unreadCount} new</span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-ghost btn-sm btn-square"
          aria-label="Close notifications"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-b border-base-content/10">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`btn btn-sm ${filter === 'unread' ? 'btn-primary' : 'btn-ghost'}`}
        >
          Unread ({unreadCount})
        </button>
        <div className="flex-1" />
        {unreadCount > 0 && (
          <button type="button" onClick={markAllAsRead} className="link link-primary text-sm">
            Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <div className="w-16 h-16 mb-4 rounded-full bg-base-200 flex items-center justify-center">
              <svg className="w-8 h-8 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-base-content font-medium">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="text-sm text-base-content/60 mt-1">
              {filter === 'unread' ? "You're all caught up!" : "We'll notify you when something happens"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-base-content/10">
            {Object.entries(groupedNotifications).map(([group, items]) => (
              <div key={group}>
                <div className="px-4 py-2 bg-base-200">
                  <span className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                    {group}
                  </span>
                </div>
                {items.map((notification) => (
                  <NotificationItem 
                    key={notification.id}
                    notification={notification}
                    onRead={() => markAsRead(notification.id)}
                    onAction={handleAction}
                    onClose={onClose}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-base-content/10">
        <Link href="/notifications" onClick={onClose} className="block w-full py-2 text-center text-sm font-medium link link-primary">
          View all notifications
        </Link>
      </div>
    </div>
  );
}

function NotificationItem({ notification, onRead, onAction, onClose }) {
  const icon = notificationIcons[notification.type] || notificationIcons.tree_update;
  const colorClass = notificationColors[notification.type] || notificationColors.tree_update;

  const handleClick = () => {
    if (!notification.read) {
      onRead();
    }
    if (notification.link) {
      onClose();
    }
  };

  const content = (
    <div 
      className={`px-4 py-4 flex gap-3 transition-colors cursor-pointer hover:bg-base-200 ${!notification.read ? 'bg-primary/5' : ''}`}
      onClick={handleClick}
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium ${!notification.read ? 'text-base-content' : 'text-base-content/70'}`}>
            {notification.title}
          </p>
          {!notification.read && (
            <span className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-primary" />
          )}
        </div>
        <p className="text-sm text-base-content/60 mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        {notification.metadata?.treeName && (
          <p className="text-xs text-base-content/50 mt-1">In: {notification.metadata.treeName}</p>
        )}
        <p className="text-xs text-base-content/50 mt-1">{notification.time}</p>

        {notification.actions && (
          <div className="flex gap-2 mt-3">
            {notification.actions.includes('approve') && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onAction(notification, 'approve'); }}
                className="btn btn-primary btn-sm"
              >
                Approve
              </button>
            )}
            {notification.actions.includes('deny') && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onAction(notification, 'deny'); }}
                className="btn btn-ghost btn-sm"
              >
                Deny
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (notification.link && !notification.actions) {
    return (
      <Link href={notification.link}>
        {content}
      </Link>
    );
  }

  return content;
}


