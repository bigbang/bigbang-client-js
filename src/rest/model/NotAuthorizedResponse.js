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
    root.BigBangRestApi.NotAuthorizedResponse = factory(root.BigBangRestApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * The NotAuthorizedResponse model module.
   * @module model/NotAuthorizedResponse
   * @version 0.0.10
   */

  /**
   * Constructs a new <code>NotAuthorizedResponse</code>.
   * @alias module:model/NotAuthorizedResponse
   * @class
   */
  var exports = function() {


  };

  /**
   * Constructs a <code>NotAuthorizedResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/NotAuthorizedResponse} obj Optional instance to populate.
   * @return {module:model/NotAuthorizedResponse} The populated <code>NotAuthorizedResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) { 
      obj = obj || new exports();

      if (data.hasOwnProperty('message')) {
        obj['message'] = ApiClient.convertToType(data['message'], 'String');
      }
    }
    return obj;
  }


  /**
   * @member {String} message
   */
  exports.prototype['message'] = undefined;




  return exports;
}));
