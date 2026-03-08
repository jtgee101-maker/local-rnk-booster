import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * seedRequiredSettings — idempotent seeder for critical AppSettings rows.
 *
 * Run this once after first deployment (or call from admin UI) to ensure
 * the platform doesn't silently fail due to missing config.
 *
 * Safe to run multiple times — uses upsert logic (creates only if absent).
 *
 * Admin-only.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const results = [];

    async function upsert(key, value, category, description) {
      const existing = await base44.asServiceRole.entities.AppSettings.filter({ setting_key: key });
      if (existing.length === 0) {
        await base44.asServiceRole.entities.AppSettings.create({
          setting_key: key,
          setting_value: value,
          category,
          description
        });
        results.push({ key, action: 'created', value });
      } else {
        results.push({ key, action: 'already_exists', current_value: existing[0].setting_value });
      }
    }

    // ── Required settings ─────────────────────────────────────────────────────

    // HIGHEST RISK: Without this, every lead hits "Coming Soon" on BridgeGeenius
    await upsert(
      'geenius_pathways',
      {
        pathway1_url: 'https://REPLACE_WITH_REAL_GOVTECH_URL.com',
        pathway2_url: 'https://REPLACE_WITH_REAL_DFY_URL.com',
        pathway3_checkout_url: 'https://REPLACE_WITH_REAL_DIY_CHECKOUT_URL.com'
      },
      'general',
      'Pathway destination URLs shown on BridgeGeenius. All three must be valid https:// URLs not containing example.com before the page renders to users.'
    );

    // Admin notification email — without this, admin never learns about new leads
    await upsert(
      'admin_email',
      { email: 'REPLACE_WITH_ADMIN_EMAIL@yourdomain.com' },
      'email',
      'Admin email address for new lead notifications. Set setting_value.email to your real admin address.'
    );

    // Production domain for email link generation
    await upsert(
      'production_domain',
      'https://localrank.ai',
      'general',
      'Root domain used in email links (bridge URL, results URL). Must match deployed domain.'
    );

    const missing = results.filter(r => r.action === 'created');
    const existing = results.filter(r => r.action === 'already_exists');

    console.log(`[seedRequiredSettings] created=${missing.length} already_existed=${existing.length}`);

    return Response.json({
      success: true,
      summary: {
        created: missing.length,
        already_existed: existing.length
      },
      details: results,
      action_required: missing.length > 0
        ? `${missing.length} setting(s) were created with placeholder values. Update them in AppSettings before sending traffic to BridgeGeenius.`
        : 'All required settings already exist. Verify their values are not placeholders.'
    });

  } catch (err) {
    console.error('[seedRequiredSettings] error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});