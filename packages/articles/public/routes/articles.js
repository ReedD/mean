'use strict';

//Setting up route
angular.module('mean').config(['$stateProvider',
    function($stateProvider) {
        // Check if the user is connected
        var checkLoggedIn = function(Auth, $state) {
            return Auth.loggedIn().then(
                function () {
                    // Success
                },
                function () {
                    // Error
                    // Redirect to login
                    $state.go('auth.login');
                }
            );
        };

        // states for my app
        $stateProvider
            .state('all articles', {
                url: '/articles',
                templateUrl: 'articles/views/list.html',
                resolve: {
                    loggedin: checkLoggedIn
                }
            })
            .state('create article', {
                url: '/articles/create',
                templateUrl: 'articles/views/create.html',
                resolve: {
                    loggedin: checkLoggedIn
                }
            })
            .state('edit article', {
                url: '/articles/:articleId/edit',
                templateUrl: 'articles/views/edit.html',
                resolve: {
                    loggedin: checkLoggedIn
                }
            })
            .state('article by id', {
                url: '/articles/:articleId',
                templateUrl: 'articles/views/view.html',
                resolve: {
                    loggedin: checkLoggedIn
                }
            });
    }
]);
