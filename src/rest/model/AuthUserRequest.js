(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['../ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.BigBangRestApi) {
      root.BigBangRestApi = {};
    }
    root.BigBangRestApi.AuthUserRequest = factory(root.BigBangRestApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * The AuthUserRequest model module.
   * @module model/AuthUserRequest
   * @version 0.0.1
   */

  /**
   * Constructs a new <code>AuthUserRequest</code>.
   * @alias module:model/AuthUserRequest
   * @class
   * @param email
   * @param password
   */
  var exports = function(email, password) {

    this['email'] = email;
    this['password'] = password;
  };

  /**
   * Constructs a <code>AuthUserRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/AuthUserRequest} obj Optional instance to populate.
   * @return {module:model/AuthUserRequest} The populated <code>AuthUserRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) { 
      obj = obj || new exports();

      if (data.hasOwnProperty('email')) {
        obj['email'] = ApiClient.convertToType(data['email'], 'String');
      }
      if (data.hasOwnProperty('password')) {
        obj['password'] = ApiClient.convertToType(data['password'], 'String');
      }
    }
    return obj;
  }


  /**
   * @member {String} email
   */
  exports.prototype['email'] = undefined;

  /**
   * @member {String} password
   */
  exports.prototype['password'] = undefined;




  return exports;
}));
