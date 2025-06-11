import { Request, Response } from 'express';
import { ProductType } from '../types/types';
import Product from '../models/product.model';
import { uploadToCloudinary } from '../utils/Uploader';
import cloudinary from '../config/cloudinary';


export const createProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { title, description, price, isDigital, stock } = req.body;

    const createdBy = req.userInfo?.id;
    if (!createdBy) {
      res.status(401).json({ message: 'Unauthorized: missing user info' });
      return;
    }

    
    if (isDigital === 'true' || isDigital === true) {
      if (!req.file) {
        res.status(400).json({ message: 'Digital product file is required' });
        return;
      }

      const uploadedFile = await uploadToCloudinary(req.file.path);

      const newDigitalProduct = await Product.create({
        title,
        description,
        price,
        type: ProductType.digital,
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

    
    if (!req.files || !(req.files instanceof Array)) {
      res.status(400).json({ message: 'Product images are required' });
      return;
    }

    const uploadedImages = await Promise.all(
      req.files.map((file: Express.Multer.File) => uploadToCloudinary(file.path))
    );

    const newProduct = await Product.create({
      title,
      description,
      price,
      type: ProductType.physical,
      stock: stock ?? 0,
      createdBy,
      images: uploadedImages.map(({ url, publicId }) => ({ url, publicId })),
    });

    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct,
    });

  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error. Failed to create product.' });
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

        // Upload new file
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
            uploadToCloudinary(file.path)
          )
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

    res.status(200).json({
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    console.error('Error updating product:', error);
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
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
};

