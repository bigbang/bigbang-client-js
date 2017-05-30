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
    root.BigBangRestApi.GetAccessTokenResponse = factory(root.BigBangRestApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * The GetAccessTokenResponse model module.
   * @module model/GetAccessTokenResponse
   * @version 0.0.10
   */

  /**
   * Constructs a new <code>GetAccessTokenResponse</code>.
   * @alias module:model/GetAccessTokenResponse
   * @class
   */
  var exports = function() {


  };

  /**
   * Constructs a <code>GetAccessTokenResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetAccessTokenResponse} obj Optional instance to populate.
   * @return {module:model/GetAccessTokenResponse} The populated <code>GetAccessTokenResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) { 
      obj = obj || new exports();

      if (data.hasOwnProperty('tokens')) {
        obj['tokens'] = ApiClient.convertToType(data['tokens'], Object);
      }
    }
    return obj;
  }


  /**
   * @member {Object} tokens
   */
  exports.prototype['tokens'] = undefined;




  return exports;
}));
