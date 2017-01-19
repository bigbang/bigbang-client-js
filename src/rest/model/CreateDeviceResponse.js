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
    root.BigBangRestApi.CreateDeviceResponse = factory(root.BigBangRestApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * The CreateDeviceResponse model module.
   * @module model/CreateDeviceResponse
   * @version 0.0.10
   */

  /**
   * Constructs a new <code>CreateDeviceResponse</code>.
   * @alias module:model/CreateDeviceResponse
   * @class
   * @param created
   */
  var exports = function(created) {

    this['created'] = created;
  };

  /**
   * Constructs a <code>CreateDeviceResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/CreateDeviceResponse} obj Optional instance to populate.
   * @return {module:model/CreateDeviceResponse} The populated <code>CreateDeviceResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) { 
      obj = obj || new exports();

      if (data.hasOwnProperty('created')) {
        obj['created'] = ApiClient.convertToType(data['created'], 'Boolean');
      }
    }
    return obj;
  }


  /**
   * @member {Boolean} created
   */
  exports.prototype['created'] = undefined;




  return exports;
}));
