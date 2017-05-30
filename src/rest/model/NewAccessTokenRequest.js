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
    root.BigBangRestApi.NewAccessTokenRequest = factory(root.BigBangRestApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * The NewAccessTokenRequest model module.
   * @module model/NewAccessTokenRequest
   * @version 0.0.10
   */

  /**
   * Constructs a new <code>NewAccessTokenRequest</code>.
   * @alias module:model/NewAccessTokenRequest
   * @class
   * @param name
   */
  var exports = function(name) {

    this['name'] = name;
  };

  /**
   * Constructs a <code>NewAccessTokenRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/NewAccessTokenRequest} obj Optional instance to populate.
   * @return {module:model/NewAccessTokenRequest} The populated <code>NewAccessTokenRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) { 
      obj = obj || new exports();

      if (data.hasOwnProperty('name')) {
        obj['name'] = ApiClient.convertToType(data['name'], 'String');
      }
    }
    return obj;
  }


  /**
   * @member {String} name
   */
  exports.prototype['name'] = undefined;




  return exports;
}));
