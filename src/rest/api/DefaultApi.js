(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['../ApiClient', '../model/AuthResponse', '../model/AuthDeviceResponse', '../model/AuthDeviceRequest', '../model/AuthTokenResponse', '../model/AuthTokenRequest', '../model/AuthUserResponse', '../model/AuthUserRequest', '../model/CallRequest', '../model/NotAuthorizedResponse', '../model/CallResponse', '../model/CreateDeviceResponse', '../model/CreateDeviceRequest', '../model/CreateUserResponse', '../model/CreateUserRequest', '../model/ChannelResponse', '../model/DeleteDeviceRequest', '../model/PingResponse', '../model/PublishResponse', '../model/PublishRequest', '../model/ChannelDataPutRequest', '../model/QueryDevicesResponse'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/AuthResponse'), require('../model/AuthDeviceResponse'), require('../model/AuthDeviceRequest'), require('../model/AuthTokenResponse'), require('../model/AuthTokenRequest'), require('../model/AuthUserResponse'), require('../model/AuthUserRequest'), require('../model/CallRequest'), require('../model/NotAuthorizedResponse'), require('../model/CallResponse'), require('../model/CreateDeviceResponse'), require('../model/CreateDeviceRequest'), require('../model/CreateUserResponse'), require('../model/CreateUserRequest'), require('../model/ChannelResponse'), require('../model/DeleteDeviceRequest'), require('../model/PingResponse'), require('../model/PublishResponse'), require('../model/PublishRequest'), require('../model/ChannelDataPutRequest'), require('../model/QueryDevicesResponse'));
  } else {
    // Browser globals (root is window)
    if (!root.BigBangRestApi) {
      root.BigBangRestApi = {};
    }
    root.BigBangRestApi.DefaultApi = factory(root.BigBangRestApi.ApiClient, root.BigBangRestApi.AuthResponse, root.BigBangRestApi.AuthDeviceResponse, root.BigBangRestApi.AuthDeviceRequest, root.BigBangRestApi.AuthTokenResponse, root.BigBangRestApi.AuthTokenRequest, root.BigBangRestApi.AuthUserResponse, root.BigBangRestApi.AuthUserRequest, root.BigBangRestApi.CallRequest, root.BigBangRestApi.NotAuthorizedResponse, root.BigBangRestApi.CallResponse, root.BigBangRestApi.CreateDeviceResponse, root.BigBangRestApi.CreateDeviceRequest, root.BigBangRestApi.CreateUserResponse, root.BigBangRestApi.CreateUserRequest, root.BigBangRestApi.ChannelResponse, root.BigBangRestApi.DeleteDeviceRequest, root.BigBangRestApi.PingResponse, root.BigBangRestApi.PublishResponse, root.BigBangRestApi.PublishRequest, root.BigBangRestApi.ChannelDataPutRequest, root.BigBangRestApi.QueryDevicesResponse);
  }
}(this, function(ApiClient, AuthResponse, AuthDeviceResponse, AuthDeviceRequest, AuthTokenResponse, AuthTokenRequest, AuthUserResponse, AuthUserRequest, CallRequest, NotAuthorizedResponse, CallResponse, CreateDeviceResponse, CreateDeviceRequest, CreateUserResponse, CreateUserRequest, ChannelResponse, DeleteDeviceRequest, PingResponse, PublishResponse, PublishRequest, ChannelDataPutRequest, QueryDevicesResponse) {
  'use strict';

  /**
   * Default service.
   * @module api/DefaultApi
   * @version 0.0.10
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
     * Callback function to receive the result of the authAnon operation.
     * @callback module:api/DefaultApi~authAnonCallback
     * @param {String} error Error message, if any.
     * @param {module:model/AuthResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Authenticates a user and returns a token.
     * @param {module:api/DefaultApi~authAnonCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/AuthResponse}
     */
    this.authAnon = function(callback) {
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
      var contentTypes = ['application/json', 'application/octet-stream'];
      var accepts = ['application/json'];
      var returnType = AuthResponse;

      return this.apiClient.callApi(
        '/auth/anonymous', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

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
     * Callback function to receive the result of the authToken operation.
     * @callback module:api/DefaultApi~authTokenCallback
     * @param {String} error Error message, if any.
     * @param {module:model/AuthTokenResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Authenticates and returns token.
     * @param {module:model/AuthTokenRequest} body body
     * @param {module:api/DefaultApi~authTokenCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/AuthTokenResponse}
     */
    this.authToken = function(body, callback) {
      var postBody = body;

      // verify the required parameter 'body' is set
      if (body == undefined || body == null) {
        throw "Missing the required parameter 'body' when calling authToken";
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
      var returnType = AuthTokenResponse;

      return this.apiClient.callApi(
        '/auth/token', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the authUser operation.
     * @callback module:api/DefaultApi~authUserCallback
     * @param {String} error Error message, if any.
     * @param {module:model/AuthUserResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Authenticates a user and returns a token.
     * @param {module:model/AuthUserRequest} body body
     * @param {module:api/DefaultApi~authUserCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/AuthUserResponse}
     */
    this.authUser = function(body, callback) {
      var postBody = body;

      // verify the required parameter 'body' is set
      if (body == undefined || body == null) {
        throw "Missing the required parameter 'body' when calling authUser";
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
      var returnType = AuthUserResponse;

      return this.apiClient.callApi(
        '/auth/user', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the call operation.
     * @callback module:api/DefaultApi~callCallback
     * @param {String} error Error message, if any.
     * @param {module:model/CallResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Call custom remote method
     * @param {module:model/CallRequest} body the body
     * @param {module:api/DefaultApi~callCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/CallResponse}
     */
    this.call = function(body, callback) {
      var postBody = body;

      // verify the required parameter 'body' is set
      if (body == undefined || body == null) {
        throw "Missing the required parameter 'body' when calling call";
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['JWT'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = CallResponse;

      return this.apiClient.callApi(
        '/call', 'POST',
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
     * Callback function to receive the result of the createUser operation.
     * @callback module:api/DefaultApi~createUserCallback
     * @param {String} error Error message, if any.
     * @param {module:model/CreateUserResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Creates a user
     * @param {module:model/CreateUserRequest} body the body
     * @param {module:api/DefaultApi~createUserCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/CreateUserResponse}
     */
    this.createUser = function(body, callback) {
      var postBody = body;

      // verify the required parameter 'body' is set
      if (body == undefined || body == null) {
        throw "Missing the required parameter 'body' when calling createUser";
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['JWT'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = CreateUserResponse;

      return this.apiClient.callApi(
        '/users', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the delChannelData operation.
     * @callback module:api/DefaultApi~delChannelDataCallback
     * @param {String} error Error message, if any.
     * @param {module:model/ChannelResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Delete k/v pair from channelData
     * @param {String} channel 
     * @param {String} namespace 
     * @param {String} key 
     * @param {module:api/DefaultApi~delChannelDataCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/ChannelResponse}
     */
    this.delChannelData = function(channel, namespace, key, callback) {
      var postBody = null;

      // verify the required parameter 'channel' is set
      if (channel == undefined || channel == null) {
        throw "Missing the required parameter 'channel' when calling delChannelData";
      }

      // verify the required parameter 'namespace' is set
      if (namespace == undefined || namespace == null) {
        throw "Missing the required parameter 'namespace' when calling delChannelData";
      }

      // verify the required parameter 'key' is set
      if (key == undefined || key == null) {
        throw "Missing the required parameter 'key' when calling delChannelData";
      }


      var pathParams = {
        'channel': channel,
        'namespace': namespace,
        'key': key
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['JWT'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = ChannelResponse;

      return this.apiClient.callApi(
        '/channel/{channel}/{namespace}/{key}', 'DELETE',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the deleteDevice operation.
     * @callback module:api/DefaultApi~deleteDeviceCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Deletes a device
     * @param {module:model/DeleteDeviceRequest} body the body
     * @param {module:api/DefaultApi~deleteDeviceCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.deleteDevice = function(body, callback) {
      var postBody = body;

      // verify the required parameter 'body' is set
      if (body == undefined || body == null) {
        throw "Missing the required parameter 'body' when calling deleteDevice";
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['JWT'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = null;

      return this.apiClient.callApi(
        '/devices', 'DELETE',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the getChannel operation.
     * @callback module:api/DefaultApi~getChannelCallback
     * @param {String} error Error message, if any.
     * @param {module:model/ChannelResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Get the channel
     * @param {String} name 
     * @param {module:api/DefaultApi~getChannelCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/ChannelResponse}
     */
    this.getChannel = function(name, callback) {
      var postBody = null;

      // verify the required parameter 'name' is set
      if (name == undefined || name == null) {
        throw "Missing the required parameter 'name' when calling getChannel";
      }


      var pathParams = {
        'name': name
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['JWT'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = ChannelResponse;

      return this.apiClient.callApi(
        '/channel/{name}', 'GET',
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
     * Callback function to receive the result of the publish operation.
     * @callback module:api/DefaultApi~publishCallback
     * @param {String} error Error message, if any.
     * @param {module:model/PublishResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Call custom remote method
     * @param {String} channel 
     * @param {module:model/PublishRequest} body the body
     * @param {module:api/DefaultApi~publishCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/PublishResponse}
     */
    this.publish = function(channel, body, callback) {
      var postBody = body;

      // verify the required parameter 'channel' is set
      if (channel == undefined || channel == null) {
        throw "Missing the required parameter 'channel' when calling publish";
      }

      // verify the required parameter 'body' is set
      if (body == undefined || body == null) {
        throw "Missing the required parameter 'body' when calling publish";
      }


      var pathParams = {
        'channel': channel
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['JWT'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = PublishResponse;

      return this.apiClient.callApi(
        '/publish/{channel}', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the putChannelData operation.
     * @callback module:api/DefaultApi~putChannelDataCallback
     * @param {String} error Error message, if any.
     * @param {module:model/ChannelResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Put k/v pair to channelData
     * @param {String} channel 
     * @param {String} namespace 
     * @param {String} key 
     * @param {module:model/ChannelDataPutRequest} body the body
     * @param {module:api/DefaultApi~putChannelDataCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/ChannelResponse}
     */
    this.putChannelData = function(channel, namespace, key, body, callback) {
      var postBody = body;

      // verify the required parameter 'channel' is set
      if (channel == undefined || channel == null) {
        throw "Missing the required parameter 'channel' when calling putChannelData";
      }

      // verify the required parameter 'namespace' is set
      if (namespace == undefined || namespace == null) {
        throw "Missing the required parameter 'namespace' when calling putChannelData";
      }

      // verify the required parameter 'key' is set
      if (key == undefined || key == null) {
        throw "Missing the required parameter 'key' when calling putChannelData";
      }

      // verify the required parameter 'body' is set
      if (body == undefined || body == null) {
        throw "Missing the required parameter 'body' when calling putChannelData";
      }


      var pathParams = {
        'channel': channel,
        'namespace': namespace,
        'key': key
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['JWT'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = ChannelResponse;

      return this.apiClient.callApi(
        '/channel/{channel}/{namespace}/{key}', 'PUT',
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
