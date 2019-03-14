const path = require('path');

const mongoose = require('mongoose');
const express = require('express');
const session = require('express-session');
const MongoDBSessionStore = require('connect-mongodb-session')(session);
const bodyParser = require('body-parser');
const csurf = require('csurf');
const connectFlash = require('connect-flash');

const errorController = require('./controllers/error');
const passwords = require('./passwords/passwords');

const app = express();

const MONGODB_URI = 'mongodb+srv://test:' 
    + passwords.test
    + '@cluster0-ipmon.mongodb.net/shop?retryWrites=true';

const sessionStore = new MongoDBSessionStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

const csurfProtection = csurf();

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
    saveUninitialized: false,
    store: sessionStore
 }));
app.use(csurfProtection);
app.use(connectFlash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.email = '';
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req, res, next) => {
    //throw new Error('ERROR IN SYNC CODE TEST');
    if(req.session.user) {
        User.findById(req.session.user._id)
        .then(user => {
            //throw new Error('ERROR IN ASYNC CODE TEST');
            if (!user) {
                return next();
            }
            req.session.user = user;
            next();
        })
        .catch (err => {
            // Express can handle this error
            // Now we return page with 500 HTTP error status
            next(new Error(err));
        })
    } else {
        next();
    }   
});

// Properties of res.locals are available in every rendered view. So you don't
// Have add them in the render function parameters.
app.use((req, res, next) => {
    if (req.session.user) {
        res.locals.email = req.session.user.email;
    }
    next();
});

// Write incoming http request to log to help testing
app.use('/', (req, res, next) => {
    console.log('1. middleware. Received request', req.method, req.url, req.body, req.params);
    next();
});

// Add isLoggedIn from cookie and current user to incoming http request
// app.use('/', (req, res, next) => {
//     next();
// });

// Add routes to app
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
    // Using res.redirect('/500') here could cause forever loop.
    // Render instead 500 HTTP error status page directly
    console.log('Error, send 500 HTTP error status page', error);
    
    res.status(500).render('500', { 
        isAuthenticated: req.session.isLoggedIn,
        pageTitle: 'Internal server error', 
        path: '/500' });
});

mongoose.connect(MONGODB_URI)
    .then(result => {
        app.listen(3000);
        console.log('Listening port 3000');
    })
    .catch(err => console.log('CATCH: mongoose.connect', err));
