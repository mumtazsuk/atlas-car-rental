import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("stripe-signature");
    const rawBody = await req.text();

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret || webhookSecret.includes("placeholder")) {
      // In development / demo mode, acknowledge safely
      return NextResponse.json({
        received: true,
        mode: "development_simulation",
        message: "Stripe webhook received in setup/demo mode.",
      });
    }

    // Parse event safely
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // Handle relevant billing events
    switch (event.type) {
      case "checkout.session.completed":
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "invoice.payment_succeeded":
        // Process subscription state update in database
        break;
      case "customer.subscription.deleted":
        // Mark subscription canceled
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Webhook error" }, { status: 500 });
  }
}
