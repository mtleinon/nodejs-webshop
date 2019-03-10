const path = require('path');

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

const errorController = require('./controllers/error');
const mongoose = require('mongoose');

const passwords = require('./passwords/passwords');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const User = require('./models/user');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: "My secret", 
    resave: false,
    saveUninitialized: false }));
    
// Write incoming http request to log to help testing
app.use('/', (req, res, next) => {
    console.log('1. middleware. Received request', req.method, req.url, req.body, req.params);
    next();
});

// Add isLoggedIn from cookie and current user to incoming http request
app.use('/', (req, res, next) => {
    if (req.get('Cookie') && req.get('Cookie').includes('loggedIn')) {
        req.isLoggedIn = req.get('Cookie').split('=')[1];
        
    }
    console.log('req.isLoggedIn', req.isLoggedIn);
    console.log('2. test user set');
    User.findById("5c839b2582e3b91bb8d896c9")
        .then(user => {
            req.user = user;
            next();
        })
        .catch(err => console.log('CATCH: find user', err));
});

// Add routes to app
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use(errorController.get404);

const connectionString = 'mongodb+srv://test:' 
    + passwords.test
    + '@cluster0-ipmon.mongodb.net/shop?retryWrites=true';

mongoose.connect(connectionString)
    .then(result => {
        // Create test user if there are no users
        // const user = new User({
        //     name: 'Jill',
        //     email: 'jill@test.com',
        //     cart: { items: [] }
        // });
        // user.save();
        app.listen(3000);
        console.log('Listening port 3000');
    })
    .catch(err => console.log('CATCH: mongoose.connect', err));
