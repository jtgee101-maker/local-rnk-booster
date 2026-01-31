// DEPRECATED: This file has been consolidated into AdminControlCenter.js
// All admin functionality is now accessible through /AdminControlCenter
// This file is kept temporarily for reference and will be removed in future cleanup

// Redirect to new admin control center
import { useEffect } from 'react';

export default function AdminDeprecated() {
  useEffect(() => {
    window.location.href = '/AdminControlCenter';
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400">Redirecting to Admin Control Center...</p>
      </div>
    </div>
  );
}