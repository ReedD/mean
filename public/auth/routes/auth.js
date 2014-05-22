'use strict';

//Setting up auth routes
angular.module('mean.auth')
    .config(['$stateProvider',
        function($stateProvider) {
            // Check if the user is not conntected
            var checkLoggedOut = function($state, Auth) {
                return Auth.loggedOut();
            };
            // States for authorization
            $stateProvider
                .state('auth.login', {
                    url: '/login',
                    templateUrl: 'public/auth/views/login.html',
                    resolve: {
                        loggedin: checkLoggedOut
                    }
                })
                .state('auth.register', {
                    url: '/register',
                    templateUrl: 'public/auth/views/register.html',
                    resolve: {
                        loggedin: checkLoggedOut
                    }
                });
        }
    ])
    .run([
        '$rootScope',
        '$state',
        '$location',
        'Global',
        function ($rootScope, $state, $location, Global) {
            var ignorePaths = ['register', 'login'];
            var currentLocation = '/';

            /**
             * Saves the current location but ignores
             * the slugs defined in ignore paths and defaults
             * to the root of our app
             * @return void
             */
            function getLocation () {
                currentLocation = $location.path();
                var path = window.location.hash.split('#!/')[1];
                if (ignorePaths.indexOf(path) !== -1) {
                    currentLocation = '/';
                }
            }

            $rootScope.$on('event:auth-loginRequired', function() {
                // Remember current location so that we can
                // redirect the user back after they login
                getLocation();
                $state.go('auth.login');
            });
            $rootScope.$on('event:auth-loginConfirmed', function() {
                // Redirect back to the location we previously remembered
                $location.path(currentLocation);
            });

            // Init by saving current page
            getLocation();
        }]
    );
