'use strict';

//Auth service used for users auth REST endpoint
angular.module('mean.auth')
    .provider('Auth', function () {
        this.$get = ['$resource', '$q', '$timeout', function ($resource, $q, $timeout) {
            var AuthMethods = $resource('/:action/:token',
                { token: '@token' }, {
                loggedIn: {
                    method: 'GET',
                    params: {action: 'loggedin'}
                },
                login: {
                    method: 'POST',
                    params: {action: 'login'}
                },
                register: {
                    method: 'POST',
                    params: {action: 'register'}
                },
                forgotPassword: {
                    method: 'POST',
                    params: {action: 'forgot-password'}
                },
                resetPassword: {
                    method: 'POST',
                    params: {
                        action: 'reset-password',
                        token: '@password_token'
                    }
                }
            });

            function Auth(attributes) {
                this.$register = new AuthMethods().$register;
                this.$forgotPassword = new AuthMethods().$forgotPassword;
                this.$resetPassword = new AuthMethods().$resetPassword;
            }

            /**
             * Convenience wrapper for loggedIn to
             * return a promise
             * @return promise
             */
            Auth.loggedIn = function () {
                var deferred = $q.defer();
                AuthMethods.loggedIn(function (response) {
                    $timeout(deferred.resolve);
                }, function (response) {
                    $timeout(deferred.reject);
                });
                return deferred.promise;
            };

            /**
             * Convenience wrapper for loggedOut to
             * reverse the polarity of our loggedIn method
             * @return promise
             */
            Auth.loggedOut = function () {
                var deferred = $q.defer();
                AuthMethods.loggedIn(function (response) {
                    $timeout(deferred.reject);
                }, function (response) {
                    $timeout(deferred.resolve);
                });
                return deferred.promise;
            };

            Auth.login = AuthMethods.login;

            return Auth;
        }];
    });


