import { Request, Response } from 'express';
import { ProductType } from '../types/types';
import Product from '../models/product.model';
import { uploadToCloudinary } from '../utils/Uploader';
import cloudinary from '../config/cloudinary';
import mongoose from 'mongoose';

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, price, stock, type } = req.body;

    if (!type || !Object.values(ProductType).includes(type)) {
      res.status(400).json({ message: 'Invalid or missing product type' });
      return;
    }

    const createdBy = req.userInfo?.id;
    if (!createdBy) {
      res.status(401).json({ message: 'Unauthorized: missing user info' });
      return;
    }

    if (type === ProductType.digital) {
      const file = (req.files as { [fieldname: string]: Express.Multer.File[] })?.file?.[0];
      if (!file) {
        res.status(400).json({ message: 'Digital product file is required' });
        return;
      }

      const uploadedFile = await uploadToCloudinary(file.path);
      const newDigitalProduct = await Product.create({
        title,
        description,
        price,
        type,
        createdBy,
        file: {
          url: uploadedFile.url,
          publicId: uploadedFile.publicId,
        },
      });

      res.status(201).json({
        message: 'Digital product created successfully',
        product: newDigitalProduct,
      });
      return;
    }

    const images = (req.files as { [fieldname: string]: Express.Multer.File[] })?.images;
    if (!images || !images.length) {
      res.status(400).json({ message: 'Product images are required' });
      return;
    }

    const uploadedImages = await Promise.all(
      images.map((file) => uploadToCloudinary(file.path)),
    );

    const newProduct = await Product.create({
      title,
      description,
      price,
      type,
      stock: stock ?? 0,
      createdBy,
      images: uploadedImages.map(({ url, publicId }) => ({ url, publicId })),
    });

    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct,
    });
  } catch (error) {
    console.log('Error creating product:', error);
    res.status(500).json({ message: 'Server error. Failed to create product.' });
  }
};


export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json({ message: 'Products fetched successfully', products });
  } catch (error) {
    console.log('Error fetching all products:', error);
    res.status(500).json({ message: 'Server error. Failed to fetch products.' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid product ID format' });
      return;
    }
    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.status(200).json({ message: 'Product fetched successfully', product });
  } catch (error) {
    console.log('Error fetching product by ID:', error);
    res.status(500).json({ message: 'Server error. Failed to fetch product.' });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, price, stock } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    if (product.type === ProductType.digital) {
      if (req.file) {
        if (product.file?.publicId) {
          await cloudinary.uploader.destroy(product.file.publicId);
        }

        const uploadedFile = await uploadToCloudinary(req.file.path);
        product.file = {
          url: uploadedFile.url,
          publicId: uploadedFile.publicId,
        };
      }
    } else {
      if (req.files && req.files instanceof Array) {
        if (product.images?.length) {
          for (const img of product.images) {
            await cloudinary.uploader.destroy(img.publicId);
          }
        }

        const uploadedImages = await Promise.all(
          req.files.map((file: Express.Multer.File) => uploadToCloudinary(file.path))
        );
        product.images = uploadedImages.map(({ url, publicId }) => ({ url, publicId }));
      }
      if (stock !== undefined) {
        product.stock = stock;
      }
    }

    if (title) product.title = title;
    if (description) product.description = description;
    if (price !== undefined) product.price = price;

    await product.save();

    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.log('Error updating product:', error);
    res.status(500).json({ message: 'Server error. Failed to update product.' });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    if (product.type === ProductType.digital && product.file?.publicId) {
      await cloudinary.uploader.destroy(product.file.publicId);
    } else if (product.images?.length) {
      for (const image of product.images) {
        await cloudinary.uploader.destroy(image.publicId);
      }
    }

    await Product.findByIdAndDelete(id);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.log('Error deleting product:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
};


