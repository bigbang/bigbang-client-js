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
    root.BigBangRestApi.QueryDevicesResponse = factory(root.BigBangRestApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * The QueryDevicesResponse model module.
   * @module model/QueryDevicesResponse
   * @version 0.0.10
   */

  /**
   * Constructs a new <code>QueryDevicesResponse</code>.
   * @alias module:model/QueryDevicesResponse
   * @class
   */
  var exports = function() {


  };

  /**
   * Constructs a <code>QueryDevicesResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/QueryDevicesResponse} obj Optional instance to populate.
   * @return {module:model/QueryDevicesResponse} The populated <code>QueryDevicesResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) { 
      obj = obj || new exports();

      if (data.hasOwnProperty('devices')) {
        obj['devices'] = ApiClient.convertToType(data['devices'], [Object]);
      }
    }
    return obj;
  }


  /**
   * @member {Array.<Object>} devices
   */
  exports.prototype['devices'] = undefined;




  return exports;
}));
