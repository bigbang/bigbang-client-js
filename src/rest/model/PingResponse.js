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
    root.BigBangRestApi.PingResponse = factory(root.BigBangRestApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * The PingResponse model module.
   * @module model/PingResponse
   * @version 0.0.10
   */

  /**
   * Constructs a new <code>PingResponse</code>.
   * @alias module:model/PingResponse
   * @class
   * @param pong
   */
  var exports = function(pong) {

    this['pong'] = pong;
  };

  /**
   * Constructs a <code>PingResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/PingResponse} obj Optional instance to populate.
   * @return {module:model/PingResponse} The populated <code>PingResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) { 
      obj = obj || new exports();

      if (data.hasOwnProperty('pong')) {
        obj['pong'] = ApiClient.convertToType(data['pong'], 'Boolean');
      }
    }
    return obj;
  }


  /**
   * @member {Boolean} pong
   */
  exports.prototype['pong'] = undefined;




  return exports;
}));
