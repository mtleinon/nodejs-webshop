
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model('Product', productSchema);

// const getDb = require('../util/database').getDb;
// const mongodb = require('mongodb');

// class Product {

//   constructor(title, price, description, imageUrl, productId, userId) {
//     this.title = title;
//     this.price = price;
//     this.description = description;
//     this.imageUrl =  imageUrl;
//     this._id = productId ? new mongodb.ObjectId(productId) : null;
//     this.userId = userId;
//   }

//   save() {
//     const db = getDb();
//     let dbOperation;
//     if(this._id) {
//       dbOperation = db
//         .collection('products')
//         .updateOne({ _id: this._id}, {$set: this});
//     } else {
//       dbOperation = db.collection('products')
//       .insertOne(this);
//     }
//     return dbOperation;
//   }

//   static deleteById(productId) {
//     return getDb()
//       .collection('products')
//       .deleteOne({ _id: new mongodb.ObjectId(productId)});
//   }

//   static fetchAll() {
//     const db = getDb();
//     return db
//       .collection('products')
//       .find()
//       .toArray()
//       .then(products => {
//         console.log(products);
//         return products;
//       })
//       .catch(err => {
//         console.log(err);
//       });
//   }

//   static findById(productId) {
//     return getDb()
//       .collection('products') 
//       .find({_id: new mongodb.ObjectId(productId)})
//       .next()
//       .then(product => {
//         console.log(product);
//         return product;
//       })
//       .catch(err => console.log('CATCH: find', err));
//   }  
// }

// module.exports = Product;
