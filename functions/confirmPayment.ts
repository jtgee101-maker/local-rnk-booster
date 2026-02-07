import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { paymentIntentId, leadData, planData, orderBumpAccepted } = await req.json();

    if (!paymentIntentId) {
      return Response.json({ error: 'Payment intent ID required' }, { status: 400 });
    }

    // MOCK MODE - SIMULATE SUCCESSFUL PAYMENT
    const mockAmount = (planData?.price || 99) + (orderBumpAccepted ? 49 : 0);
    
    const orderData = {
      lead_id: leadData?.id || null,
      email: leadData?.email,
      stripe_payment_intent: paymentIntentId,
      status: 'completed',
      total_amount: mockAmount,
      base_offer: {
        product: planData?.product || 'GMB Optimization & Audit',
        price: planData?.price || 99
      },
      order_bumps: orderBumpAccepted ? [{
        product: '5 Geo-Tagged Photos',
        price: 49,
        selected: true
      }] : []
    };

    const createdOrder = await base44.asServiceRole.entities.Order.create(orderData);

    // Send order confirmation email
    try {
      await base44.asServiceRole.functions.invoke('sendOrderConfirmation', {
        email: leadData?.email,
        businessName: leadData?.business_name,
        orderAmount: mockAmount,
        productName: planData?.product || 'GMB Optimization & Audit'
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    return Response.json({ 
      success: true,
      orderId: createdOrder.id 
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});