const express = require('express');
const router = express.Router();
const google_config = require("../config").google;
const Account = require("../bin/models/account");
const vhost = require("../config").appServer.vhost;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mist_user = require("../bin/mist_user")


passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(user, done) {
    done(null, user);
});


function getAccount(req, res, next) {
    if (req.session.org_id) var org_id = req.session.org_id
    else {
        var org_id = req.params.org_id;
        req.session.org_id = org_id;
    }
    Account
        .findOne({ org_id: org_id })
        .populate("_google")
        .exec((err, account) => {
            if (err) res.status(500).json({ error: err });
            else if (account) {
                req.session.account = account;
                req.session.domains = account._google.domains;
                passport.use(new GoogleStrategy({
                    clientID: google_config.client_id,
                    clientSecret: google_config.client_secret,
                    callbackURL: "https://" + vhost + "/google/callback"
                }, function(accessToken, refreshToken, profile, cb) {
                    return cb(err, profile, account);
                }));
                next();
            } else res.render('error', {
                status: 404,
                message: "Page not found",
                stack: {}
            });
        })
};

/* GET login page. */
router.get('/:org_id/login', getAccount,
    passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/callback', getAccount,
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        if (req.user.emails) req.session.email = req.user.emails[0].value;
        else req.session.email = null;
        if (req.user.name) req.session.name = req.user.displayName;
        else req.session.name = ""

        var domain = req.user.emails[0].value.split("@")[1];
        if (req.session.domains.length == 0 || req.session.domains.indexOf(domain) > -1) {
            console.info("\x1b[32minfo\x1b[0m:", 'User ' + req.session.email + ' logged in');
            if (req.session.mist) res.redirect('/portal/' + req.session.org_id);

            else mist_user.getAccount(req.session.org_id, (err, mist) => {
                if (err) res.render('error', {
                    status: 404,
                    message: "Page not found",
                    stack: {}
                });
                else {
                    req.session.mist = mist
                    res.redirect('/portal/' + req.session.org_id);
                }
            })
        } else {
            console.info("\x1b[32minfo\x1b[0m:", 'User ' + req.session.email + ' logged in but domain ' + domain + " not authorized");
            req.logout();
            req.session.destroy();
            res.render('error', {
                status: 401,
                message: "Domain " + domain + " not authorized to access this application.",
                stack: {}
            });
        }
    }
);


/* Handle Logout */
router.get('/:org_id/logout', function(req, res) {
    if (req.session.user) console.log("User " + req.session.passport.user.upn + " is now logged out.");
    else console.log('user logged out.');
    req.logout();
    req.session.destroy();
    res.redirect('/login/' + req.params.org_id);
});

module.exports = router;