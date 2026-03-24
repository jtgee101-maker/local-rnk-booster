/**
 * Verify Domain Function
 * 
 * Handles DNS verification, CNAME validation, and SSL certificate
 * provisioning for custom domains via Netlify/Cloudflare APIs.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler } from '../utils/errorHandler';

// DNS record types for verification
interface DNSRecord {
  type: 'CNAME' | 'A' | 'TXT';
  name: string;
  value: string;
  ttl?: number;
}

// Expected DNS configuration
interface DNSConfig {
  records: DNSRecord[];
  instructions: string[];
}

// SSL certificate status
interface SSLStatus {
  status: 'pending' | 'active' | 'error' | 'renewing';
  certificateId?: string;
  expiresAt?: string;
  error?: string;
}

// Get expected DNS configuration for a domain
function getExpectedDNSConfig(domain: string, subdomain?: string): DNSConfig {
  // For apex domains (e.g., example.com)
  if (!domain.includes('www.') && domain.split('.').length === 2) {
    return {
      records: [
        {
          type: 'A',
          name: '@',
          value: Deno.env.get('NETLIFY_LOAD_BALANCER_IP') || '75.2.60.5',
          ttl: 3600
        },
        {
          type: 'A',
          name: 'www',
          value: Deno.env.get('NETLIFY_LOAD_BALANCER_IP') || '75.2.60.5',
          ttl: 3600
        }
      ],
      instructions: [
        `Add an A record for @ pointing to our server`,
        `Optionally add an A record for www subdomain`,
        `Wait for DNS propagation (up to 24 hours)`
      ]
    };
  }
  
  // For subdomains (e.g., app.example.com or www.example.com)
  return {
    records: [
      {
        type: 'CNAME',
        name: subdomain || 'www',
        value: 'localrnk.netlify.app',
        ttl: 3600
      }
    ],
    instructions: [
      `Add a CNAME record for ${subdomain || 'www'} pointing to localrnk.netlify.app`,
      `Wait for DNS propagation (up to 24 hours)`
    ]
  };
}

// Verify DNS records for a domain
async function verifyDNSRecords(domain: string): Promise<{
  verified: boolean;
  records: DNSRecord[];
  errors: string[];
}> {
  const errors: string[] = [];
  const records: DNSRecord[] = [];
  
  try {
    // Query DNS using Google DNS-over-HTTPS
    const dnsTypes = ['A', 'CNAME', 'TXT'];
    
    for (const type of dnsTypes) {
      try {
        const response = await fetch(
          `https://dns.google/resolve?name=${domain}&type=${type}`,
          { headers: { 'Accept': 'application/dns-json' } }
        );
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        if (data.Answer) {
          for (const answer of data.Answer) {
            records.push({
              type: type as DNSRecord['type'],
              name: answer.name,
              value: answer.data,
              ttl: answer.TTL
            });
          }
        }
      } catch (e) {
        console.warn(`Failed to query ${type} records for ${domain}:`, e);
      }
    }
    
    // Check if any record points to our infrastructure
    const expectedConfig = getExpectedDNSConfig(domain);
    let hasValidRecord = false;
    
    for (const expected of expectedConfig.records) {
      const match = records.find(r => {
        if (expected.type === 'A' && r.type === 'A') {
          return true; // Any A record is acceptable for apex
        }
        if (expected.type === 'CNAME' && r.type === 'CNAME') {
          return r.value.toLowerCase().includes('netlify') || 
                 r.value.toLowerCase().includes('localrnk');
        }
        return false;
      });
      
      if (match) {
        hasValidRecord = true;
      }
    }
    
    if (!hasValidRecord) {
      errors.push('No valid DNS records found pointing to LocalRNK infrastructure');
    }
    
    return {
      verified: hasValidRecord,
      records,
      errors
    };
  } catch (error) {
    console.error('DNS verification error:', error);
    return {
      verified: false,
      records,
      errors: ['Failed to verify DNS records']
    };
  }
}

// Provision SSL certificate via Netlify
async function provisionNetlifySSL(domain: string): Promise<SSLStatus> {
  const netlifyToken = Deno.env.get('NETLIFY_API_TOKEN');
  const siteId = Deno.env.get('NETLIFY_SITE_ID');
  
  if (!netlifyToken || !siteId) {
    return {
      status: 'error',
      error: 'Netlify API not configured'
    };
  }
  
  try {
    // Add domain to Netlify site
    const addDomainResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/domain`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${netlifyToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          domain,
          auto_ssl: true
        })
      }
    );
    
    if (!addDomainResponse.ok) {
      const error = await addDomainResponse.text();
      throw new Error(`Failed to add domain: ${error}`);
    }
    
    // Check SSL status
    const sslResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/ssl`,
      {
        headers: {
          'Authorization': `Bearer ${netlifyToken}`
        }
      }
    );
    
    if (sslResponse.ok) {
      const sslData = await sslResponse.json();
      
      return {
        status: sslData.state === 'ready' ? 'active' : 'pending',
        certificateId: sslData.cert_id,
        expiresAt: sslData.expires_at
      };
    }
    
    return {
      status: 'pending'
    };
  } catch (error) {
    console.error('SSL provisioning error:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'SSL provisioning failed'
    };
  }
}

// Provision SSL certificate via Cloudflare
async function provisionCloudflareSSL(domain: string): Promise<SSLStatus> {
  const cloudflareToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
  const zoneId = Deno.env.get('CLOUDFLARE_ZONE_ID');
  
  if (!cloudflareToken || !zoneId) {
    return {
      status: 'error',
      error: 'Cloudflare API not configured'
    };
  }
  
  try {
    // Add hostname to Cloudflare
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloudflareToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: domain,
          ssl: {
            method: 'http',
            type: 'dv',
            settings: {
              min_tls_version: '1.2',
              cipher_suites: [
                'ECDHE-RSA-AES128-GCM-SHA256',
                'ECDHE-RSA-AES256-GCM-SHA384'
              ]
            }
          }
        })
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudflare API error: ${error}`);
    }
    
    const data = await response.json();
    
    return {
      status: data.result.ssl.status === 'active' ? 'active' : 'pending',
      certificateId: data.result.id
    };
  } catch (error) {
    console.error('Cloudflare SSL error:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Cloudflare SSL failed'
    };
  }
}

// Main handler
Deno.serve(withDenoErrorHandler(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;
  
  // GET /api/tenants/:tenantId/domain/status - Check domain status
  if (req.method === 'GET' && path.match(/\/tenants\/[^/]+\/domain\/status$/)) {
    const tenantId = path.split('/')[3];
    
    try {
      const base44 = createClientFromRequest(req);
      const tenant = await base44.asServiceRole.entities.Tenant.get(tenantId);
      
      if (!tenant) {
        return Response.json({
          error: 'Tenant not found',
          code: 'TENANT_NOT_FOUND'
        }, { status: 404 });
      }
      
      if (!tenant.custom_domain) {
        return Response.json({
          hasCustomDomain: false,
          message: 'No custom domain configured'
        });
      }
      
      // Verify DNS
      const dnsResult = await verifyDNSRecords(tenant.custom_domain);
      
      return Response.json({
        hasCustomDomain: true,
        domain: tenant.custom_domain,
        verified: tenant.domain_verified,
        sslStatus: tenant.ssl_status,
        dnsCheck: {
          verified: dnsResult.verified,
          records: dnsResult.records,
          errors: dnsResult.errors
        },
        expectedDNS: getExpectedDNSConfig(tenant.custom_domain),
        ssl: tenant.ssl_status === 'active' ? {
          status: 'active',
          expiresAt: tenant.ssl_expires_at
        } : {
          status: tenant.ssl_status
        }
      });
    } catch (error) {
      console.error('Error checking domain status:', error);
      return Response.json({
        error: 'Failed to check domain status',
        code: 'CHECK_FAILED'
      }, { status: 500 });
    }
  }
  
  // POST /api/tenants/:tenantId/domain/verify - Verify domain
  if (req.method === 'POST' && path.match(/\/tenants\/[^/]+\/domain\/verify$/)) {
    const tenantId = path.split('/')[3];
    
    try {
      const base44 = createClientFromRequest(req);
      const tenant = await base44.asServiceRole.entities.Tenant.get(tenantId);
      
      if (!tenant) {
        return Response.json({
          error: 'Tenant not found',
          code: 'TENANT_NOT_FOUND'
        }, { status: 404 });
      }
      
      if (!tenant.custom_domain) {
        return Response.json({
          error: 'No custom domain configured',
          code: 'NO_CUSTOM_DOMAIN'
        }, { status: 400 });
      }
      
      // Verify DNS
      const dnsResult = await verifyDNSRecords(tenant.custom_domain);
      
      // Update tenant with verification status
      await base44.asServiceRole.entities.Tenant.update(tenantId, {
        domain_verified: dnsResult.verified,
        domain_verified_at: dnsResult.verified ? new Date().toISOString() : null,
        dns_records: dnsResult.records
      });
      
      return Response.json({
        success: true,
        domain: tenant.custom_domain,
        verified: dnsResult.verified,
        records: dnsResult.records,
        errors: dnsResult.errors,
        expectedDNS: getExpectedDNSConfig(tenant.custom_domain),
        nextSteps: dnsResult.verified ? [
          'Domain verified successfully!',
          'SSL certificate will be provisioned automatically'
        ] : [
          'Update your DNS records according to the instructions above',
          'Wait for DNS propagation (can take up to 24 hours)',
          'Retry verification after DNS has propagated'
        ]
      });
    } catch (error) {
      console.error('Error verifying domain:', error);
      return Response.json({
        error: 'Failed to verify domain',
        code: 'VERIFICATION_FAILED'
      }, { status: 500 });
    }
  }
  
  // POST /api/tenants/:tenantId/domain/ssl - Provision SSL
  if (req.method === 'POST' && path.match(/\/tenants\/[^/]+\/domain\/ssl$/)) {
    const tenantId = path.split('/')[3];
    
    try {
      const base44 = createClientFromRequest(req);
      const tenant = await base44.asServiceRole.entities.Tenant.get(tenantId);
      
      if (!tenant) {
        return Response.json({
          error: 'Tenant not found',
          code: 'TENANT_NOT_FOUND'
        }, { status: 404 });
      }
      
      if (!tenant.custom_domain) {
        return Response.json({
          error: 'No custom domain configured',
          code: 'NO_CUSTOM_DOMAIN'
        }, { status: 400 });
      }
      
      if (!tenant.domain_verified) {
        return Response.json({
          error: 'Domain not verified. Please verify domain first.',
          code: 'DOMAIN_NOT_VERIFIED'
        }, { status: 400 });
      }
      
      // Try Netlify first, then Cloudflare as fallback
      let sslStatus = await provisionNetlifySSL(tenant.custom_domain);
      
      if (sslStatus.status === 'error') {
        sslStatus = await provisionCloudflareSSL(tenant.custom_domain);
      }
      
      // Update tenant with SSL status
      await base44.asServiceRole.entities.Tenant.update(tenantId, {
        ssl_status: sslStatus.status,
        ssl_certificate_id: sslStatus.certificateId,
        ssl_expires_at: sslStatus.expiresAt
      });
      
      // Log the action
      await base44.asServiceRole.entities.TenantAuditLog.create({
        tenant_id: tenantId,
        action: 'ssl_provisioned',
        entity_type: 'domain',
        entity_id: tenantId,
        new_values: {
          ssl_status: sslStatus.status,
          certificate_id: sslStatus.certificateId
        },
        metadata: {
          domain: tenant.custom_domain,
          provider: sslStatus.status !== 'error' ? 'auto' : null
        }
      });
      
      return Response.json({
        success: sslStatus.status !== 'error',
        domain: tenant.custom_domain,
        ssl: sslStatus,
        message: sslStatus.status === 'active' 
          ? 'SSL certificate is active'
          : sslStatus.status === 'pending'
          ? 'SSL certificate is being provisioned'
          : 'Failed to provision SSL certificate'
      });
    } catch (error) {
      console.error('Error provisioning SSL:', error);
      return Response.json({
        error: 'Failed to provision SSL',
        code: 'SSL_PROVISIONING_FAILED'
      }, { status: 500 });
    }
  }
  
  // POST /api/tenants/:tenantId/domain - Update custom domain
  if (req.method === 'POST' && path.match(/\/tenants\/[^/]+\/domain$/)) {
    const tenantId = path.split('/')[3];
    
    try {
      const body = await req.json();
      const { custom_domain, action = 'add' } = body;
      
      if (action === 'remove') {
        // Remove custom domain
        const base44 = createClientFromRequest(req);
        await base44.asServiceRole.entities.Tenant.update(tenantId, {
          custom_domain: null,
          domain_verified: false,
          domain_verified_at: null,
          ssl_status: 'active',
          ssl_certificate_id: null,
          ssl_expires_at: null
        });
        
        return Response.json({
          success: true,
          message: 'Custom domain removed'
        });
      }
      
      // Validate domain
      if (!custom_domain || !/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(custom_domain)) {
        return Response.json({
          error: 'Invalid domain format',
          code: 'INVALID_DOMAIN'
        }, { status: 400 });
      }
      
      const base44 = createClientFromRequest(req);
      
      // Check if domain is already in use
      const existing = await base44.asServiceRole.entities.Tenant.filter(
        { custom_domain: custom_domain.toLowerCase() },
        { limit: 1 }
      );
      
      if (existing.length > 0 && existing[0].id !== tenantId) {
        return Response.json({
          error: 'Domain is already in use by another tenant',
          code: 'DOMAIN_IN_USE'
        }, { status: 409 });
      }
      
      // Update tenant with new domain
      await base44.asServiceRole.entities.Tenant.update(tenantId, {
        custom_domain: custom_domain.toLowerCase(),
        domain_verified: false,
        ssl_status: 'pending'
      });
      
      return Response.json({
        success: true,
        domain: custom_domain.toLowerCase(),
        expectedDNS: getExpectedDNSConfig(custom_domain.toLowerCase()),
        nextSteps: [
          'Update your DNS records according to the instructions',
          'Wait for DNS propagation',
          'Verify the domain to complete setup'
        ]
      });
    } catch (error) {
      console.error('Error updating domain:', error);
      return Response.json({
        error: 'Failed to update domain',
        code: 'UPDATE_FAILED'
      }, { status: 500 });
    }
  }
  
  // Default: return API documentation
  return Response.json({
    message: 'Domain Verification API',
    endpoints: [
      { method: 'GET', path: '/api/tenants/:tenantId/domain/status', description: 'Check domain verification status' },
      { method: 'POST', path: '/api/tenants/:tenantId/domain/verify', description: 'Verify domain DNS records' },
      { method: 'POST', path: '/api/tenants/:tenantId/domain/ssl', description: 'Provision SSL certificate' },
      { method: 'POST', path: '/api/tenants/:tenantId/domain', description: 'Add or remove custom domain' }
    ]
  });
}));
