const User = require('../models/user');
const bcryptjs = require('bcryptjs');

exports.getLogin = (req, res, next) => {
    console.log(req.get('Cookie'));
    
    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/auth',
        isAuthenticated: req.session.isLoggedIn
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({email: email})
        .then(user => {
            if (!user) {
                return res.redirect('/login');
            }
            bcryptjs
                .compare(password, user.password)
                .then(doMatch => {
                    if (!doMatch) {
                        return res.redirect('/login');
                    }
                    req.session.isLoggedIn = true;
                    req.session.user = user;
                    req.session.save(err => {
                        if (err) console.log('save session', err);
                        res.redirect('/');
                    })
                })
        })
};

exports.getSignup = (req, res, next) => {
    res.render('auth/signup', {
        pageTitle: 'Signup',
        path: '/signup',
        isAuthenticated: false
    });
};

exports.postSignup = (req, res, next) => {
    console.log('postLogin');
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    User.findOne({ email: email })
        .then(userDoc => {
            if(userDoc) {
                console.log('email already exists');
                return res.redirect('/signup');
            }
            return bcryptjs
                .hash(password, 12)
                .then(hashedPassword => {
                    const user = new User({
                        email: email,
                        password: hashedPassword,
                        cart: { items: [] }
                    });
                    return user.save();
                })
                .then(result => {
                    res.redirect('/login');
                })
                .catch(err => console.log('CATCH: save user', err));
        })
        .catch(err => console.log('CATCH: findOne', err));
}

exports.postLogout = (req, res, next) => {
    console.log('postLogout');
    
    req.session.destroy(err => {
        if (err) console.log('logout err', err);
        res.redirect('/'); 
    })
};