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
    root.BigBangRestApi.AuthTokenResponse = factory(root.BigBangRestApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * The AuthTokenResponse model module.
   * @module model/AuthTokenResponse
   * @version 0.0.10
   */

  /**
   * Constructs a new <code>AuthTokenResponse</code>.
   * @alias module:model/AuthTokenResponse
   * @class
   * @param authenticated
   */
  var exports = function(authenticated) {

    this['authenticated'] = authenticated;

  };

  /**
   * Constructs a <code>AuthTokenResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/AuthTokenResponse} obj Optional instance to populate.
   * @return {module:model/AuthTokenResponse} The populated <code>AuthTokenResponse</code> instance.
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
