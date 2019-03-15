const fs = require('fs');
const path = require('path');
const pdfkit = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_IN_PAGE = 2;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1 ;
  let totalItems = 0;
  Product
    .find()
    .countDocuments()
    .then(numOfProducts => {
      totalItems = numOfProducts;
      return Product
        .find()
        .skip((page - 1) * ITEMS_IN_PAGE)
        .limit(ITEMS_IN_PAGE)
    })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All products',
        path: '/products',
        nextPage: page + 1,
        currentPage: page,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_IN_PAGE)
      });
    })
    .catch(err => {
      console.log('CATCH: find:', err.message)
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
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
    })
    .catch(err => {
      console.log('CATCH: find:', err.message)
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1 ;
  let totalItems = 0;
  Product
    .find()
    .countDocuments()
    .then(numOfProducts => {
      totalItems = numOfProducts;
      return Product
        .find()
        .skip((page - 1) * ITEMS_IN_PAGE)
        .limit(ITEMS_IN_PAGE)
    })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        nextPage: page + 1,
        currentPage: page,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_IN_PAGE)
      });
    })
    .catch(err => {
      console.log('CATCH: find:', err.message)
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postAddProductToCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.session.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    })
    .catch(err => {
      console.log('CATCH: findById:', err.message)
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteItem = (req, res, next) => {
  const prodId = req.body.productId;
  req.session.user.deleteFromCart(prodId)
    .then(() => res.redirect('/cart'))
    .catch(err => {
      console.log('CATCH: deleteFromCart:', err.message)
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
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
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
    .catch(err => {
      console.log('CATCH: populate:', err.message)
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}


exports.postCreateOrder = (req, res, next) => {
  req.session.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return {
          quantity: i.quantity,
          product: {
            ...i.productId._doc
          }
        };
      });
      const order = new Order({
        user: {
          email: req.session.user.email,
          userId: req.session.user._id
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.session.user.clearCart();
    })
    .then(result => {
      console.log(result);
      res.redirect('/orders');
    })
    .catch(err => {
      console.log('CATCH: populate:', err.message)
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

exports.getOrders = (req, res, next) => {
  Order.find({
      'user.userId': req.session.user._id
    })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      })
    })
    .catch(err => {
      console.log('CATCH: find:', err.message)
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

const currencyToString = (amount) => {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2
  }).format(amount).padStart(11, ' ') + ' €';
}

const printPdfInvoice = (order, pdfDocument) => {

  pdfDocument.fontSize(26).text('WEB-SHOP', {
    underline: true,
    align: 'center'
  });

  pdfDocument.fontSize(20).text('\nInvoice', {
    underline: true,
    align: 'center'
  });
  pdfDocument.fontSize(14).text('\n\n' + 'Order no: ' + order._id);

  pdfDocument.font('Courier').fontSize(10).lineGap(6).text('\n\n');
  let totalPrice = 0;
  order.products.forEach(prod => {
    const productTotalPrice = prod.quantity * prod.product.price;
    totalPrice += productTotalPrice;

    pdfDocument.text(
      (prod.product.title.padEnd(40, ' .')).trim(40) + ' ' +
      prod.quantity.toString().padStart(2, ' ') + ' x ' +
      currencyToString(prod.product.price) +
      ' = ' + currencyToString(productTotalPrice));
  });

  pdfDocument.text(''.padEnd(75, '_'));
  pdfDocument.font('Courier-Bold').text('Total Price:'.padEnd(58, ' .') +
    ' = ' +
    (new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2
    }).format(totalPrice).padStart(11) + ' €'));
}

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;

  Order.findById(orderId).then(order => {

      // Check that logged in user has made the order
      if (!order) {
        return next(new Error('No order found.'));
      }
      if (order.user.userId.toString() !== req.session.user._id.toString()) {
        return next(new Error('Unauthorized'));
      }

      const invoiceName = 'invoice-' + orderId + '.pdf';
      const invoicePath = path.join('data', 'invoices', invoiceName);

      const pdfDocument = new pdfkit();
      pdfDocument.pipe(fs.createWriteStream(invoicePath));

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
      pdfDocument.pipe(res);
      printPdfInvoice(order, pdfDocument);
      pdfDocument.end();

      // Stream the file to response. Use this for bigger files.
      //
      // const file = fs.createReadStream(invoicePath);
      // res.setHeader('Content-Type', 'application/pdf');
      // res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
      // file.pipe(res);

      // Read the whole file to a memory buffer and send it to browser
      // This is not good for bigger files
      //
      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err);
      //   }
      //   res.setHeader('Content-Type', 'application/pdf');
      //   res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
      //   res.send(data);
      // });
    })
    .catch(err => {
      return next(err);
    });
}