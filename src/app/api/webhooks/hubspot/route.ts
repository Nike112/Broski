import { NextRequest, NextResponse } from 'next/server';
import { RealtimeDataManager } from '@/lib/realtime-data-manager';

// POST /api/webhooks/hubspot - HubSpot webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle different HubSpot events
    switch (body.subscriptionType) {
      case 'contact.creation':
        RealtimeDataManager.handleWebhook('hubspot', {
          subscriptionType: body.subscriptionType,
          data: {
            contact: body.data
          }
        });
        break;
        
      case 'deal.creation':
        RealtimeDataManager.handleWebhook('hubspot', {
          subscriptionType: body.subscriptionType,
          data: {
            deal: body.data,
            amount: body.data.properties?.amount || 0
          }
        });
        break;
        
      case 'deal.propertyChange':
        if (body.data.properties?.dealstage === 'closedwon') {
          RealtimeDataManager.handleWebhook('hubspot', {
            subscriptionType: 'deal.won',
            data: {
              deal: body.data,
              amount: body.data.properties?.amount || 0
            }
          });
        }
        break;
        
      default:
        console.log(`Unhandled HubSpot event type: ${body.subscriptionType}`);
    }
    
    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error('HubSpot webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
