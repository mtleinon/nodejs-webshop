const Product = require('../models/product');
// const mongodb = require('mongodb');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    isAuthenticated: req.session.isLoggedIn,
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editMode: false
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
        isAuthenticated: req.session.isLoggedIn,
        pageTitle: 'Add Product',
        path: '/admin/edit-product',
        product: product,
        editMode: editMode
      });
    })
    .catch(err => console.log(err));
};

exports.postDeleteProduct = (req, res, next) => {
  console.log('delete', req.url);
  const productId = req.body.productId;
  Product.findByIdAndDelete(productId)
    .then(result => {
      console.log('Product deleted');
      res.redirect('/admin/products');
    })
    .catch(err => console.log('CATCH: Delete product', err));
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const price = parseFloat(req.body.price);
  const description = req.body.description;
  const imageUrl = req.body.imageUrl;
  const newProduct = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId:  req.session.user
  });
  newProduct
    .save()
    .then(result => {
      console.log(result);
      res.redirect('/admin/add-product');
    })
    .catch(err => console.log('CATCH: save', err));
};

exports.postEditProduct = (req, res, next) => {
  const productId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedImageUrl = req.body.imageUrl;
  const updatedPrice = parseFloat(req.body.price);
  const updatedDescription = req.body.description;
  console.log(productId);

  Product.findById(productId)
    .then(product => {
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDescription;
      product.imageUrl = updatedImageUrl;
      return product.save();
    })
    .then(result => {
      console.log('product updated');
      res.redirect('/admin/products');
    })
    .catch(err => console.log('update product', err));
};

exports.getProducts = (req, res, next) => {
  Product.find()
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then(products => {
      console.log(products);
      
      res.render('admin/products', {
        isAuthenticated: req.session.isLoggedIn,
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => console.log(err));
  };
