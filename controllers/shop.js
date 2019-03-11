const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
  Product.find() 
    .then(products => {
      console.log(products);
      
      res.render('shop/product-list', {
        isAuthenticated: req.session.isLoggedIn,
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
          isAuthenticated: req.session.isLoggedIn,
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
        isAuthenticated: req.session.isLoggedIn,
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
      return  req.session.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    })
    .catch(err => console.log('CATCH: ', err));
};
  
exports.postCartDeleteItem = (req, res, next) => {
  const prodId = req.body.productId;
   req.session.user.deleteFromCart(prodId)
    .then(() => res.redirect('/cart'))
    .catch(err => console.log('CATCH: delete cart', err));
}

// TODO: If product is removed from shop, set it to removed state and show it in the cart
// If product is removed  from database, populate function below can't insert product's fields to cart data
exports.getCart = (req, res, next) => {
   req.session.user
  .populate('cart.items.productId') 
  .execPopulate()
  .then(user => {
    const products = user.cart.items;
    console.log(products);
    
    res.render('shop/cart', {
      isAuthenticated: req.session.isLoggedIn,
      path: '/cart',
      pageTitle: 'Your Cart',
      products: products
    });
  })
  .catch(err => console.log('CATCH: getCart', err));
}


exports.postCreateOrder = (req, res, next) => {
   req.session.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return {quantity: i.quantity, product: { ...i.productId._doc }};
      });
      const order = new Order({
        user: {
          email:  req.session.user.email,
          userId:  req.session.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return  req.session.user.clearCart();
    })
    .then(result => {
      console.log(result);
      res.redirect('/orders'); 
    })
    .catch(err => console.log('CATCH: ', err));
}
  
  exports.getOrders = (req, res, next) => {
    Order.find({'user.userId':  req.session.user._id })
      .then(orders => {
        res.render('shop/orders', {
          isAuthenticated: req.session.isLoggedIn,
          path: '/orders',
          pageTitle: 'Your Orders',
          orders: orders
        })
      })
      .catch(err => console.log('CATCH: getOrders', err));
  };
