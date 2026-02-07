/**
 * White-Label DNS Validation
 * Validates CNAME and A records for custom domains
 */

import dns from 'dns';
import { promisify } from 'util';

const resolveCname = promisify(dns.resolveCname);
const resolve4 = promisify(dns.resolve4);
const resolveTxt = promisify(dns.resolveTxt);

interface DNSValidationResult {
  valid: boolean;
  domain: string;
  checks: {
    cname: { valid: boolean; value?: string; error?: string };
    aRecord: { valid: boolean; value?: string[]; error?: string };
    txtVerification: { valid: boolean; value?: string; error?: string };
  };
  message: string;
}

/**
 * Validate DNS configuration for white-label domain
 */
export async function validateDNS(domain: string): Promise<DNSValidationResult> {
  const expectedCname = 'localrnk.com';
  const expectedARecord = process.env.PRIMARY_IP || ''; // Your Cloudflare/Render IP
  
  const result: DNSValidationResult = {
    valid: false,
    domain,
    checks: {
      cname: { valid: false },
      aRecord: { valid: false },
      txtVerification: { valid: false }
    },
    message: ''
  };

  try {
    // Check CNAME record (for www subdomain)
    try {
      const cnameRecords = await resolveCname(`www.${domain}`);
      result.checks.cname.value = cnameRecords[0];
      
      if (cnameRecords.includes(expectedCname) || cnameRecords.includes(`${expectedCname}.`)) {
        result.checks.cname.valid = true;
      } else {
        result.checks.cname.error = `CNAME points to ${cnameRecords[0]} instead of ${expectedCname}`;
      }
    } catch (error: any) {
      result.checks.cname.error = error.code === 'ENODATA' 
        ? 'CNAME record not found' 
        : error.message;
    }

    // Check A record (for root domain)
    try {
      const aRecords = await resolve4(domain);
      result.checks.aRecord.value = aRecords;
      
      if (aRecords.length > 0) {
        result.checks.aRecord.valid = true;
        // Note: We accept any A record since Cloudflare proxying may change IPs
      }
    } catch (error: any) {
      result.checks.aRecord.error = error.code === 'ENODATA'
        ? 'A record not found'
        : error.message;
    }

    // Check TXT verification record (for ownership proof)
    const verificationCode = generateVerificationCode(domain);
    try {
      const txtRecords = await resolveTxt(domain);
      const flatRecords = txtRecords.flat();
      
      const verificationRecord = flatRecords.find(record => 
        record.startsWith('localrnk-verification=')
      );
      
      if (verificationRecord) {
        const code = verificationRecord.split('=')[1];
        result.checks.txtVerification.valid = code === verificationCode;
        result.checks.txtVerification.value = code;
        
        if (!result.checks.txtVerification.valid) {
          result.checks.txtVerification.error = 'Verification code mismatch';
        }
      } else {
        result.checks.txtVerification.error = 'Verification TXT record not found';
      }
    } catch (error: any) {
      result.checks.txtVerification.error = error.code === 'ENODATA'
        ? 'No TXT records found'
        : error.message;
    }

    // Determine overall validity
    // Domain is valid if either CNAME or A record is configured, and TXT verification passes
    result.valid = (result.checks.cname.valid || result.checks.aRecord.valid) && 
                   result.checks.txtVerification.valid;

    // Generate message
    if (result.valid) {
      result.message = 'Domain is properly configured and verified';
    } else {
      const issues = [];
      if (!result.checks.cname.valid && !result.checks.aRecord.valid) {
        issues.push('DNS records not pointing to localrnk.com');
      }
      if (!result.checks.txtVerification.valid) {
        issues.push('Domain ownership not verified');
      }
      result.message = `Configuration issues: ${issues.join(', ')}`;
    }

  } catch (error: any) {
    result.message = `DNS validation error: ${error.message}`;
  }

  return result;
}

/**
 * Generate verification code for domain ownership
 */
function generateVerificationCode(domain: string): string {
  const crypto = require('crypto');
  const secret = process.env.WHITELABEL_SECRET || 'default-secret-change-me';
  
  return crypto
    .createHmac('sha256', secret)
    .update(domain)
    .digest('hex')
    .substring(0, 32);
}

/**
 * Get DNS configuration instructions for customer
 */
export function getDNSInstructions(domain: string) {
  const verificationCode = generateVerificationCode(domain);
  
  return {
    domain,
    verificationCode,
    records: [
      {
        type: 'CNAME',
        name: 'www',
        value: 'localrnk.com',
        ttl: 3600,
        notes: 'Points your www subdomain to our platform'
      },
      {
        type: 'A',
        name: '@',
        value: 'AUTO (Cloudflare Proxy)',
        ttl: 'AUTO',
        notes: 'Root domain - use Cloudflare proxy or contact support'
      },
      {
        type: 'TXT',
        name: '@',
        value: `localrnk-verification=${verificationCode}`,
        ttl: 3600,
        notes: 'Verification code - DO NOT modify'
      }
    ],
    instructions: [
      '1. Log in to your domain registrar (GoDaddy, Namecheap, etc.)',
      '2. Find DNS Management or DNS Settings',
      '3. Add the records shown above',
      '4. Wait 5-30 minutes for DNS propagation',
      '5. Click "Verify DNS" button to check configuration'
    ],
    estimatedPropagationTime: '5-30 minutes',
    troubleshooting: {
      'Records not updating': 'DNS changes can take up to 48 hours in rare cases',
      'CNAME vs A record': 'Use CNAME for www, and either CNAME flattening or A record for root domain',
      'Cloudflare users': 'Disable proxy (grey cloud) initially, enable after verification'
    }
  };
}

/**
 * Check DNS propagation status
 */
export async function checkPropagation(domain: string): Promise<{
  propagated: boolean;
  nameservers: string[];
  responsive: number;
  total: number;
}> {
  const publicDNS = [
    '8.8.8.8',        // Google
    '1.1.1.1',        // Cloudflare
    '208.67.222.222', // OpenDNS
    '9.9.9.9',        // Quad9
  ];

  let responsive = 0;
  const nameservers: string[] = [];

  for (const dnsServer of publicDNS) {
    try {
      const resolver = new dns.Resolver();
      resolver.setServers([dnsServer]);
      
      const resolve = promisify(resolver.resolve4.bind(resolver));
      await resolve(domain);
      
      responsive++;
      nameservers.push(dnsServer);
    } catch (error) {
      // DNS not yet propagated to this server
    }
  }

  return {
    propagated: responsive >= publicDNS.length / 2, // At least 50% propagated
    nameservers,
    responsive,
    total: publicDNS.length
  };
}

// Base44 function export
export default async function handler(req: any) {
  const { domain } = req.query;

  if (!domain) {
    return {
      status: 400,
      body: { error: 'Domain parameter required' }
    };
  }

  // Validate domain format
  const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
  if (!domainRegex.test(domain)) {
    return {
      status: 400,
      body: { error: 'Invalid domain format' }
    };
  }

  try {
    const validation = await validateDNS(domain);
    const propagation = await checkPropagation(domain);
    const instructions = getDNSInstructions(domain);

    return {
      status: 200,
      body: {
        validation,
        propagation,
        instructions
      }
    };
  } catch (error: any) {
    return {
      status: 500,
      body: { error: error.message }
    };
  }
}
