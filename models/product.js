const fs = require('fs');
const path = require('path');
const Cart = require('./cart');

const p = path.join(
  path.dirname(process.mainModule.filename),
  'data',
  'products.json'
);

const getProductsFromFile = cb => {
  fs.readFile(p, (err, fileContent) => {
    if (err) {
      cb([]);
    } else {
      cb(JSON.parse(fileContent));
    }
  });
};

module.exports = class Product {
  constructor(id, title, imageUrl, description, price) {
    this.id = id;
    this.title = title;
    this.imageUrl = imageUrl;
    this.description = description;
    this.price = price;
  }

  save() {
    if (this.id) {
      getProductsFromFile(products => {
        const productIndex = products.findIndex(product => product.id === this.id);
        const updatedProducts = [...products];
        updatedProducts[productIndex] = this; 
        fs.writeFile(p, JSON.stringify(updatedProducts), error => {
          console.log(error);
        });
      });
    } else {
      this.id = Math.random().toString(); //TODO: use some external backage for making real unique ID
      getProductsFromFile(products => {
        products.push(this);
        fs.writeFile(p, JSON.stringify(products), err => {
          console.log(err);
        });
      });
    }
  }

  static deleteById (id) {
    getProductsFromFile(products => {
      const product = products.find(product => product.id === id);
      const updatedProducts = products.filter(product => product.id !== id);
      fs.writeFile(p, JSON.stringify(updatedProducts), error => {
        if(!error) {
          //TODO: delete product from cart
          Cart.removeProduct(id, product.price);
        }
      })
    })
  }
  
  static fetchAll(cb) {
    getProductsFromFile(cb);
  }

  static findById(id, cb) {
    getProductsFromFile(products => {
      cb(products.find(i => i.id === id));
    });
  }
};
