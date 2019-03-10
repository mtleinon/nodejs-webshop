const mongoose = require('mongoose');

// const getDb = require('../util/database').getDb;
// const mongodb = require('mongodb');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  cart: {
    items: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      quantity: {
        type: Number,
        required: true
      }
    }]
  }
});


userSchema.methods.deleteFromCart = function(product) {
  const updatedCart = [...this.cart.items];    
  const productIndex = updatedCart
      .findIndex(item => item.productId.toString() === product);

  if (productIndex >= 0 ) {
    if (updatedCart[productIndex].quantity > 1) {
      updatedCart[productIndex].quantity--;
    } else {
      updatedCart.splice(productIndex, 1);
    }
  }
  this.cart.items = updatedCart;
  return this.save();
}


userSchema.methods.addToCart = function(product) {
  const updatedCart = [...this.cart.items];    
  const productIndex = updatedCart
      .findIndex(item => item.productId.toString() === product._id.toString());

  if (productIndex >= 0 ) {
    updatedCart[productIndex].quantity++;
  } else {
    updatedCart.push({productId: product._id, quantity: 1});
  }
  this.cart.items = updatedCart;
  return this.save();
}

userSchema.methods.clearCart = function() {
  this.cart = { items: [] };
  return this.save();
}

module.exports = mongoose.model('User', userSchema);

// class User {

//   constructor(name, email, userId, cart) {
//     this.name = name;
//     this.email = email;
//     this._id = userId ? new mongodb.ObjectId(userId) : null;
//     this.cart = cart; // {items: [{productId, quantity}]}
//   }

//   // If product already exist in the cart, increase its quantity.
//   // Othervise add the product to the cart.
//   addToCart(product) {
//     const updatedCart = [...this.cart.items];    
//     const productIndex = updatedCart
//         .findIndex(item => item.productId.toString() === product._id.toString());

//     if (productIndex >= 0 ) {
//       updatedCart[productIndex].quantity++;
//     } else {
//       updatedCart.push({productId: product._id, quantity: 1});
//     }
//     return getDb()
//       .collection('users')
//       .updateOne(
//         { _id: this._id },
//         { $set: {cart: {items: updatedCart}} }
//       );
//   }
      
//   addOrder() {
//     return this.getCart()
//       .then(products => {

//         // Add order to orders collection
//         const order = {
//           items: products,
//           user: {
//             _id: this._id,
//             name: this.name
//           }
//         }
//         return getDb()
//           .collection('orders')
//           .insertOne(order)
//       })
//       .then(result => {
        
//         // Empty user's cart
//         this.cart =  {items: [] };
//         return getDb()
//           .collection('users')
//           .updateOne(
//             { _id: this._id },
//             { $set: { cart: { items: [] } } }
//           );
//       })
//       .catch(err => console.log('CATCH: addOrder', err));
//   }

//   deleteFromCart(productId) {
//     const updatedCart = [...this.cart.items];    
//     const productIndex = updatedCart
//         .findIndex(item => item.productId.toString() === productId);

//     if (productIndex >= 0 ) {
//       if (updatedCart[productIndex].quantity > 1) {
//         updatedCart[productIndex].quantity--;
//       } else {
//         updatedCart.splice(productIndex, 1);
//       }
    
//       return getDb()
//         .collection('users')
//         .updateOne(
//           { _id: this._id },
//           { $set: {cart: {items: updatedCart}} }
//         );
//     }
    
//   }

//   getCart() {
//     const productIds = this.cart.items.map(product => product.productId);
//     return getDb()
//       .collection('products')
//       .find({_id: {$in: productIds}})
//       .toArray()
//       .then(products => {
//         const r = products.map(product => { 
//           return {
//             ...product, 
//             quantity: this.cart.items.find(
//                 i => i.productId.toString() === product._id.toString() ).quantity}
//         });
//         return r;
//       });
//   };

//   getOrders() {
//     return getDb()
//       .collection('orders')
//       .find({'user._id': this._id})
//       .toArray();
//   };

//   // If object has _id, update the object in database.
//   // Otherwise save new oject to database.
//   // Function return a promise.

//   save() {
//     if (this._id) {
//       return dbOperation = getDb()
//         .collection('users')
//         .updateOne({ _id: this._id}, {$set: this});
//     } 
//     return dbOperation = getDb().collection('products')
//       .insertOne(this);
//   }

//   static findById(userId) {
//     return getDb()
//       .collection('users') 
//       .findOne({_id: new mongodb.ObjectId(userId)});
//   }  

// }

// module.exports = User;