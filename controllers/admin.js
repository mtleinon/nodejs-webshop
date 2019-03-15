const mongoose = require('mongoose');

const Product = require('../models/product');
const fileUtil = require('../util/file');

const { validationResult } = require('express-validator/check');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editMode: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.editmode;
  console.log('getEditProduct');

  if (!editMode) {
    console.log('ERROR: edit mode should be set');
    return res.redirect('/');
  }
  console.log(req.params.productId);
  const prodId = req.params.productId;

  Product.findById(prodId)
    .then(product => {
      console.log(product);
      res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/edit-product',
        product: product,
        editMode: editMode,
        hasError: false,
        errorMessage: null,
        validationErrors: []
      });
    })
    .catch(err => {
      console.log('CATCH: findOne:', err.message)
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  console.log('delete', req.url);
  const productId = req.body.productId;

  Product.findById(productId).then(product => {
    if ( !product ) {
      return next(new Error('Product not found' + productId));
    }
    fileUtil.deleteFile(product.imageUrl);
    return Product.deleteOne( {_id: productId, userId: req.session.user._id} )
  })
  .then(result => {
    console.log('Product deleted');
    res.redirect('/admin/products');
  })
  .catch(err => {
    console.log('CATCH: deleteOne:', err.message)
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
}

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const price = parseFloat(req.body.price);
  const description = req.body.description;
  //const imageUrl = req.body.imageUrl;
  const image = req.file;
  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/edit-product',
      editMode: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: 'Attached file is not an image.',
      validationErrors: [],
    });
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log('postAddProduct errors:', errors.array());

    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/edit-product',
      editMode: false,
      hasError: true,
      product: {
        title: title,
        // imageUrl: imageUrl,
        price: price,
        description: description
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  imageUrl = image.path;

  const newProduct = new Product({
    // For testing Mongo duplicate id error: _id: new mongoose.Types.ObjectId('5c83a712e7b96f30b8f16e96'),
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId:  req.session.user._id
  });
  newProduct
    .save()
    .then(result => {
      console.log(result);
      res.redirect('/admin/products');
    })
    .catch(err => {
      console.log('CATCH: save:', err.message)
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.postEditProduct = (req, res, next) => {
  const productId = req.body.productId;
  const updatedTitle = req.body.title;
  // const updatedImageUrl = req.body.imageUrl;
  const image = req.file;
  const updatedPrice = parseFloat(req.body.price);
  const updatedDescription = req.body.description;
  console.log(productId);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('postEditProduct errors:', errors.array());

    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editMode: true,
      hasError: true,
      product: {
        title: updatedTitle,
        // imageUrl: updatedImageUrl,
        price: updatedPrice,
        description: updatedDescription,
        _id: productId
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  Product.findById(productId)
    .then(product => {
      if (product.userId.toString() !== req.session.user._id.toString()) {
        return res.redirect('/');
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDescription;
      // product.imageUrl = updatedImageUrl;
      if (image) {
        fileUtil.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }
      return product.save()
        .then(result => {
          console.log('product updated');
          res.redirect('/admin/products');
        })
    })
    .catch(err => {
      console.log('CATCH: findById:', err.message)
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.getProducts = (req, res, next) => {
  Product.find({userId: req.session.user._id})
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then(products => {
      console.log(products);

      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => {
      console.log('CATCH: find:', err.message)
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
  };
