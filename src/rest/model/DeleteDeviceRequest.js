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
    root.BigBangRestApi.DeleteDeviceRequest = factory(root.BigBangRestApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * The DeleteDeviceRequest model module.
   * @module model/DeleteDeviceRequest
   * @version 0.0.1
   */

  /**
   * Constructs a new <code>DeleteDeviceRequest</code>.
   * @alias module:model/DeleteDeviceRequest
   * @class
   */
  var exports = function() {



  };

  /**
   * Constructs a <code>DeleteDeviceRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DeleteDeviceRequest} obj Optional instance to populate.
   * @return {module:model/DeleteDeviceRequest} The populated <code>DeleteDeviceRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) { 
      obj = obj || new exports();

      if (data.hasOwnProperty('key')) {
        obj['key'] = ApiClient.convertToType(data['key'], 'String');
      }
      if (data.hasOwnProperty('secret')) {
        obj['secret'] = ApiClient.convertToType(data['secret'], 'String');
      }
    }
    return obj;
  }


  /**
   * @member {String} key
   */
  exports.prototype['key'] = undefined;

  /**
   * @member {String} secret
   */
  exports.prototype['secret'] = undefined;




  return exports;
}));
