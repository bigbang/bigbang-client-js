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
    root.BigBangRestApi.CreateDeviceRequest = factory(root.BigBangRestApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * The CreateDeviceRequest model module.
   * @module model/CreateDeviceRequest
   * @version 0.0.10
   */

  /**
   * Constructs a new <code>CreateDeviceRequest</code>.
   * @alias module:model/CreateDeviceRequest
   * @class
   * @param virtual
   */
  var exports = function(virtual) {


    this['virtual'] = virtual;
  };

  /**
   * Constructs a <code>CreateDeviceRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/CreateDeviceRequest} obj Optional instance to populate.
   * @return {module:model/CreateDeviceRequest} The populated <code>CreateDeviceRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) { 
      obj = obj || new exports();

      if (data.hasOwnProperty('tags')) {
        obj['tags'] = ApiClient.convertToType(data['tags'], ['String']);
      }
      if (data.hasOwnProperty('virtual')) {
        obj['virtual'] = ApiClient.convertToType(data['virtual'], 'Boolean');
      }
    }
    return obj;
  }


  /**
   * @member {Array.<String>} tags
   */
  exports.prototype['tags'] = undefined;

  /**
   * @member {Boolean} virtual
   */
  exports.prototype['virtual'] = undefined;




  return exports;
}));
