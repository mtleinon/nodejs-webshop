const Product = require('../models/product');

exports.getProducts = (req, res, next) => {
  Product.fetchAll() 
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products'
      });
    })
    .catch(err => console.log(err));
  };
  
  exports.getProduct = (req, res, next) => {
    const productId = req.params.productId;
    console.log('productId', productId);
    
    Product.findById(productId)
    .then(product => {
        res.render('shop/product-detail', {
          product: product,
          pageTitle: product.title,
          path: '/products'
        });
    }).catch(err => console.log('CATCH: findProduct', err));
}; 

exports.getIndex = (req, res, next) => {

  Product.fetchAll()
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop', 
        path: '/'
      });
    })
    .catch(err => console.log(err));
};

exports.postAddProductToCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    })
    .catch(err => console.log('CATCH: ', err));
};

exports.getCart = (req, res, next) => {
  req.user.getCart()
  .then(products => {
    res.render('shop/cart', {
      path: '/cart',
      pageTitle: 'Your Cart',
        products: products
    });
  })
  .catch(err => console.log('CATCH: getCart', err));
}

exports.postCartDeleteItem = (req, res, next) => {
  const prodId = req.body.productId;
  req.user.deleteFromCart(prodId)
  .then(() => res.redirect('/cart'))
    .catch(err => console.log('CATCH: delete cart', err));
  }

  exports.postCreateOrder = (req, res, next) => {
    req.user.addOrder()
      .then(result => {
        console.log(result);
        res.redirect('/orders'); 
      })
      .catch(err => console.log('CATCH: ', err));
  }
  
  exports.getOrders = (req, res, next) => {
    req.user.getOrders()
      .then(orders => {
        res.render('shop/orders', {
          path: '/orders',
          pageTitle: 'Your Orders',
          orders: orders
        })
      });
  };
