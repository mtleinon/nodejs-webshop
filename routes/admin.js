const path = require('path');

const express = require('express');

const adminController = require('../controllers/admin');

const  { body } = require('express-validator/check');

const router = express.Router();

const isAuth = require('../middleware/is-auth');

router.get('/add-product', isAuth, adminController.getAddProduct);

router.post('/add-product', 
    isAuth, 
    [
        body('title').isString().isLength({min: 3}).trim(),
        body('imageUrl').isURL(),
        body('price').isFloat(),
        body('description').isLength({min: 5, max: 400}).trim()
    ],
    adminController.postAddProduct);

router.get('/products', isAuth, adminController.getProducts);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', 
        isAuth, 
        [
            body('title').isString().isLength({min: 3}).trim(),
            body('imageUrl').isURL(),
            body('price').isFloat(),
            body('description').isLength({min: 5, max: 400}).trim()
        ],
        adminController.postEditProduct);

router.post('/delete-product', isAuth, adminController.postDeleteProduct);

module.exports = router;
