const path = require('path');
const fs = require('fs');

const mongoose = require('mongoose');
const express = require('express');
const session = require('express-session');
const MongoDBSessionStore = require('connect-mongodb-session')(session);
const bodyParser = require('body-parser');
const csurf = require('csurf');
const connectFlash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const https = require('https');

const errorController = require('./controllers/error');
// const passwords = require('./passwords/passwords');

const shopController = require('./controllers/shop');
const isAuth = require('./middleware/is-auth');

const app = express();

console.log('NODE_ENV =', process.env.NODE_ENV);

// Mongo DB configuration
//test:
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-ipmon.mongodb.net/${process.env.MONGO_DATABASE}?retryWrites=true`;
console.log(MONGODB_URI);

// const MONGODB_URI = 'mongodb+srv://test:' 
//     + passwords.test
//     + '@cluster0-ipmon.mongodb.net/shop?retryWrites=true';

const sessionStore = new MongoDBSessionStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

const csurfProtection = csurf();

// View engine

app.set('view engine', 'ejs');
app.set('views', 'views');

// ConnectFlash is used for viewing info and error messages to the user

app.use(connectFlash());

// Form input data handling (encodings)

app.use(bodyParser.urlencoded({ extended: false }));

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png'
            || file.mimetype === 'image/jpg'
            || file.mimetype === 'image/jpeg'
    ){
        cb(null, true);
    } else {
        cb(null, false);
    }
}

const privateKey = fs.readFileSync('server.key');
const certificate = fs.readFileSync('server.cert');

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        //TODO: Replace getTime with real random value if needed.
        cb(null, (new Date()).getTime() + '-' + file.originalname);
    }
})

app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));

// Directory of static files returned by the server

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Session handling configuration

app.use(session({
    secret: "My secret", 
    resave: false,
    saveUninitialized: false,
    store: sessionStore
}));

// CSRF protection


app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.email = '';
  next();
});

// If user is authenticated, convert user as mongoose object
const User = require('./models/user');

app.use((req, res, next) => {
  if(req.session.user) {
    User.findById(req.session.user._id)
    .then(user => {
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

// Add routes to app

const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');

// "/create-order" route is not protected by us with csrf token so it is set
// to middleware before csurfProtection.
// Stripe handles the protection of this route.
app.post('/create-order', isAuth, shopController.postCreateOrder);

app.use(csurfProtection);
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use(helmet());
app.use(compression());

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'), {flags: 'a'}
);
app.use(morgan('combined', { stream: accessLogStream}));

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
        isAuthenticated: null, //req.session.isLoggedIn,
        pageTitle: 'Internal server error', 
        path: '/500' });
});

// Connect to Mongo DB and open server's listening port

mongoose.connect(MONGODB_URI)
    .then(result => {
      // https
      //   .createServer({key: privateKey, cert: certificate}, app)
      //   .listen(process.env.PORT || 3000);
      app.listen(process.env.PORT || 3000);
      console.log(`listening port ${process.env.PORT || 3000}`);
    })
    .catch(err => console.log('CATCH: mongoose.connect', err)); //TODO: return 500 page
