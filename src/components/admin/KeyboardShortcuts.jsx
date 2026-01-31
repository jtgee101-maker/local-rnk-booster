import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Command } from 'lucide-react';

export default function KeyboardShortcuts({ onNavigate }) {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Command palette: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowHelp(true);
        return;
      }

      // Quick navigation shortcuts (only if not in input)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // G then L = Go to Leads
      if (e.key === 'g') {
        const secondKeyHandler = (e2) => {
          if (e2.key === 'l') onNavigate?.('leads');
          if (e2.key === 'o') onNavigate?.('orders');
          if (e2.key === 'a') onNavigate?.('analytics');
          if (e2.key === 's') onNavigate?.('settings');
          if (e2.key === 'h') onNavigate?.('overview');
          window.removeEventListener('keydown', secondKeyHandler);
        };
        window.addEventListener('keydown', secondKeyHandler);
        setTimeout(() => window.removeEventListener('keydown', secondKeyHandler), 2000);
      }

      // R = Refresh
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        window.location.reload();
      }

      // ? = Show help
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setShowHelp(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onNavigate]);

  const shortcuts = [
    { key: 'Ctrl + K', action: 'Command palette', category: 'Navigation' },
    { key: '?', action: 'Show keyboard shortcuts', category: 'Help' },
    { key: 'R', action: 'Refresh dashboard', category: 'Actions' },
    { key: 'G then L', action: 'Go to Leads', category: 'Navigation' },
    { key: 'G then O', action: 'Go to Orders', category: 'Navigation' },
    { key: 'G then A', action: 'Go to Analytics', category: 'Navigation' },
    { key: 'G then S', action: 'Go to Settings', category: 'Navigation' },
    { key: 'G then H', action: 'Go to Home/Overview', category: 'Navigation' },
  ];

  const categories = [...new Set(shortcuts.map(s => s.category))];

  return (
    <Dialog open={showHelp} onOpenChange={setShowHelp}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="w-5 h-5 text-[#c8ff00]" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {categories.map(category => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">{category}</h3>
              <div className="space-y-2">
                {shortcuts.filter(s => s.category === category).map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                    <span className="text-white text-sm">{shortcut.action}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {shortcut.key}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-700">
          Press <kbd className="px-2 py-1 bg-gray-900 rounded">?</kbd> anytime to show this help
        </div>
      </DialogContent>
    </Dialog>
  );
}