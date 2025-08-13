import { Request, Response } from 'express';
import { ProductSize, ProductColor, ProductType } from '../types/types';
import Product from '../models/product.model';
import { uploadToCloudinary } from '../utils/Uploader';
import cloudinary from '../config/cloudinary';
import mongoose from 'mongoose';
import { parseArrayInput } from '../utils/convert-sizes-colors';
import redisCache from '../config/redis.config';
import { generateCacheKey, invalidateProductCaches } from '../utils/redis-cache';

export const createProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { title, description, price, stock, type, sizes, colors } = req.body;

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
      const file = (req.files as { [fieldname: string]: Express.Multer.File[] })
        ?.file?.[0];
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

    // For physical products, validate and include sizes and colors
    const sizesArray = parseArrayInput(sizes) || [];
    const colorsArray = parseArrayInput(colors) || [];

    const invalidSizes = sizesArray.filter(
      (s) => !Object.values(ProductSize).includes(s as ProductSize),
    );
    if (invalidSizes.length > 0) {
      res.status(400).json({
        success: false,
        message: `Invalid sizes: ${invalidSizes.join(', ')}`,
      });
      return;
    }

    const invalidColors = colorsArray.filter(
      (c) => !Object.values(ProductColor).includes(c as ProductColor),
    );
    if (invalidColors.length > 0) {
      res.status(400).json({
        success: false,
        message: `Invalid colors: ${invalidColors.join(', ')}`,
      });
      return;
    }

    const images = (req.files as { [fieldname: string]: Express.Multer.File[] })
      ?.images;
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
      sizes: sizesArray,
      colors: colorsArray,
    });

    await invalidateProductCaches();

    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct,
    });
  } catch (error) {
    console.log('Error creating product:', error);
    res
      .status(500)
      .json({ message: 'Server error. Failed to create product.' });
  }
};

export const getAllProducts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const cacheKey = generateCacheKey.productList(req.query);
  try {
    const cached = await redisCache.getJson(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      res.status(200).json(cached);
      return;
    }

    const products = await Product.find().sort({ createdAt: -1 }).lean();
    const response = {
      message: 'Products fetched successfully',
      products,
      timestamp: Date.now(),
    };

    await redisCache.setJson(cacheKey, response, 300);

    res.set('X-Cache', 'MISS');

    res.status(200).json(response);
    return;
  } catch (error) {
    console.log('Error fetching all products:', error);
    res
      .status(500)
      .json({ message: 'Server error. Failed to fetch products.' });
  }
};

export const getProductById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid product ID format' });
      return;
    }
    const cacheKey = generateCacheKey.productDetail(id);
    const cached = await redisCache.getJson(cacheKey);
    
    if (cached) {
      res.set('X-Cache', 'HIT');
       res.status(200).json(cached);
       return
    }

    const product = await Product.findById(id);
    if (!product) {
      
      await redisCache.setJson(cacheKey, { message: 'Product not found' }, 60);
       res.status(404).json({ message: 'Product not found' });
       return
    }

    const response = { 
      message: 'Product fetched successfully', 
      product: product.toObject() 
    };

    await redisCache.setJson(cacheKey, response, 3600); 
    
    res.set('X-Cache', 'MISS');
    res.status(200).json(response);
  } catch (error) {
    console.log('Error fetching product by ID:', error);
    res.status(500).json({ message: 'Server error. Failed to fetch product.' });
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, price, stock, sizes, colors } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    const sizesArray = parseArrayInput(sizes) as string[] | undefined;
    const colorsArray = parseArrayInput(colors) as string[] | undefined;

    if (sizesArray) {
      const invalidSizes = sizesArray.filter(
        (s) => !Object.values(ProductSize).includes(s as ProductSize),
      );
      if (invalidSizes.length > 0) {
        res.status(400).json({
          success: false,
          message: `Invalid sizes: ${invalidSizes.join(', ')}`,
        });
        return;
      }
      product.sizes = sizesArray as ProductSize[];
    }

    if (colorsArray) {
      const invalidColors = colorsArray.filter(
        (c) => !Object.values(ProductColor).includes(c as ProductColor),
      );
      if (invalidColors.length > 0) {
        res.status(400).json({
          success: false,
          message: `Invalid colors: ${invalidColors.join(', ')}`,
        });
        return;
      }
      product.colors = colorsArray as ProductColor[];
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
          req.files.map((file: Express.Multer.File) =>
            uploadToCloudinary(file.path),
          ),
        );
        product.images = uploadedImages.map(({ url, publicId }) => ({
          url,
          publicId,
        }));
      }
      if (stock !== undefined) {
        product.stock = stock;
      }
    }

    if (title) product.title = title;
    if (description) product.description = description;
    if (price !== undefined) product.price = price;

    await product.save();

    await invalidateProductCaches(id);


    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.log('Error updating product:', error);
    res
      .status(500)
      .json({ message: 'Server error. Failed to update product.' });
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
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

    await invalidateProductCaches(id);


    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.log('Error deleting product:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
};

