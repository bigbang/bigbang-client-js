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
    root.BigBangRestApi.AuthAccessTokenResponse = factory(root.BigBangRestApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * The AuthAccessTokenResponse model module.
   * @module model/AuthAccessTokenResponse
   * @version 0.0.10
   */

  /**
   * Constructs a new <code>AuthAccessTokenResponse</code>.
   * @alias module:model/AuthAccessTokenResponse
   * @class
   * @param authenticated
   */
  var exports = function(authenticated) {

    this['authenticated'] = authenticated;

  };

  /**
   * Constructs a <code>AuthAccessTokenResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/AuthAccessTokenResponse} obj Optional instance to populate.
   * @return {module:model/AuthAccessTokenResponse} The populated <code>AuthAccessTokenResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) { 
      obj = obj || new exports();

      if (data.hasOwnProperty('authenticated')) {
        obj['authenticated'] = ApiClient.convertToType(data['authenticated'], 'Boolean');
      }
      if (data.hasOwnProperty('token')) {
        obj['token'] = ApiClient.convertToType(data['token'], 'String');
      }
    }
    return obj;
  }


  /**
   * @member {Boolean} authenticated
   */
  exports.prototype['authenticated'] = undefined;

  /**
   * @member {String} token
   */
  exports.prototype['token'] = undefined;




  return exports;
}));
