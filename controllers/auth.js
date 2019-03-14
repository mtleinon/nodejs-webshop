const crypto = require('crypto');

const User = require('../models/user');
const bcryptjs = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendGridTransport = require('nodemailer-sendgrid-transport');
const passwords = require('../passwords/passwords');
const { validationResult } = require('express-validator/check');

const transporter = nodemailer.createTransport(sendGridTransport({
    auth: {
        api_key: passwords.sendGridKey
    }
}));

exports.getLogin = (req, res, next) => {
    console.log(req.get('Cookie'));
    
    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/auth',
        errorMessage: req.flash('error')[0],
        infoMessage: req.flash('info')[0],
        validationErrors: [],
        oldInput: {
            email: '', 
            password: ''
        }
    });
};

exports.postLogin = (req, res, next) => {
    console.log('postLogin req.body:', req.body,  req.get('Cookie'));
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    console.log(errors.array());
    
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            pageTitle: 'Login',
            path: '/login',
            errorMessage: errors.array()[0].msg,
            infoMessage: null,
            validationErrors: errors.array(),
            oldInput: {
                email: email, 
                password: password
            }
        });
    }
 
    User.findOne({email: email})
        .then(user => {
            if (!user) {
                req.flash('error', 'Invalid email or password.');
                console.log('!user');
                // Req.flash needs session save 
                req.flash('error', 'Invalid email or password.');
                return req.session.save(() => {
                    res.redirect('/login');
                });
//                return res.redirect('/login');
            }
            console.log('user found');
            bcryptjs
            .compare(password, user.password)
                .then(doMatch => {
                    if (!doMatch) {
                        console.log('!doMatch');
                        
                        // Req.flash needs session save 
                        req.flash('error', 'Invalid email or password.');
                        return req.session.save(() => {
                            res.redirect('/login');
                        });
                        //return res.redirect('/login');
                    }
                    console.log('password matches');
                    req.session.isLoggedIn = true;
                    req.session.user = user;
                    req.session.save(err => {
                        if (err) console.log('save session', err);
                        res.redirect('/');
                    })
                })
        })
        .catch(err => {
            console.log('CATCH: find:', err.message)
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
     
};

exports.getSignup = (req, res, next) => {
    res.render('auth/signup', {
        pageTitle: 'Signup',
        path: '/signup',
        errorMessage: req.flash('error')[0],
        oldInput: {
            email: '', 
            password: '', 
            confirmPassword: ''
        },
        validationErrors: []

    });
};

exports.postSignup = (req, res, next) => {
    console.log('postLogin');
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    console.log(errors.array());
    
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/signup', {
            pageTitle: 'Signup',
            path: '/signup',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email, 
                password: password, 
                confirmPassword: req.body.confirmPassword
            },
            validationErrors: errors.array()
        });
    }
    bcryptjs
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
            return transporter.sendMail({
                to: email,
                from: 'shop@node-complete.com',
                subject: 'Signup succeeded!',
                html: '<h1>You successfully signed up!</h1>'
            });
        })
        .catch(err => {
            console.log('CATCH: save user:', err.message)
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.postLogout = (req, res, next) => {
    console.log('postLogout');
    
    req.session.destroy(err => {
        if (err) console.log('logout err', err);
        res.redirect('/'); 
    })
};

exports.getReset = (req, res, next) => {
    console.log('getReset', req.get('Cookie'));
    
    res.render('auth/reset', {
        pageTitle: 'Reset Password',
        path: '/auth',
        errorMessage: req.flash('error')[0],
    });
};

exports.postReset = (req, res, next) => {
    console.log('postReset');
    crypto.randomBytes(32, (err, buffer) => {
        if(err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({email: req.body.email})
        .then(user => {
            if (!user) {
                throw new Error('No account with that mail found.'); 
                //return res.redirect('/reset');
            } else {
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
                return user.save();
            }
        })
        .then(result => {
            // Req.flash needs session save 
            req.flash('info', 'Password reset request mail sent to you!');
            req.session.save(() => {
                res.redirect('/login');
            });
            // res.redirect('/login');
            
            const resetPasswordMailBody =
            `
                <p>You requested a password reset</p>
                <p>Click this 
                <a href="http://localhost:3000/reset/${token}">link</a>
                    to set a new password.</p>
            `
            console.log('DEBUG: Following mail is sent to address "' + req.body.email + '":', resetPasswordMailBody);
            
            transporter.sendMail({
                to: req.body.email,
                from: 'shop@node-complete.com',
                subject: 'Password reset request version 2',
                html: resetPasswordMailBody
            });
        })
        .catch(err => {
            console.log('CATCH: password reset failed', err);
            // Req.flash needs session save 
            req.flash('error', 'No account with that mail found.');
            return req.session.save(() => {
                res.redirect('/reset');
            });
        });
    });
}

exports.getNewPassword = (req, res, next) => {
    console.log('newPassword: token=',req.params.token, 'cookie=', req.get('Cookie'));
    const token = req.params.token;
    User.findOne({ 
        resetToken: token, 
        resetTokenExpiration: { $gt: Date.now() }
    })
    .then (user => {
        if (user) {
            res.render('auth/new-password', {
                pageTitle: 'New Password',
                path: '/new-password',
                errorMessage: req.flash('error')[0],
                userId: user._id.toString(),
                passwordToken: token
            });
        } else {
            console.log('Error: reset password, user or token could not be found');
            // Req.flash needs session save 
            req.flash('error', 'Password Reset request could not be found. Please sent it again.');
            return req.session.save(() => {
                res.redirect('/reset');
            });
        }
    })
    .catch(err => {
        console.log('CATCH: findOne:', err.message)
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    User.findOne({
        _id: userId,
        resetToken: passwordToken,
        resetTokenExpiration: {$gt: Date.now() },
    })
        .then(user => {
            resetUser = user;
            return bcryptjs.hash(newPassword, 12);
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(err => {
            console.log('CATCH: findOne:', err.message)
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}
