(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['../ApiClient', '../model/AuthDeviceResponse', '../model/AuthDeviceRequest', '../model/CreateDeviceResponse', '../model/CreateDeviceRequest', '../model/PingResponse', '../model/QueryDevicesResponse'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/AuthDeviceResponse'), require('../model/AuthDeviceRequest'), require('../model/CreateDeviceResponse'), require('../model/CreateDeviceRequest'), require('../model/PingResponse'), require('../model/QueryDevicesResponse'));
  } else {
    // Browser globals (root is window)
    if (!root.BigBangRestApi) {
      root.BigBangRestApi = {};
    }
    root.BigBangRestApi.DefaultApi = factory(root.BigBangRestApi.ApiClient, root.BigBangRestApi.AuthDeviceResponse, root.BigBangRestApi.AuthDeviceRequest, root.BigBangRestApi.CreateDeviceResponse, root.BigBangRestApi.CreateDeviceRequest, root.BigBangRestApi.PingResponse, root.BigBangRestApi.QueryDevicesResponse);
  }
}(this, function(ApiClient, AuthDeviceResponse, AuthDeviceRequest, CreateDeviceResponse, CreateDeviceRequest, PingResponse, QueryDevicesResponse) {
  'use strict';

  /**
   * Default service.
   * @module api/DefaultApi
   * @version 0.0.1
   */

  /**
   * Constructs a new DefaultApi. 
   * @alias module:api/DefaultApi
   * @class
   * @param {module:ApiClient} apiClient Optional API client implementation to use, default to {@link module:ApiClient#instance}
   * if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the authDevice operation.
     * @callback module:api/DefaultApi~authDeviceCallback
     * @param {String} error Error message, if any.
     * @param {module:model/AuthDeviceResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Authenticates a device and returns a token.
     * @param {module:model/AuthDeviceRequest} body body
     * @param {module:api/DefaultApi~authDeviceCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/AuthDeviceResponse}
     */
    this.authDevice = function(body, callback) {
      var postBody = body;

      // verify the required parameter 'body' is set
      if (body == undefined || body == null) {
        throw "Missing the required parameter 'body' when calling authDevice";
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = AuthDeviceResponse;

      return this.apiClient.callApi(
        '/auth/device', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the create operation.
     * @callback module:api/DefaultApi~createCallback
     * @param {String} error Error message, if any.
     * @param {module:model/CreateDeviceResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Creates a device
     * @param {module:model/CreateDeviceRequest} body the body
     * @param {module:api/DefaultApi~createCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/CreateDeviceResponse}
     */
    this.create = function(body, callback) {
      var postBody = body;

      // verify the required parameter 'body' is set
      if (body == undefined || body == null) {
        throw "Missing the required parameter 'body' when calling create";
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = CreateDeviceResponse;

      return this.apiClient.callApi(
        '/devices', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the getPing operation.
     * @callback module:api/DefaultApi~getPingCallback
     * @param {String} error Error message, if any.
     * @param {module:model/PingResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns a pong to the caller
     * @param {module:api/DefaultApi~getPingCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/PingResponse}
     */
    this.getPing = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = PingResponse;

      return this.apiClient.callApi(
        '/ping', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the headPing operation.
     * @callback module:api/DefaultApi~headPingCallback
     * @param {String} error Error message, if any.
     * @param {module:model/PingResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns a pong to the caller
     * @param {module:api/DefaultApi~headPingCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/PingResponse}
     */
    this.headPing = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = PingResponse;

      return this.apiClient.callApi(
        '/ping', 'HEAD',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the query operation.
     * @callback module:api/DefaultApi~queryCallback
     * @param {String} error Error message, if any.
     * @param {module:model/QueryDevicesResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Query devices
     * @param {Object} opts Optional parameters
     * @param {String} opts.tags device tag to query
     * @param {module:api/DefaultApi~queryCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/QueryDevicesResponse}
     */
    this.query = function(opts, callback) {
      opts = opts || {};
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
        'tags': opts['tags']
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = QueryDevicesResponse;

      return this.apiClient.callApi(
        '/devices', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));
