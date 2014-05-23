'use strict';

angular.module('mean.controllers.login', [])
    .controller('AuthController', ['$scope', '$timeout', '$state', '$stateParams', 'Global', 'Auth', 'authService',
        function($scope, $timeout, $state, $stateParams, Global, Auth, authService) {
            if (Global.user) {
                $scope.user = new Auth(Global.user);
            } else {
                $scope.user = new Auth();
            }
            if ($stateParams.token) {
                $scope.user.password_token = $stateParams.token;
            }
            $scope.errors = {};
            $scope.login = function () {
                Auth.login($scope.user,
                    function (response) {
                        authService.loginConfirmed(response);
                        $scope.user = new Auth();
                        $scope.errors = {};
                    },
                    function (response) {
                        $scope.errors.message = response.data.message;
                    }
                );
            };
            $scope.register = function() {
                $scope.user.$register(
                    function(response) {
                        authService.loginConfirmed(response);
                        $scope.user = new Auth();
                        $scope.errors = {};
                    },
                    function (response) {
                        $scope.errors = response.data.errors || {};
                        $scope.errors.message = response.data.message;
                    }
                );
            };
            $scope.forgotPassword = function() {
                $scope.user.$forgotPassword(
                    function(response) {
                        $scope.user = new Auth();
                        $scope.message = response.message;
                        $scope.errors = {};
                        $timeout(function () {
                            $state.go('auth.login');
                        }, 3000);
                    },
                    function (response) {
                        $scope.errors = response.data.errors || {};
                        $scope.errors.message = response.data.message;
                    }
                );
            };
            $scope.resetPassword = function() {
                $scope.user.$resetPassword(
                    function(response) {
                        $scope.user = new Auth();
                        $scope.message = response.message;
                        $scope.errors = {};
                        $timeout(function () {
                            $state.go('auth.login');
                        }, 3000);
                    },
                    function (response) {
                        $scope.errors = response.data.errors || {};
                        $scope.errors.message = response.data.message;
                    }
                );
            };
        }
    ]);