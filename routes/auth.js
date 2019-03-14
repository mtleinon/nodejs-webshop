const express = require('express');
const  { check, body } = require('express-validator/check');
const router = express.Router();

const User = require('../models/user');
const authController = require('../controllers/auth');

router.get('/login', authController.getLogin);

router.post('/login', 
        [   check('email')
                .isEmail()
                //.normalizeEmail()
                .withMessage('Please enter a valid email.'),
            body('password', 
                'Please enter a password with 6 or more characters.')
                .isLength({ min: 5})
                .isAlphanumeric()
                .trim(),
        ],
        authController.postLogin);

router.get('/signup', authController.getSignup);

router.post('/signup', 
        [check('email')
        .isEmail()
        .withMessage('Please enter a valid email.')
        //.normalizeEmail()
        .custom(value => {
            // if (value === 'test@test.com') {
            //     throw new Error('Email address "' + value + '" is not accepted');
            // }
            // return true;
            return User.findOne({ email: value })
                .then(userDoc => {
                    if(userDoc) {
                        console.log('email already exists');
                        return Promise.reject('An account with email address "' + value + '" already exists.');
                    }
                });
        }),
        body('password', 
            'Please enter a password with 6 or more characters.')
            .isLength({ min: 5})
            .trim()
            .isAlphanumeric(),
        body('confirmPassword')
            .trim()
            .custom((value, { req }) => {
            if(value !== req.body.password) {
                throw new Error('Passwords have to match');
            }
            return true;
        })
        ],
        authController.postSignup);

router.get('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;