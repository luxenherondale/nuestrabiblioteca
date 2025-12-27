import React, { useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

const Notification = ({ type = 'success', message, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const styles = {
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      icon: Check
    },
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: X
    },
    warning: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      icon: AlertCircle
    }
  };

  const style = styles[type] || styles.success;
  const Icon = style.icon;

  return (
    <div className={`${style.bg} border ${style.border} rounded-lg p-4 ${style.text} flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:opacity-70 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Notification;
