import { Request, Response } from 'express';
import productModel from '../models/product.model';
import Cart from '../models/cart.model';

export const addToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userInfo?.id;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      res.status(400).json({
        message: 'Valid product ID and positive quantity are required',
      });
      return;
    }

    const [productExists, cart] = await Promise.all([
      productModel.findById(productId).lean(),
      Cart.findOne({ user: userId }),
    ]);

    if (!productExists) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    if (!cart) {
      const newCart = await Cart.create({
        user: userId,
        items: [{ product: productId, quantity }],
      });
      res.status(201).json({ message: 'Cart created', cart: newCart });
      return;
    }

    const updatedCart = await Cart.findOneAndUpdate(
      {
        user: userId,
        'items.product': productId,
      },
      { $set: { 'items.$.quantity': quantity } },
      { new: true },
    );

    if (updatedCart) {
      res
        .status(200)
        .json({ message: 'Cart item quantity updated', cart: updatedCart });
      return;
    }

    const cartWithNewItem = await Cart.findOneAndUpdate(
      { user: userId },
      { $addToSet: { items: { product: productId, quantity } } },
      { new: true },
    );

    res
      .status(200)
      .json({ message: 'Item added to cart', cart: cartWithNewItem });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userInfo?.id;
    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.product',
        select: 'title price images',
        model: 'Product',
      })
      .lean()
      .exec();

    const response = {
      message: cart ? 'Cart fetched successfully' : 'Cart is empty',
      items: cart?.items || [],
      count: cart?.items.length || 0,
    };

    res.status(200).json(response);
  } catch (error) {
    console.log('Error fetching cart:', error);
    res.status(500).json({ message: 'Internal server error' });
    return;
  }
};

export const removeCart = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userInfo?.id;
    const { productId } = req.params;

    const updatedCart = await Cart.findOneAndUpdate(
      { user: userId },
      { $pull: { items: { product: productId } } },
      { new: true },
    );

    if (!updatedCart) {
      res.status(404).json({ message: 'Cart not found' });
      return;
    }

    res.status(200).json({
      message: 'Item removed from cart',
      cart: updatedCart,
    });
  } catch (error) {
    console.log('Error removing from cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const clearCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userInfo?.id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      res.status(404).json({ message: 'Cart not found' });
      return;
    }
    cart.items = [];
    await cart.save();
    res.status(200).json({ message: 'Cart cleared successfully', cart });
    return;
  } catch (error) {
    console.log('Error clearing cart:', error);
    res.status(500).json({ message: 'Internal server error' });
    return;
  }
};
