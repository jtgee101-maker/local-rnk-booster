/**
 * Domain Configuration Utility
 * Centralizes domain management for emails, links, and redirects
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Get the production domain from AppConfig entity
 * Falls back to default domain if not configured
 */
export async function getProductionDomain(base44Client) {
  try {
    const configs = await base44Client.asServiceRole.entities.AppConfig.filter({
      config_key: 'production_domain',
      is_active: true
    });
    
    if (configs && configs.length > 0) {
      return configs[0].config_value;
    }
  } catch (error) {
    console.log('Failed to fetch production domain, using default:', error.message);
  }
  
  // Fallback to default domain
  return 'https://localrnk.com';
}

/**
 * Build a full URL with the production domain
 */
export async function buildProductionUrl(base44Client, path) {
  const domain = await getProductionDomain(base44Client);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${domain}${cleanPath}`;
}

/**
 * Initialize domain config if not exists
 */
export async function initializeDomainConfig(base44Client) {
  try {
    const existing = await base44Client.asServiceRole.entities.AppConfig.filter({
      config_key: 'production_domain'
    });
    
    if (!existing || existing.length === 0) {
      await base44Client.asServiceRole.entities.AppConfig.create({
        config_key: 'production_domain',
        config_value: 'https://localrnk.com',
        category: 'domain',
        is_active: true,
        description: 'Production domain for email links and redirects'
      });
      console.log('Domain config initialized');
    }
  } catch (error) {
    console.error('Failed to initialize domain config:', error);
  }
}