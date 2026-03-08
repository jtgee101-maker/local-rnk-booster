/**
 * Admin_DEPRECATED — registered in platform page registry, cannot be fully removed.
 * Redirects permanently to AdminControlCenter.
 */
import { useEffect } from 'react';
import { createPageUrl } from '@/utils';

export default function AdminDeprecated() {
  useEffect(() => {
    window.location.replace(createPageUrl('AdminControlCenter'));
  }, []);
  return null;
}