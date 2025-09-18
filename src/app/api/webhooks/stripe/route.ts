import { NextRequest, NextResponse } from 'next/server';
import { RealtimeDataManager } from '@/lib/realtime-data-manager';
import { headers } from 'next/headers';

// POST /api/webhooks/stripe - Stripe webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');
    
    // Verify webhook signature (in production, use Stripe's webhook verification)
    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 400 }
      );
    }
    
    const event = JSON.parse(body);
    
    // Handle different Stripe events
    switch (event.type) {
      case 'invoice.payment_succeeded':
        RealtimeDataManager.handleWebhook('stripe', {
          type: event.type,
          data: {
            object: {
              amount_paid: event.data.object.amount_paid,
              customer: event.data.object.customer,
              subscription: event.data.object.subscription
            }
          }
        });
        break;
        
      case 'customer.subscription.created':
        RealtimeDataManager.handleWebhook('stripe', {
          type: event.type,
          data: {
            object: {
              amount_paid: event.data.object.items.data[0]?.price.unit_amount || 0,
              customer: event.data.object.customer
            }
          }
        });
        break;
        
      case 'customer.subscription.deleted':
        // Handle churn
        RealtimeDataManager.handleWebhook('stripe', {
          type: event.type,
          data: {
            object: {
              customer: event.data.object.customer
            }
          }
        });
        break;
        
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
    
    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
