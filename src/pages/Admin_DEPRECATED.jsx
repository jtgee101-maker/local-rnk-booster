import { useEffect } from 'react';
import { createPageUrl } from '@/utils';

export default function AdminDeprecated() {
  useEffect(() => {
    window.location.replace(createPageUrl('AdminControlCenter'));
  }, []);
  return null;
}