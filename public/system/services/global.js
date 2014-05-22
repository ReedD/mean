'use strict';

//Global service for global variables
angular.module('mean.system').factory('Global', [
    '$rootScope',
    'Auth',
    function($rootScope) {
        var _this = this;
        _this._data = {
            user: window.user,
            authenticated: false,
            isAdmin: false
        };
        if (window.user && window.user.roles) {
            _this._data.authenticated = window.user.roles.length;
            _this._data.isAdmin = ~window.user.roles.indexOf('admin');
        }

        $rootScope.$on('event:auth-loginConfirmed', function(e, data) {
            _this._data.user = data;
            _this._data.authenticated = data.roles.length;
            _this._data.isAdmin = ~data.roles.indexOf('admin');
        });

        return _this._data;
    }
]);
