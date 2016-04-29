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
    root.BigBangRestApi.AuthUserResponse = factory(root.BigBangRestApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * The AuthUserResponse model module.
   * @module model/AuthUserResponse
   * @version 0.0.1
   */

  /**
   * Constructs a new <code>AuthUserResponse</code>.
   * @alias module:model/AuthUserResponse
   * @class
   * @param authenticated
   */
  var exports = function(authenticated) {

    this['authenticated'] = authenticated;
  };

  /**
   * Constructs a <code>AuthUserResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/AuthUserResponse} obj Optional instance to populate.
   * @return {module:model/AuthUserResponse} The populated <code>AuthUserResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) { 
      obj = obj || new exports();

      if (data.hasOwnProperty('authenticated')) {
        obj['authenticated'] = ApiClient.convertToType(data['authenticated'], 'Boolean');
      }
    }
    return obj;
  }


  /**
   * @member {Boolean} authenticated
   */
  exports.prototype['authenticated'] = undefined;




  return exports;
}));
