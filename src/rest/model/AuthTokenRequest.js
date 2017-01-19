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
    root.BigBangRestApi.AuthTokenRequest = factory(root.BigBangRestApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * The AuthTokenRequest model module.
   * @module model/AuthTokenRequest
   * @version 0.0.10
   */

  /**
   * Constructs a new <code>AuthTokenRequest</code>.
   * @alias module:model/AuthTokenRequest
   * @class
   * @param email
   * @param password
   */
  var exports = function(email, password) {

    this['email'] = email;
    this['password'] = password;
  };

  /**
   * Constructs a <code>AuthTokenRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/AuthTokenRequest} obj Optional instance to populate.
   * @return {module:model/AuthTokenRequest} The populated <code>AuthTokenRequest</code> instance.
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
