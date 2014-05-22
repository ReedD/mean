'use strict';

angular.module('mean.controllers.login', [])
    .controller('AuthController', ['$scope', 'Auth', 'authService',
        function($scope, Auth, authService) {
            $scope.user = new Auth();
            $scope.errors = {};
            $scope.login = function () {
                Auth.login($scope.user,
                    function (response) {
                        authService.loginConfirmed(response);
                        $scope.user = {};
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
                        $scope.message = null;
                    },
                    function (response) {
                        $scope.errors = response.data.errors;
                        $scope.errors.message = response.data.message;
                    }
                );
            };
        }
    ]);