'use strict';

(function() {
    // AuthController Spec
    describe('MEAN controllers', function() {
        describe('AuthController', function() {
            beforeEach(function() {
                this.addMatchers({
                    toEqualData: function(expected) {
                        return angular.equals(this.actual, expected);
                    }
                });
            });

            beforeEach(module('mean'));

            var AuthController,
                $httpBackend,
                $location,
                $rootScope,
                Auth,
                Global,
                scope;

            beforeEach(inject(function($injector) {

                $httpBackend = $injector.get('$httpBackend');
                $location = $injector.get('$location');
                $rootScope = $injector.get('$rootScope');
                Global = $injector.get('Global');
                Auth = $injector.get('Auth');
                scope = $rootScope.$new();
                var $templateCache = $injector.get('$templateCache');
                var $controller = $injector.get('$controller');
                var authService = $injector.get('authService');

                $templateCache.put('public/system/views/index.html', '');

                AuthController = $controller('AuthController', {
                    $scope: scope,
                    Auth: Auth,
                    authService: authService
                });

            }));

            afterEach(function() {
                $httpBackend.verifyNoOutstandingExpectation();
                $httpBackend.verifyNoOutstandingRequest();
            });

            it('should login with a correct user and password', function() {
                // fixture expected response data
                var responseLoginData = function() {
                    return {
                        _id: '525cf20451979dea2c000001',
                        email: 'test@example.com',
                        roles: ['authenticated']
                    };
                };

                scope.user = {
                    email: 'test@example.com',
                    password: 'password'
                };

                $httpBackend.when('POST','/login').respond(200, responseLoginData());
                scope.login();
                $httpBackend.flush();

                expect(Global.user).toEqualData(responseLoginData());
                expect($location.url()).toEqual('/');
            });

            it('should fail to log in ', function() {
                $httpBackend.expectPOST('/login').respond(400, {
                    message: 'Authentication failed.'
                });
                scope.login();
                $httpBackend.flush();
                // test scope value
                expect(scope.errors.message).toEqual('Authentication failed.');

            });

            it('should register with correct data', function() {

                // fixture expected response data
                var responseRegisterData = function() {
                    return {
                        _id: '525cf20451979dea2c000001',
                        email: 'test@example.com',
                        roles: ['authenticated']
                    };
                };

                scope.user = new Auth({
                    email: 'test@example.com',
                    password: 'password'
                });

                $httpBackend.when('POST','/register').respond(200, responseRegisterData());
                scope.register();
                $httpBackend.flush();

                expect(Global.user).toEqualData(responseRegisterData());
                expect($location.url()).toEqual('/');
            });

            it('should fail to register with validation errors', function() {

                $httpBackend.expectPOST('/register').respond(400, {
                    message: 'Registration failed.',
                    errors: {
                        username: {message: 'Username already taken'},
                        password: {message: 'Passwords do not match'}
                    }
                });
                scope.register();
                $httpBackend.flush();
                // test scope value
                expect(scope.errors.message).toEqual('Registration failed.');
                expect(scope.errors.username.message).toBe('Username already taken');
                expect(scope.errors.password.message).toBe('Passwords do not match');
            });
        });
    });
}());
