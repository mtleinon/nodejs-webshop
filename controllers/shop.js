const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
  Product.find() 
    .then(products => {
      console.log(products);
      
      res.render('shop/product-list', {
        isAuthenticated: req.isLoggedIn,
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
          isAuthenticated: req.isLoggedIn,
          product: product,
          pageTitle: product.title,
          path: '/products'
        });
    }).catch(err => console.log('CATCH: findProduct', err));
}; 

exports.getIndex = (req, res, next) => {

  Product.find()
    .then(products => {
      res.render('shop/index', {
        isAuthenticated: req.isLoggedIn,
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
  
exports.postCartDeleteItem = (req, res, next) => {
  const prodId = req.body.productId;
  req.user.deleteFromCart(prodId)
    .then(() => res.redirect('/cart'))
    .catch(err => console.log('CATCH: delete cart', err));
}

exports.getCart = (req, res, next) => {
  req.user
  .populate('cart.items.productId')
  .execPopulate()
  .then(user => {
    const products = user.cart.items;
    console.log(products);
    
    res.render('shop/cart', {
      isAuthenticated: req.isLoggedIn,
      path: '/cart',
      pageTitle: 'Your Cart',
      products: products
    });
  })
  .catch(err => console.log('CATCH: getCart', err));
}


exports.postCreateOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return {quantity: i.quantity, product: { ...i.productId._doc }};
      });
      const order = new Order({
        user: {
          name: req.user.name,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(result => {
      console.log(result);
      res.redirect('/orders'); 
    })
    .catch(err => console.log('CATCH: ', err));
}
  
  exports.getOrders = (req, res, next) => {
    Order.find({'user.userId': req.user._id })
      .then(orders => {
        res.render('shop/orders', {
          isAuthenticated: req.isLoggedIn,
          path: '/orders',
          pageTitle: 'Your Orders',
          orders: orders
        })
      })
      .catch(err => console.log('CATCH: getOrders', err));
  };
