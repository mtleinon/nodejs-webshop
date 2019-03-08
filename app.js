const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const errorController = require('./controllers/error');
const mongoConnect = require('./util/database').mongoConnect;

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const User = require('./models/user');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Write incoming http request to log to help testing
app.use('/', (req, res, next) => {
    console.log('1. middleware. Received request', req.method, req.url, req.body, req.params);
    next();
});

// Add current user to incoming http request
app.use('/', (req, res, next) => {
    console.log('2. set test user');
    User.findById("5c80f3c09e2edf5da8f7eb5f")
        .then(user => {
            req.user = new User(user.name, user.email, user._id, user.cart);
            next();
        })
        .catch(err => console.log('CATCH: find user', err));
});

// Add routes to app
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(errorController.get404);

mongoConnect(() => {
    app.listen(3000);
    console.log('Listening port 3000');
});
