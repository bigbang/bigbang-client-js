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
    root.BigBangRestApi.CallRequest = factory(root.BigBangRestApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * The CallRequest model module.
   * @module model/CallRequest
   * @version 0.0.10
   */

  /**
   * Constructs a new <code>CallRequest</code>.
   * @alias module:model/CallRequest
   * @class
   * @param id
   * @param namespace
   * @param message
   */
  var exports = function(id, namespace, message) {

    this['id'] = id;
    this['namespace'] = namespace;
    this['message'] = message;
  };

  /**
   * Constructs a <code>CallRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/CallRequest} obj Optional instance to populate.
   * @return {module:model/CallRequest} The populated <code>CallRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) { 
      obj = obj || new exports();

      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'String');
      }
      if (data.hasOwnProperty('namespace')) {
        obj['namespace'] = ApiClient.convertToType(data['namespace'], 'String');
      }
      if (data.hasOwnProperty('message')) {
        obj['message'] = ApiClient.convertToType(data['message'], Object);
      }
    }
    return obj;
  }


  /**
   * @member {String} id
   */
  exports.prototype['id'] = undefined;

  /**
   * @member {String} namespace
   */
  exports.prototype['namespace'] = undefined;

  /**
   * @member {Object} message
   */
  exports.prototype['message'] = undefined;




  return exports;
}));
