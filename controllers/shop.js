const Product = require('../models/product');
const Cart = require('../models/cart');

exports.getProducts = (req, res, next) => {
  Product.findAll()
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
    console.log(product);
    res.render('shop/product-detail',  {
      pageTitle: product.title,
      path: '/products',
      product: product
     });
  })
  .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {

  Product.findAll()
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop', 
        path: '/'
      });
    })
    .catch(err => console.log(err));
};

// exports.getCart = (req, res, next) => {
//   req.user
//     .getCart()
//     .then(cart => {
//       console.log(cart);
      
//     })
//     .catch(err => console.log('CATCH: getCart', err));
//   // res.render('shop/cart', {
//   //   path: '/cart',
//   //   pageTitle: 'Your Cart'
//   // });
// };

exports.postAddProductToCart = (req, res, next) => {
  const prodId = req.body.productId;
  let fetchedCart;
  let newQuantity = 1;
  req.user
    .getCart()
    .then(cart => {
      fetchedCart = cart;
      return cart.getProducts({ where: { id: prodId}})
    })
    .then(products => {
      let product;
      if (products.length > 0) {
        product = products[0];
        const oldQuantity = product.cartItem.quantity;
        newQuantity = oldQuantity + 1;
        return product;
      }
      return Product.findById(prodId);
    })
    .then(product => {
      return fetchedCart.addProduct(product, {
        through: { quantity: newQuantity}
      });
    })
    .then(() => {
      res.redirect('/cart'); 
    })
    .catch(err => console.log('CATCH: getCart', err));
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
  req.user
  .getCart()
  .then(cart => {
    return cart.getProducts();
  })
  .then(products => {
    res.render('shop/cart', {
      path: '/cart',
      pageTitle: 'Your Cart',
      products: products
    });
  })
  .catch(err => console.log('CATCH: getCart', err));

  //   Product.fetchAll(products => {
  //     const cartProducts = [];
  //     for (product of products) {
  //       const cartProductsData = cart.products.find(
  //         cartProduct => cartProduct.id === product.id
  //         );
  //       if (cartProductsData) {
  //         cartProducts.push({productData: product, qty: cartProductsData.qty})
  //       }
  //     }
  //     console.log(cartProducts);
  //     res.render('shop/cart', {
  //       path: '/cart',
  //       pageTitle: 'Your Cart',
  //       products: cartProducts
  //     });
      
  //   })
  // })
}

exports.postCartDeleteItem = (req, res, next) => {
  const prodId = req.body.productId;
  req.user.getCart()
    .then(cart => {
      return cart.getProducts({where: {id: prodId}})
    })
    .then( products => {
      return products[0].cartItem.destroy()
    })
    .then(() => res.redirect('/cart'))
    .catch(err => console.log('CATCH: delete cart', err));
}

exports.postCreateOrder = (req, res, next) => {
  let fetchedCart;
  req.user.getCart()
  .then(cart => {
    fetchedCart = cart;
    return cart.getProducts(); 
  })
  .then(products => {
    return req.user.createOrder()
      .then(order => {
        return order.addProduct(
          products.map(product => {
            product.orderItem = {quantity: product.cartItem.quantity};
            return product;
          })
        )
      })
      .catch(err => console.log('CATCH: addProduct', err));
  })
  .then(() => {
    return fetchedCart.setProducts(null);
  })
  .then(() => {
    res.redirect('/orders');
  })
  .catch(err => console.log('CATCH: cart', err));
}

exports.getOrders = (req, res, next) => {
  req.user
    .getOrders({include: ['products']})
    .then(orders=> {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your orders',
        orders: orders
      });
    })
    .catch(err => console.log('CATCH: getOrders', err));
};