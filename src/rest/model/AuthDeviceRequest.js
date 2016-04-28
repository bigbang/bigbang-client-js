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
    root.BigBangRestApi.AuthDeviceRequest = factory(root.BigBangRestApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * The AuthDeviceRequest model module.
   * @module model/AuthDeviceRequest
   * @version 0.0.1
   */

  /**
   * Constructs a new <code>AuthDeviceRequest</code>.
   * @alias module:model/AuthDeviceRequest
   * @class
   * @param id
   * @param secret
   */
  var exports = function(id, secret) {

    this['id'] = id;
    this['secret'] = secret;
  };

  /**
   * Constructs a <code>AuthDeviceRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/AuthDeviceRequest} obj Optional instance to populate.
   * @return {module:model/AuthDeviceRequest} The populated <code>AuthDeviceRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) { 
      obj = obj || new exports();

      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'String');
      }
      if (data.hasOwnProperty('secret')) {
        obj['secret'] = ApiClient.convertToType(data['secret'], 'String');
      }
    }
    return obj;
  }


  /**
   * @member {String} id
   */
  exports.prototype['id'] = undefined;

  /**
   * @member {String} secret
   */
  exports.prototype['secret'] = undefined;




  return exports;
}));
