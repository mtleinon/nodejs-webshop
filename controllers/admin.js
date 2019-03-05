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
  const prodId = req.params.productId;
  // Product.findById(prodId)
  
    req.user.getProducts({where: {id: prodId}})
      .then(product => {
        console.log(product);
        res.render('admin/edit-product', {
          pageTitle: 'Add Product',
          path: '/admin/edit-product',
          product: product[0],
          editMode: editMode
        });
      })
      .catch(err => console.log(err));
};

exports.postDeleteProduct = (req, res, next) => {
  console.log('delete', req.url);
  const productId = req.body.productId;
  Product.findById(productId)
    .then(product => {
      return product.destroy();
    })
    .then(result => {
      console.log('Product deleted');
      res.redirect('/admin/products');
    })
    .catch(err => console.log('destroy product', err));
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = parseFloat(req.body.price);
  const description = req.body.description;
  req.user
    .createProduct({ // createProduct method added by sequelize
      title: title,
      imageUrl: imageUrl,
      price: price,
      description: description,
    })
    .then(result => {
      console.log('create', result);
      res.redirect('/admin/products');
    })
    .catch(err => {
      console.log('Error: create', err);
    });
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
      product.imageUrl = updatedImageUrl;
      product.price = updatedPrice;
      product.description. updatedDescription;
      return product.save();
    })
    .then(result => {
      console.log('product updated');
      res.redirect('/admin/products');
    })
    .catch(err => console.log('update product', err));
};

exports.getProducts = (req, res, next) => {
  req.user
    .getProducts()
    .then(products => {
        res.render('admin/products', {
          prods: products,
          pageTitle: 'Admin Products',
          path: '/admin/products'
        });
    })
    .catch(err => console.log('findAll', err));
};
