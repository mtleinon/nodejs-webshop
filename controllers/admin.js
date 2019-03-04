const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editMode: false
  });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.editmode;
  if (!editMode) {
    console.log('ERROR: edit mode should be set');
    return res.redirect('/');
  }
  console.log(req.params.productId);
  const id = req.params.productId;
  Product.findById(id, product => {
    console.log(product);
    res.render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/edit-product',
      product: product,
      editMode: editMode
    });
  });
};

exports.postDeleteProduct = (req, res, next) => {
  console.log('delete', req.url);
  const id = req.body.productId;
  Product.deleteById(id);
  res.redirect('/admin/products');
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = parseFloat(req.body.price);
  const description = req.body.description;
  const product = new Product(null, title, imageUrl, description, price);
  product.save();
  res.redirect('/');
};

exports.postEditProduct = (req, res, next) => {
  const productId = req.body.productId;
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = parseFloat(req.body.price);
  const description = req.body.description;
  const product = new Product(productId, title, imageUrl, description, price);
  console.log(product);
  product.save();
  res.redirect('/admin/products');
};

exports.getProducts = (req, res, next) => {
  Product.fetchAll(products => {
    res.render('admin/products', {
      prods: products,
      pageTitle: 'Admin Products',
      path: '/admin/products'
    });
  });
};
