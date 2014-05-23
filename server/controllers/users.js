'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    mail = require('nodemailer').mail,
    config = require('../config/config'),
    Redis = require('redis').createClient(),
    async = require('async');

/**
 * Auth callback
 */
exports.authCallback = function(req, res) {
    res.redirect('/');
};

/**
 * Show login form
 */
exports.signin = function(req, res) {
    if(req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.redirect('#!/login');
};

/**
 * Logout
 */
exports.signout = function(req, res) {
    req.logout();
    res.redirect('/');
};

/**
 * Session
 */
exports.session = function(req, res) {
    res.redirect('/');
};

/**
 * Create user
 */
exports.create = function(req, res, next) {
    var user = new User(req.body);

    user.provider = 'local';

    // Hard coded for now. Will address this with the user permissions system in v0.3.5
    user.roles = ['authenticated'];
    user.save(function(err) {
        if (err) {
            return res.send(err, 400);
        }
        req.logIn(user, function(err) {
            if (err) return next(err);
            return res.redirect('/users/me');
        });
    });
};

/**
 * Forgot password
 */
exports.forgotPassword = function(req, res) {
    var email = req.body.email;
    if (email) {
        var user = null;
        async.series([
            function (callback) {
                // Find the associated account
                User.findOne({
                        email: email
                    },
                    function(err, foundUser) {
                        if (err) {
                            return callback(err);
                        } else if (!foundUser) {
                            return callback(new Error('User not found'));
                        }
                        user = foundUser;
                        callback();
                    }
                );
            },
            function (callback) {
                // Invalidate the old key
                Redis.del([user.password_token], function (err) {
                    if (err) {
                        return callback(err);
                    }
                    callback();
                });
            },
            function (callback) {
                // Generate a new key
                require('crypto').randomBytes(10, function(ex, buf) {
                    user.password_token = buf.toString('hex');
                    callback();
                });
            },
            function (callback) {
                // Update the user with the new key
                user.save(function(err) {
                    if (err) {
                        console.log(err);
                        return callback(err);
                    }
                    callback();
                });
            },
            function (callback) {
                // Set the redis value
                var expire = 60 * 60 * 24; // One day
                Redis.setex(user.password_token, expire, JSON.stringify(user), function (err) {
                    if (err) {
                        return callback(err);
                    } else {
                        callback();
                    }
                });
            },
            function (callback) {
                var tokenLink = 'http://' + config.hostname +
                    (config.port ? ':' + config.port : '') +
                    '/#!/reset-password/' + user.password_token;
                console.log({
                    from: config.app.email,
                    to: user.email,
                    subject: config.app.name + ' - Password Reset',
                    text: 'A request has been made to reset your password. ' +
                          'Follow this link to reset your password: ' + tokenLink,
                    html: 'A request has been made to reset your password. ' +
                          'Click <a href="' + tokenLink + '">here<a> to reset your password.'
                });
                mail({
                    from: config.app.email,
                    to: user.email,
                    subject: config.app.name + ' - Password Reset',
                    text: 'A request has been made to reset your password. ' +
                          'Follow this link to reset your password: ' + tokenLink,
                    html: 'A request has been made to reset your password. ' +
                          'Click <a href="' + tokenLink + '">here<a> to reset your password.'
                });
                callback();
            }
        ],
        function (err) {
            if (err) {
                res.jsonp(400, {message: err.message});
            } else {
                res.jsonp({message: 'Password reset instructions have been sent to your email address, you should receive them shortly.'});
            }
        });
    } else {
        res.jsonp(400, {message: 'Email required'});
    }
};

/**
 * Password reset
 */
exports.resetPassword = function(req, res) {
    var token = req.params.token;
    var user = null;

    async.series([
        function (callback) {
            // Get token
            Redis.get(token, function (err, reply) {
                if (err) {
                    return callback(err);
                } else if (!reply) {
                    return callback(new Error('Invalid token'));
                } else {
                    user = JSON.parse(reply);
                    callback();
                }
            });
        },
        function (callback) {
            // Find the associated account
            User.findOne({
                    _id: user._id
                },
                function(err, foundUser) {
                    if (err) {
                        return callback(err);
                    } else if (!foundUser) {
                        return callback(new Error('User has been removed'));
                    }
                    user = foundUser;
                    callback();
                }
            );
        },
        function (callback) {
            // Validate change
            user.password = req.body.password;
            user.confirm_password = req.body.confirm_password;
            user.validate(function (err) {
                if (err) {
                    console.log(err);
                    return callback(err);
                } else {
                    callback();
                }
            });
        },
        function (callback) {
            // Invalidate the token
            Redis.del([token], function (err) {
                if (err) {
                    return callback(err);
                }
                callback();
            });
        },
        function (callback) {
            // Update the user with the new key
            user.save(function(err) {
                if (err) {
                    return callback(err);
                }
                callback();
            });
        }
    ],
    function (err) {
        if (err) {
            res.jsonp(400, err);
        } else {
            res.jsonp({message: 'Your password has been reset, you may now login.'});
        }
    });
};


/**
 * Send User
 */
exports.me = function(req, res) {
    res.jsonp(req.user || null);
};

/**
 * Find user by id
 */
exports.user = function(req, res, next, id) {
    User
        .findOne({
            _id: id
        })
        .exec(function(err, user) {
            if (err) return next(err);
            if (!user) return next(new Error('Failed to load User ' + id));
            req.profile = user;
            next();
        });
};