import { Request, Response } from "express";
import Cart from "../models/cart.model";
import Order from "../models/order.model";
import { IProducts, OrderStatus } from "../types/types";
import sendEmail from "../utils/sendEmail";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface ExtendedSessionCreateParams extends Stripe.Checkout.SessionCreateParams {
  metadata: {
    userId: string;
    userEmail: string;
    cartId: string;
  };
}

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const userId = req.userInfo?.id;
    const userEmail = req.userInfo?.email;
    console.log(userId, userEmail)
    
    if (!userId || !userEmail) {
       res.status(401).json({ message: 'User not authenticated' });
       return
    }

    const cart = await Cart.findOne({ user: userId })
      .populate<{ items: { product: IProducts, quantity: number }[] }>("items.product")
      .exec();

    if (!cart || cart.items.length === 0) {
       res.status(400).json({ message: 'Cart is empty' });
       return
    }

    const lineItems = cart.items.map((item) => {
      if (!item.product) {
        throw new Error('Product not found in cart item');
      }
      
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.product.title,
            images: item.product.images?.map(img => img.url),
          },
          unit_amount: Math.round(item.product.price * 100),
        },
        quantity: item.quantity,
      };
    });

    const params: ExtendedSessionCreateParams = {
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${process.env.CLIENT_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}`,
      customer_email: userEmail,
      metadata: {
        userId: userId.toString(),
        userEmail,
        cartId: cart._id.toString()
      },
    };

    const session = await stripe.checkout.sessions.create(params);
    res.status(200).json({ url: session.url });
    return
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Internal server error' });
    return
  }
};

// export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
//   const sig = req.headers["stripe-signature"] as string;
//   let event: Stripe.Event;

//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body,
//       sig,
//       process.env.STRIPE_WEBHOOK_SECRET!
//     );
//     return
//   } catch (err) {
//     const errorMessage = err instanceof Error ? err.message : String(err);
//     console.error("Webhook signature verification failed:", errorMessage);
//     res.status(400).send(`Webhook Error: ${errorMessage}`);
//     return;
//   }

//   switch (event.type) {
//     case "checkout.session.completed":
//       await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
//       break;
//     case "payment_intent.payment_failed":
//       console.warn("Payment failed:", (event.data.object as Stripe.PaymentIntent).last_payment_error?.message);
//       break;
//     case "checkout.session.expired":
//       console.warn("Checkout session expired:", (event.data.object as Stripe.Checkout.Session).id);
//       break;
//   }

//   res.status(200).json({ received: true });
// };

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    if (!session.metadata) {
      throw new Error('No metadata found in session');
    }

    const { userId, userEmail, cartId } = session.metadata;
    const method = session.payment_method_types?.[0] || "card";
    const reference = session.payment_intent as string;

    const cart = await Cart.findById(cartId)
      .populate("items.product")
      .exec();

    if (!cart || cart.items.length === 0) {
      console.warn("No cart found or empty cart for user:", userId);
      return;
    }

    const orderItems = cart.items.map(item => {
      if (!item.product) {
        throw new Error('Product not found in cart item');
      }
      
      return {
        product: (item.product as IProducts)._id,
        quantity: item.quantity,
        price: (item.product as IProducts).price,
      };
    });

    const totalAmount = cart.items.reduce((total, item) => {
      if (!item.product) return total;
      return total + (item.product as IProducts).price * item.quantity;
    }, 0);

    const isDigital = cart.items.every(item => {
      if (!item.product) return false;
      return (item.product as IProducts).type === "digital";
    });

    // Create order
    const newOrder = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount,
      isDigital,
      status: OrderStatus.processing,
      paymentInfo: {
        method,
        reference,
        status: "success",
      },
    });

    // Update product stocks
    await Promise.all(cart.items.map(async (item) => {
      const product = item.product as IProducts;
      if (product.type === "physical" && product.stock !== undefined) {
        product.stock -= item.quantity;
        await product.save();
      }
    }));

    // Clear cart
    cart.items = [];
    await cart.save();

    // Send confirmation email
    await sendEmail({
      to: userEmail,
      subject: "Order Confirmation",
      html: `
        <h2>Thanks for your order!</h2>
        <p>Order ID: ${newOrder._id}</p>
        <p>Total: $${totalAmount.toFixed(2)}</p>
        <p>You can ${isDigital ? "download your files soon" : "expect delivery shortly"}.</p>
        <p>View your order <a href="${process.env.CLIENT_URL}/account/orders/${newOrder._id}">here</a>.</p>
      `,
    });

  } catch (error) {
    console.error("Error processing checkout completion:", error);
  }
}

// controllers/checkout.controller.ts
export const verifyCheckoutSession = async (req: Request, res: Response) => {
  const { session_id } = req.query;

  try {
    if (!session_id || typeof session_id !== 'string') {
       res.status(400).json({ message: "Session ID is required" });
       return
    }

    // Fetch session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Optional: Ensure it's not already processed by checking DB
    const alreadyExists = await Order.findOne({
      "paymentInfo.reference": session.payment_intent,
    });
    if (alreadyExists) {
       res.status(200).json({ message: "Order already processed" });
       return
    }

    if (session.payment_status !== "paid") {
       res.status(400).json({ message: "Payment not completed" });
       return
    }

    // Reuse your existing logic
    await handleCheckoutSessionCompleted(session);

     res.status(200).json({ message: "Order processed successfully" });
     return
  } catch (error) {
    console.error("Error verifying session:", error);
     res.status(500).json({ message: "Internal server error" });
     return
  }
};
