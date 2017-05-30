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
    root.BigBangRestApi.AuthAccessTokenRequest = factory(root.BigBangRestApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * The AuthAccessTokenRequest model module.
   * @module model/AuthAccessTokenRequest
   * @version 0.0.10
   */

  /**
   * Constructs a new <code>AuthAccessTokenRequest</code>.
   * @alias module:model/AuthAccessTokenRequest
   * @class
   * @param accessToken
   */
  var exports = function(accessToken) {

    this['accessToken'] = accessToken;
  };

  /**
   * Constructs a <code>AuthAccessTokenRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/AuthAccessTokenRequest} obj Optional instance to populate.
   * @return {module:model/AuthAccessTokenRequest} The populated <code>AuthAccessTokenRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) { 
      obj = obj || new exports();

      if (data.hasOwnProperty('accessToken')) {
        obj['accessToken'] = ApiClient.convertToType(data['accessToken'], 'String');
      }
    }
    return obj;
  }


  /**
   * @member {String} accessToken
   */
  exports.prototype['accessToken'] = undefined;




  return exports;
}));
