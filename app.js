const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const sequelize = require('./util/database');
const errorController = require('./controllers/error');

const User = require('./models/user');
const Product = require('./models/product');
const Cart = require('./models/cart');
const CartItem = require('./models/cart-item');
const Order = require('./models/order');
const OrderItem = require('./models/order-item');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', (req, res, next) => {
    console.log('1. middleware. Received request', req.method, req.url, req.body, req.params);
    next();
});

app.use('/', (req, res, next) => {
    console.log('2. set test user');
    User.findById(1)
    .then(user => {
        req.user = user;
        next();
    })
    .catch(err => console.log('CATCH: find user', err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

/* Create relations between tables
           n               1
  Product <---------------->  User
     |1                        1|
     |                          |
     |                          |
     |                          |
     |n       n  1        1     |
    cartItem ----> cart <-------
*/
Product.belongsTo(User, { constraints: true, onDelete: 'CASCADE'});
User.hasMany(Product);

User.hasOne(Cart);
Cart.belongsTo(User);
Cart.belongsToMany(Product, {through: CartItem});

Product.belongsToMany(Cart, {through: CartItem});
Product.belongsToMany(Order, {through: OrderItem});

Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, {through: OrderItem});

sequelize
    .sync()   // { force: true }
    .then(result => {
        return User.findById(1);
    })
    .then(user => {
        if (!user) {
            return User.create({name: 'Test user', email: 'test@test.com'});
        }
        return user;
    })
    .then(user => {
        return user.createCart();
    })
    .then(user => {
        app.listen(3000);
        console.log('Listening port 3000');
    })
    .catch(err => {
        console.log('sync', err);  
    });
    
