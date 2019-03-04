const Product = require('../models/product');
const Cart = require('../models/cart');

exports.getProducts = (req, res, next) => {
  Product.fetchAll(products => {
    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'All Products',
      path: '/products'
    });
  });
};

exports.getProduct = (req, res, next) => {
  const productId = req.params.productId;
  console.log('productId', productId);
  Product.findById(productId, (product) => {
    res.render('shop/product-detail',  {
      pageTitle: 'Product details',
      path: '/products',
      product: product
     });
  });
};

exports.getIndex = (req, res, next) => {
  Product.fetchAll(products => {
    res.render('shop/index', {
      prods: products,
      pageTitle: 'Shop', 
      path: '/'
    });
  });
};

exports.getCart = (req, res, next) => {
  res.render('shop/cart', {
    path: '/cart',
    pageTitle: 'Your Cart'
  });
};

exports.postCart = (req, res, next) => {
  console.log(req.body.productId);
  const id = req.body.productId;
  Product.findById(id, product => Cart.addProduct(id, product.price));
  res.redirect('/');
};

exports.getOrders = (req, res, next) => {
  res.render('shop/orders', {
    path: '/orders',
    pageTitle: 'Your Orders'
  });
};

exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout', {
    path: '/checkout',
    pageTitle: 'Checkout'
  });
};

exports.getCart = (req, res, next) => {
  Cart.getCart(cart => {
    Product.fetchAll(products => {
      const cartProducts = [];
      for (product of products) {
        const cartProductsData = cart.products.find(
          cartProduct => cartProduct.id === product.id
          );
        if (cartProductsData) {
          cartProducts.push({productData: product, qty: cartProductsData.qty})
        }
      }
      console.log(cartProducts);
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: cartProducts
      });
      
    })
  })
}

exports.postCartDeleteItem = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId, product => {
    Cart.removeProduct(prodId, product.price);
    res.redirect('/cart');
  });
}
