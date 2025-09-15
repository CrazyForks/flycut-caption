// 消息中心触发按钮组件
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Bell } from 'lucide-react';
import { useUnreadCount } from '@/stores/messageStore';
import { MessageCenter } from './MessageCenter';

export function MessageCenterButton() {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = useUnreadCount();

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
          isOpen && 'bg-muted'
        )}
        title="消息中心"
      >
        <Bell className="h-5 w-5 text-foreground" />
        
        {/* 未读计数徽章 */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs font-medium rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      <MessageCenter 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}