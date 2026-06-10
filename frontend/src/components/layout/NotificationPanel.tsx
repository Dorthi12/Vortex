'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCheck, AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useUiStore } from '@/store/useUiStore';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface NotificationItem {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'danger',
    title: 'Anomalies in Digital Twin',
    desc: 'Simulation run #148 detected 12 architectural anomalies in Infrastructure Sector 4B.',
    time: '12 mins ago',
    unread: true,
  },
  {
    id: 'n2',
    type: 'warning',
    title: 'Council Vote Pending',
    desc: 'Governance Council policy review for "AI Ethics Bill" requires your sign-off by tomorrow.',
    time: '2 hours ago',
    unread: true,
  },
  {
    id: 'n3',
    type: 'success',
    title: 'Model Deployment Completed',
    desc: 'Policy Intelligence NLP analysis model v3.2 is now fully integrated and serving API requests.',
    time: '5 hours ago',
    unread: false,
  },
  {
    id: 'n4',
    type: 'info',
    title: 'Database Sync Completed',
    desc: 'Command Center real-time statistics have been synchronized with the State Data Center.',
    time: '1 day ago',
    unread: false,
  },
];

export function NotificationPanel() {
  const { 
    notificationPanelOpen, 
    setNotificationPanelOpen 
  } = useUiStore();

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-success shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-warning shrink-0" />,
    danger: <AlertCircle className="w-4 h-4 text-danger shrink-0" />,
    info: <Info className="w-4 h-4 text-info shrink-0" />,
  };

  const indicatorClasses = {
    success: 'bg-success/10 border-success/20',
    warning: 'bg-warning/10 border-warning/20',
    danger: 'bg-danger/10 border-danger/20',
    info: 'bg-info/10 border-info/20',
  };

  return (
    <AnimatePresence>
      {notificationPanelOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setNotificationPanelOpen(false)}
          />

          {/* Sliding panel drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed top-0 bottom-0 right-0 z-50 w-full sm:max-w-md bg-card border-l border-border flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle bg-gov-navy text-neutral-white">
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-wide text-base font-sans">Notifications</span>
                <span className="bg-royal-blue text-xs px-2 py-0.5 rounded-full font-bold">2 New</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-neutral-white/80 hover:bg-slate-800 rounded-full"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNotificationPanelOpen(false)}
                  className="h-8 w-8 text-neutral-white/80 hover:bg-slate-800 rounded-full"
                  aria-label="Close notifications panel"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border-subtle dark:divide-slate-800">
              {MOCK_NOTIFICATIONS.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'p-5 transition-colors flex gap-3.5 relative group hover:bg-slate-50/50 dark:hover:bg-slate-900/30',
                    item.unread && 'bg-slate-50/70 dark:bg-slate-900/20'
                  )}
                >
                  {/* Alert priority color code circle */}
                  <div className={cn('h-8 w-8 rounded-full border flex items-center justify-center shrink-0', indicatorClasses[item.type])}>
                    {icons[item.type]}
                  </div>

                  {/* Body text details */}
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className={cn('text-sm font-semibold', item.unread ? 'text-neutral-text dark:text-neutral-white' : 'text-neutral-text-muted')}>
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-neutral-text-muted shrink-0 ml-2 mt-0.5">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-text-muted leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  {/* Left unread bar indicator */}
                  {item.unread && (
                    <span className="absolute top-0 bottom-0 left-0 w-1 bg-royal-blue" />
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border-subtle text-center bg-slate-50 dark:bg-slate-900/50">
              <Button variant="outline" className="w-full text-xs font-semibold hover:bg-slate-100">
                View All Notifications Log
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
