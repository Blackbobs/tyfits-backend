// import { Request, Response } from "express";
// import Cart from "../models/cart.model";
// import Order from "../models/order.model";

// import { IProducts, OrderStatus } from "../types/types";
// import sendEmail from "../utils/sendEmail";
// import Stripe from "stripe";

// export const createCheckoutSession = async (req: Request, res: Response) => {
//     try {
//         const userId = req.userInfo?.id
//         const userEmail = req.userInfo?.email
//         const cart = await Cart.findOne({ userId }).populate<{ items: { product: IProducts, quantity: number }[] }>("items.product")
//         .exec();
//         if(!cart || cart.items.length === 0) {
//             res.status(400).json({ message: 'Cart is empty' });
//             return;
//         }

        
//         const lineItems = cart.items.map((item) => ({
//             price_data: {
//               currency: "usd",
//               product_data: {
//                 name: item.product.title,
//               },
//               unit_amount: Math.round(item.product.price * 100),
//             },
//             quantity: item.quantity,
//           }));

//           const session = await stripe.checkout.sessions.create({
//             payment_method_types: ["card"],
//             mode: "payment",
//             line_items: lineItems,
//             // success_url: `${config.clientUrl}/success`,
//             // cancel_url: `${config.clientUrl}/cancel`,
//             metadata: {
//               userId,
//               userEmail
//             },
//           });
      
//           res.status(200).json({ url: session.url });
              
//     } catch (error) {
//         console.log('Error creating checkout session:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// }





// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
//   const sig = req.headers["stripe-signature"];

//   let event: Stripe.Event;

//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body,
//       sig!,
//       process.env.STRIPE_WEBHOOK_SECRET!
//     );
//   } catch (err) {
//     const errorMessage = err instanceof Error ? err.message : String(err);
//     console.error("Webhook signature verification failed:", errorMessage);
//     res.status(400).send(`Webhook Error: ${errorMessage}`);
//     return;
//   }

//   if (event.type === "payment_intent.succeeded") {
//     const paymentIntent = event.data.object as Stripe.PaymentIntent;
//     const metadata = paymentIntent.metadata;

//     try {
//       const userId = metadata.userId;
//       const method = paymentIntent.payment_method_types[0] || "stripe";
//       const reference = paymentIntent.id;

//       const cart = await Cart
//         .findOne({ user: userId })
//         .populate("items.product");

//       if (!cart || cart.items.length === 0) {
//         console.warn("No cart found or empty cart for user:", userId);
//         res.status(400).json({ message: "Cart is empty" });
//         return;
//       }

//       const orderItems: {
//         product: any;
//         quantity: number;
//         price: number;
//       }[] = [];

//       let totalAmount = 0;
//       let isDigital = true;

//       for (const item of cart.items) {
//         const product = item.product as any;
//         const quantity = item.quantity;

//         if (!product) continue;

//         orderItems.push({
//           product: product._id,
//           quantity,
//           price: product.price,
//         });

//         totalAmount += product.price * quantity;

//         if (product.type === "physical") {
//           isDigital = false;
//           product.stock -= quantity;
//           await product.save();
//         }
//       }

//       const newOrder = await Order.create({
//         user: userId,
//         items: orderItems,
//         totalAmount,
//         isDigital,
//         status: OrderStatus.processing,
//         paymentInfo: {
//           method,
//           reference,
//           status: "success",
//         },
//       });

//       cart.items = [];
//       await cart.save();

    
//       await sendEmail({
//         to: metadata.userEmail,
//         subject: "Order Confirmation",
//         html: `
//           <h2>Thanks for your order!</h2>
//           <p>Order ID: ${newOrder._id}</p>
//           <p>Total: $${totalAmount}</p>
//           <p>You can ${isDigital ? "download your files soon" : "expect delivery shortly"}.</p>
//         `,
//       });

//       res.status(200).json({ received: true });
//     } catch (error) {
//       console.error("Error creating order:", error);
//       res.status(500).json({ message: "Internal server error" });
//     }
//   }

//   if (event.type === "payment_intent.payment_failed") {
//     const paymentIntent = event.data.object as Stripe.PaymentIntent;
//     console.warn("Payment failed:", paymentIntent.last_payment_error?.message);
//     res.status(200).json({ received: true });
//     return;
//   }

//   if (event.type === "checkout.session.expired") {
//     const session = event.data.object as Stripe.Checkout.Session;
//     console.warn("Checkout session expired:", session.id);
//     res.status(200).json({ received: true });
//     return;
//   }

//   res.status(200).json({ received: true });
// };


// // Raw body needed for Stripe webhook signature verification
// // router.post("/stripe/webhook", bodyParser.raw({ type: "application/json" }), handleStripeWebhook);