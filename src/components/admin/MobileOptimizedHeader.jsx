import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X, Shield, Clock, RefreshCw, Bell } from 'lucide-react';

export default function MobileOptimizedHeader({ lastRefresh, onRefresh, notificationCount = 0 }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 border-b border-gray-800/50 backdrop-blur-xl bg-[#0a0a0f]/90">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#c8ff00]/10 rounded-lg">
                <Shield className="w-4 h-4 text-[#c8ff00]" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white">Admin</h1>
                <p className="text-xs text-gray-500">Control Center</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={onRefresh}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <RefreshCw className="w-4 h-4 text-gray-400" />
              </Button>
              
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Menu className="w-5 h-5 text-gray-400" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-gray-900 border-gray-800 w-[280px]">
                  <SheetHeader>
                    <SheetTitle className="text-white">Quick Actions</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-2">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-300 hover:text-white"
                      onClick={() => {
                        onRefresh();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Data
                    </Button>
                    <div className="px-3 py-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Last updated: {lastRefresh?.toLocaleTimeString()}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header - Hidden on mobile */}
      <div className="hidden lg:block sticky top-0 z-50 border-b border-gray-800/50 backdrop-blur-xl bg-[#0a0a0f]/90">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#c8ff00]/10 rounded-lg">
                  <Shield className="w-6 h-6 text-[#c8ff00]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Super Admin Control Center</h1>
                  <p className="text-xs text-gray-400">Full system monitoring & control</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                Last refresh: {lastRefresh?.toLocaleTimeString()}
              </div>
              <Button 
                onClick={onRefresh}
                variant="outline"
                size="sm"
                className="gap-2 border-gray-700 hover:border-[#c8ff00] hover:text-[#c8ff00]"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}