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
    root.BigBangRestApi.PublishResponse = factory(root.BigBangRestApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * The PublishResponse model module.
   * @module model/PublishResponse
   * @version 0.0.10
   */

  /**
   * Constructs a new <code>PublishResponse</code>.
   * @alias module:model/PublishResponse
   * @class
   * @param published
   */
  var exports = function(published) {

    this['published'] = published;
  };

  /**
   * Constructs a <code>PublishResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/PublishResponse} obj Optional instance to populate.
   * @return {module:model/PublishResponse} The populated <code>PublishResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) { 
      obj = obj || new exports();

      if (data.hasOwnProperty('published')) {
        obj['published'] = ApiClient.convertToType(data['published'], 'Boolean');
      }
    }
    return obj;
  }


  /**
   * @member {Boolean} published
   */
  exports.prototype['published'] = undefined;




  return exports;
}));
