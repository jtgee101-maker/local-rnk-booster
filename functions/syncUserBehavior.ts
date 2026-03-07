import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Check if tracking is enabled (global feature flag)
    const trackingSettings = await base44.asServiceRole.entities.AppSettings.filter({
      setting_key: 'behavioral_tracking_enabled'
    });

    const isTrackingEnabled = trackingSettings[0]?.setting_value?.enabled !== false;

    if (!isTrackingEnabled) {
      return Response.json({ 
        success: false, 
        message: 'Behavioral tracking is currently disabled' 
      });
    }

    // Create or update user behavior record
    const existingRecord = await base44.asServiceRole.entities.UserBehavior.filter({
      session_id: payload.session_id
    });

    let savedRecord;
    if (existingRecord.length > 0) {
      // Update existing
      savedRecord = await base44.asServiceRole.entities.UserBehavior.update(
        existingRecord[0].id,
        payload
      );
    } else {
      // Create new
      savedRecord = await base44.asServiceRole.entities.UserBehavior.create(payload);
    }

    return Response.json({ 
      success: true, 
      record: savedRecord,
      engagement_score: payload.engagement_score 
    });

  } catch (error) {
    console.error('Error syncing behavior:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});