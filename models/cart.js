const fs = require('fs');
const path = require('path');
const cartFile = path.join(path.dirname(process.mainModule.filename), 'data', 'cart.json');

// cart file { productIds[], totalPrice }
module.exports = class Cart {

    static addProduct(id, price) {
        fs.readFile(cartFile, (error, fileContent) => {
            let cart = { products: [], totalPrice: 0 };
            if (!error) {
                cart = JSON.parse(fileContent);
            }
            // If product exists in the cart, update its quantity
            // otherwise add it to the cart
            let updatedProduct;
            const existingProductIndex = cart.products.findIndex(product => product.id === id);
            if (existingProductIndex >= 0)  {
                const existingProduct = cart.products[existingProductIndex];
                updatedProduct = { ...existingProduct };
                updatedProduct.qty += 1;
                cart.products[existingProductIndex] = updatedProduct; 
            } else {
                updatedProduct = { id: id, qty: 1 };
                cart.products = [ ...cart.products, updatedProduct];
            }          
            cart.totalPrice += price;
            fs.writeFile(cartFile, JSON.stringify(cart), err => {
                if (err) console.log(err);
            })
        });
    }

    static removeProduct(id, productPrice) {
        fs.readFile(cartFile, (error, fileContent) => {
            let cart = [{}];
            if (!error) {
                cart = JSON.parse(fileContent);
            }
            const updatedCart = { ...cart };
            const product = updatedCart.products.find(prod => prod.id === id);
            if (product) {
                const productQty = product.qty;
                updatedCart.products = updatedCart.products.filter(product => product.id !== id);
                updatedCart.totalPrice -= productPrice * productQty;
    
                fs.writeFile(cartFile, JSON.stringify(updatedCart), err => {
                    if (err) console.log(err);
                })
            }
        });
    }

    static getCart(cb) {
        fs.readFile(cartFile, (error, fileContent) => {
            if (error) {
                cb(null);
                console.log(error);
            } else {
                const cart = JSON.parse(fileContent);
                cb(cart);
            }
        });
    }
}