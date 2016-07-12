(function(factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['./ApiClient', './model/AuthDeviceRequest', './model/AuthDeviceResponse', './model/AuthResponse', './model/AuthUserRequest', './model/AuthUserResponse', './model/CreateDeviceRequest', './model/CreateDeviceResponse', './model/CreateUserRequest', './model/CreateUserResponse', './model/DeleteDeviceRequest', './model/PingResponse', './model/QueryDevicesResponse', './api/DefaultApi'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('./ApiClient'), require('./model/AuthDeviceRequest'), require('./model/AuthDeviceResponse'), require('./model/AuthResponse'), require('./model/AuthUserRequest'), require('./model/AuthUserResponse'), require('./model/CreateDeviceRequest'), require('./model/CreateDeviceResponse'), require('./model/CreateUserRequest'), require('./model/CreateUserResponse'), require('./model/DeleteDeviceRequest'), require('./model/PingResponse'), require('./model/QueryDevicesResponse'), require('./api/DefaultApi'));
  }
}(function(ApiClient, AuthDeviceRequest, AuthDeviceResponse, AuthResponse, AuthUserRequest, AuthUserResponse, CreateDeviceRequest, CreateDeviceResponse, CreateUserRequest, CreateUserResponse, DeleteDeviceRequest, PingResponse, QueryDevicesResponse, DefaultApi) {
  'use strict';

  /**
   * Client library of big-bang-rest-api.<br>
   * The <code>index</code> module provides access to constructors for all the classes which comprise the public API.
   * <p>
   * An AMD (recommended!) or CommonJS application will generally do something equivalent to the following:
   * <pre>
   * var BigBangRestApi = require('./index'); // See note below*.
   * var xxxSvc = new BigBangRestApi.XxxApi(); // Allocate the API class we're going to use.
   * var yyyModel = new BigBangRestApi.Yyy(); // Construct a model instance.
   * yyyModel.someProperty = 'someValue';
   * ...
   * var zzz = xxxSvc.doSomething(yyyModel); // Invoke the service.
   * ...
   * </pre>
   * <em>*NOTE: For a top-level AMD script, use require(['./index'], function(){...}) and put the application logic within the
   * callback function.</em>
   * </p>
   * <p>
   * A non-AMD browser application (discouraged) might do something like this:
   * <pre>
   * var xxxSvc = new BigBangRestApi.XxxApi(); // Allocate the API class we're going to use.
   * var yyy = new BigBangRestApi.Yyy(); // Construct a model instance.
   * yyyModel.someProperty = 'someValue';
   * ...
   * var zzz = xxxSvc.doSomething(yyyModel); // Invoke the service.
   * ...
   * </pre>
   * </p>
   * @module index
   * @version 0.0.1
   */
  var exports = {
    /**
     * The ApiClient constructor.
     * @property {module:ApiClient}
     */
    ApiClient: ApiClient,
    /**
     * The AuthDeviceRequest model constructor.
     * @property {module:model/AuthDeviceRequest}
     */
    AuthDeviceRequest: AuthDeviceRequest,
    /**
     * The AuthDeviceResponse model constructor.
     * @property {module:model/AuthDeviceResponse}
     */
    AuthDeviceResponse: AuthDeviceResponse,
    /**
     * The AuthResponse model constructor.
     * @property {module:model/AuthResponse}
     */
    AuthResponse: AuthResponse,
    /**
     * The AuthUserRequest model constructor.
     * @property {module:model/AuthUserRequest}
     */
    AuthUserRequest: AuthUserRequest,
    /**
     * The AuthUserResponse model constructor.
     * @property {module:model/AuthUserResponse}
     */
    AuthUserResponse: AuthUserResponse,
    /**
     * The CreateDeviceRequest model constructor.
     * @property {module:model/CreateDeviceRequest}
     */
    CreateDeviceRequest: CreateDeviceRequest,
    /**
     * The CreateDeviceResponse model constructor.
     * @property {module:model/CreateDeviceResponse}
     */
    CreateDeviceResponse: CreateDeviceResponse,
    /**
     * The CreateUserRequest model constructor.
     * @property {module:model/CreateUserRequest}
     */
    CreateUserRequest: CreateUserRequest,
    /**
     * The CreateUserResponse model constructor.
     * @property {module:model/CreateUserResponse}
     */
    CreateUserResponse: CreateUserResponse,
    /**
     * The DeleteDeviceRequest model constructor.
     * @property {module:model/DeleteDeviceRequest}
     */
    DeleteDeviceRequest: DeleteDeviceRequest,
    /**
     * The PingResponse model constructor.
     * @property {module:model/PingResponse}
     */
    PingResponse: PingResponse,
    /**
     * The QueryDevicesResponse model constructor.
     * @property {module:model/QueryDevicesResponse}
     */
    QueryDevicesResponse: QueryDevicesResponse,
    /**
     * The DefaultApi service constructor.
     * @property {module:api/DefaultApi}
     */
    DefaultApi: DefaultApi
  };

  return exports;
}));
