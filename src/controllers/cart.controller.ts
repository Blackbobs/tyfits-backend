import { Request, Response } from 'express';
import productModel from '../models/product.model';
import Cart from '../models/cart.model';

// In controllers/cart.controller.ts
export const addToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userInfo?.id;
    const { productId, quantity, size, color } = req.body; // Add size and color

    if (!productId || !quantity || quantity <= 0) {
      res.status(400).json({
        message: 'Valid product ID and positive quantity are required',
      });
      return;
    }

    const [product, cart] = await Promise.all([
      productModel.findById(productId).lean(),
      Cart.findOne({ user: userId }),
    ]);

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Validate size if product has sizes
    if (product.sizes && product.sizes.length > 0 && !size) {
      res.status(400).json({ message: 'Size is required for this product' });
      return;
    }

    // Validate color if product has colors
    if (product.colors && product.colors.length > 0 && !color) {
      res.status(400).json({ message: 'Color is required for this product' });
      return;
    }

    // Validate selected size is available
    if (size && product.sizes && !product.sizes.includes(size)) {
      res.status(400).json({ message: 'Selected size is not available' });
      return;
    }

    // Validate selected color is available
    if (color && product.colors && !product.colors.includes(color)) {
      res.status(400).json({ message: 'Selected color is not available' });
      return;
    }

    if (!cart) {
      const newCart = await Cart.create({
        user: userId,
        items: [{ product: productId, quantity, size, color }], // Include size and color
      });
      res.status(201).json({ message: 'Cart created', cart: newCart });
      return;
    }

    // Check for existing item with same product, size and color
    const existingItemIndex = cart.items.findIndex(item => 
      item.product.equals(productId) && 
      item.size === size && 
      item.color === color
    );

    if (existingItemIndex >= 0) {
      // Update quantity if same variant exists
      cart.items[existingItemIndex].quantity += quantity;
      await cart.save();
      res.status(200).json({ message: 'Cart item quantity updated', cart });
      return;
    }

    // Add new item if variant doesn't exist
    cart.items.push({ product: productId, quantity, size, color });
    await cart.save();
    res.status(200).json({ message: 'Item added to cart', cart });
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


export const updateCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userInfo?.id;
    const { productId } = req.params;
    const { quantity, size, color } = req.body;

    if (!quantity || quantity <= 0) {
      res.status(400).json({
        message: 'Valid positive quantity is required',
      });
      return;
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      res.status(404).json({ message: 'Cart not found' });
      return;
    }

    // Find the item to update
    const itemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId &&
      item.size === size && 
      item.color === color
    );

    if (itemIndex === -1) {
      res.status(404).json({ message: 'Item not found in cart' });
      return;
    }

    // Update the quantity
    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    const updatedCart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.product',
        select: 'title price images',
        model: 'Product',
      })
      .lean()
      .exec();

    res.status(200).json({ 
      message: 'Cart item updated', 
      cart: updatedCart 
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ message: 'Internal server error' });
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
