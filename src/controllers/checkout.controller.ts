import { Request, Response } from "express";
import Cart from "../models/cart.model";
import Order from "../models/order.model";
import { IProducts, OrderStatus } from "../types/types";
import sendEmail from "../utils/sendEmail";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// interface ExtendedSessionCreateParams extends Stripe.Checkout.SessionCreateParams {
//   metadata: {
//     userId: string;
//     userEmail: string;
//     cartId: string;
//   };
// }

interface ExtendedCheckoutSession extends Stripe.Checkout.Session {
  shipping_details?: {
    name?: string | null;
    phone?: string | null;
    address?: {
      line1?: string | null;
      line2?: string | null;
      city?: string | null;
      state?: string | null;
      postal_code?: string | null;
      country?: string | null;
    } | null;
  };
}

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const userId = req.userInfo?.id;
    const userEmail = req.userInfo?.email;
    
    if (!userId || !userEmail) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const cart = await Cart.findOne({ user: userId })
      .populate<{ items: { product: IProducts; quantity: number; size?: string; color?: string }[] }>("items.product")
      .exec();

    if (!cart || cart.items.length === 0) {
      res.status(400).json({ message: "Cart is empty" });
      return;
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.items.map(item => {
      if (!item.product) throw new Error("Product not found in cart item");
      
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${item.product.title}${item.size ? ` (Size: ${item.size})` : ''}${item.color ? ` - Color: ${item.color}` : ''}`,
            images: item.product.images
              ?.map(img => img.url)
              .filter(url => url && url.startsWith("https://")),
          },
          unit_amount: Math.round(item.product.price * 100),
        },
        quantity: item.quantity,
      };
    });
    
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${process.env.CLIENT_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}`,
      customer_email: userEmail,
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "NG"],
      },
      phone_number_collection: { enabled: true },
      metadata: {
        userId: userId.toString(),
        userEmail,
        cartId: cart._id.toString(),
      },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

async function handleCheckoutSessionCompleted(session: ExtendedCheckoutSession) {
  try {
    if (!session.metadata) throw new Error("No metadata found in session");

    const { userId, userEmail, cartId } = session.metadata;
    const method = session.payment_method_types?.[0] || "card";
    const reference = session.payment_intent as string;

    const cart = await Cart.findById(cartId)
      .populate<{ items: { product: IProducts; quantity: number; size?: string; color?: string }[] }>("items.product")
      .exec();

    if (!cart || cart.items.length === 0) {
      console.warn("No cart found or empty cart for user:", userId);
      return;
    }

    const orderItems = cart.items.map(item => {
      if (!item.product) throw new Error("Product not found in cart item");
      return {
        product: (item.product as IProducts)._id,
        quantity: item.quantity,
        price: (item.product as IProducts).price,
        size: item.size,    
        color: item.color  
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

    const shippingDetails = session.shipping_details
      ? {
          name: session.shipping_details.name || "",
          phone: session.shipping_details.phone || "",
          address: {
            line1: session.shipping_details.address?.line1 || "",
            line2: session.shipping_details.address?.line2 || "",
            city: session.shipping_details.address?.city || "",
            state: session.shipping_details.address?.state || "",
            postal_code: session.shipping_details.address?.postal_code || "",
            country: session.shipping_details.address?.country || "",
          },
        }
      : null;

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
      shippingAddress: shippingDetails,
    });

    await Promise.all(
      cart.items.map(async item => {
        const product = item.product as IProducts;
        if (product.type === "physical" && product.stock !== undefined) {
          product.stock -= item.quantity;
          await product.save();
        }
      })
    );

    cart.items = [];
    await cart.save();

    // Enhanced email with size/color information
    const itemsHtml = cart.items.map(item => `
      <tr>
        <td>${item.product.title}</td>
        <td>${item.quantity}</td>
        <td>$${(item.product.price * item.quantity).toFixed(2)}</td>
        <td>${item.size || 'N/A'}</td>
        <td>${item.color || 'N/A'}</td>
      </tr>
    `).join('');

    await sendEmail({
      to: userEmail,
      subject: "Order Confirmation",
      html: `
        <h2>Thanks for your order!</h2>
        <p>Order ID: ${newOrder._id}</p>
        <table border="1" cellpadding="5" cellspacing="0">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Size</th>
              <th>Color</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2"><strong>Total</strong></td>
              <td colspan="3"><strong>$${totalAmount.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
        <p>You can ${isDigital ? "download your files soon" : "expect delivery shortly"}.</p>
        <p>View your order <a href="${process.env.CLIENT_URL}/account/orders/${newOrder._id}">here</a>.</p>
      `,
    });
  } catch (error) {
    console.error("Error processing checkout completion:", error);
  }
}

export const verifyCheckoutSession = async (req: Request, res: Response) => {
  const { session_id } = req.query;

  try {
    if (!session_id || typeof session_id !== "string") {
      res.status(400).json({ message: "Session ID is required" });
      return;
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    

    const alreadyExists = await Order.findOne({
      "paymentInfo.reference": session.payment_intent,
    });
    if (alreadyExists) {
      res.status(200).json({ message: "Order already processed" });
      return;
    }

    if (session.payment_status !== "paid") {
      res.status(400).json({ message: "Payment not completed" });
      return;
    }

    await handleCheckoutSessionCompleted(session);
    res.status(200).json({ message: "Order processed successfully" });
  } catch (error) {
    console.error("Error verifying session:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
