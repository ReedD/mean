'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    uniqueValidator = require('mongoose-unique-validator'),
    crypto = require('crypto');

/**
 * Validations
 */
var validatePresenceOf = function(value) {
    // If you are authenticating by any of the oauth strategies, don't validate.
    return (this.provider && this.provider !== 'local') || value.length;
};

var validatePassword = function (hashed_password) {
    var valid = (this.provider && this.provider !== 'local') || hashed_password.length;
    if (!valid) {
        this.invalidate('password', 'Password cannot be blank');
    }
    if (this._password || this._confirm_password) {
        if (this._password !== this._confirm_password) {
            this.invalidate('confirm_password', 'Passwords do not match');
        }
    }
    return valid;
};

/**
 * User Schema
 */
var UserSchema = new Schema({
    name: {
        type: String,
        validate: [validatePresenceOf, 'Name cannot be blank']
    },
    email: {
        type: String,
        unique: true,
        match: [/.+\@.+\..+/, 'Please enter a valid email'],
        validate: [validatePresenceOf, 'Email cannot be blank']
    },
    username: {
        type: String,
        unique: true,
        validate: [validatePresenceOf, 'Username cannot be blank']
    },
    roles: {
        type: Array,
        default: ['authenticated']
    },
    hashed_password: {
        type: String,
        validate: [validatePassword, 'Password cannot be blank']
    },
    password_token: {
        type: String
    },
    provider: {
        type: String,
        default: 'local'
    },
    salt: String,
    facebook: {},
    twitter: {},
    github: {},
    google: {},
    linkedin: {}
});

/**
 * Plugins
 * The default mongoose `unique` key doesn't use the same validation technique as the rest
 * of the validation rules and creates incosistent validation handling. So we'll override
 * that key and use this plugin to validate instead.
 */
UserSchema.plugin(uniqueValidator, { message: '{VALUE} is already registered.' });

/**
 * Virtuals
 */
UserSchema.virtual('password').set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashed_password = this.hashPassword(password);
}).get(function() {
    return this._password;
});

UserSchema.virtual('confirm_password').set(function(value) {
    this._confirm_password = value;
}).get(function() {
    return this._confirm_password;
});

/**
 * Pre-validate hook
 */
UserSchema.pre('validate', function(next) {
    if (this.isNew) {
        // Set these keys to trigger validation rules
        // This metheod is used in place of setting the
        // required key in the schema so that these keys
        // are only required on create.
        this.name     = this.name      || '';
        this.username = this.username  || '';
        this.email    = this.email     || '';
        console.log(this);
        if (!this.password) {
            this.hashed_password = '';
        }
    }
    next();
});

/**
 * Pre-save hook
 */
UserSchema.pre('save', function(next) {
    if (this.isNew && this.provider === 'local' && this.password && !this.password.length)
        return next(new Error('Invalid password'));
    next();
});

/**
 * Methods
 */
UserSchema.methods = {

    /**
     * HasRole - check if the user has required role
     *
     * @param {String} plainText
     * @return {Boolean}
     * @api public
     */
    hasRole: function(role) {
        var roles = this.roles;
        return roles.indexOf('admin') !== -1 || roles.indexOf(role) !== -1;
    },

    /**
     * IsAdmin - check if the user is an administrator
     *
     * @return {Boolean}
     * @api public
     */
    isAdmin: function() {
        return this.roles.indexOf('admin') !== -1;
    },

    /**
     * Authenticate - check if the passwords are the same
     *
     * @param {String} plainText
     * @return {Boolean}
     * @api public
     */
    authenticate: function(plainText) {
        return this.hashPassword(plainText) === this.hashed_password;
    },

    /**
     * Make salt
     *
     * @return {String}
     * @api public
     */
    makeSalt: function() {
        return crypto.randomBytes(16).toString('base64');
    },

    /**
     * Hash password
     *
     * @param {String} password
     * @return {String}
     * @api public
     */
    hashPassword: function(password) {
        if (!password || !this.salt) return '';
        var salt = new Buffer(this.salt, 'base64');
        return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
    }
};

mongoose.model('User', UserSchema);
