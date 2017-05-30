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
    root.BigBangRestApi.NewAccessTokenResponse = factory(root.BigBangRestApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * The NewAccessTokenResponse model module.
   * @module model/NewAccessTokenResponse
   * @version 0.0.10
   */

  /**
   * Constructs a new <code>NewAccessTokenResponse</code>.
   * @alias module:model/NewAccessTokenResponse
   * @class
   * @param name
   * @param token
   */
  var exports = function(name, token) {

    this['name'] = name;
    this['token'] = token;
  };

  /**
   * Constructs a <code>NewAccessTokenResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/NewAccessTokenResponse} obj Optional instance to populate.
   * @return {module:model/NewAccessTokenResponse} The populated <code>NewAccessTokenResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) { 
      obj = obj || new exports();

      if (data.hasOwnProperty('name')) {
        obj['name'] = ApiClient.convertToType(data['name'], 'String');
      }
      if (data.hasOwnProperty('token')) {
        obj['token'] = ApiClient.convertToType(data['token'], 'String');
      }
    }
    return obj;
  }


  /**
   * @member {String} name
   */
  exports.prototype['name'] = undefined;

  /**
   * @member {String} token
   */
  exports.prototype['token'] = undefined;




  return exports;
}));
