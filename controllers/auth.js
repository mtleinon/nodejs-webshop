exports.getLogin = (req, res, next) => {
    console.log(req.get('Cookie'));
    console.log(req.session.isLoggedIn);
    
    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/auth',
        isAuthenticated: req.isLoggedIn
    });
};

exports.postLogin = (req, res, next) => {
    // res.setHeader('Set-Cookie', 'loggedIn=true; HttpOnly');
    req.session.isLoggedIn = true;
    res.redirect('/');
};