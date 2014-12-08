Big Bang Client SDK
=================

Big Bang lets you create realtime applications in seconds.  It makes event streaming and data synchronization a snap!


Installation
============

    npm install bigbang.io --save
    
or

    bower install bigbang.io --save
    
Example
=======

	var client = new BigBang.Client();
	client.connect('http://demo.bigbang.io', function(err) {
	    if (err) return;
	    console.log('Connected as ' + client.getClientId());
	    
	    client.subscribe('my-channel', function(err, channel) {
	        if (err) return;
	        channel.on('message', function(message) {
	            console.log(message.senderId + ' said ' + message.payload.getBytesAsJSON().message);
	        });	        
	        channel.publish({ message : 'Hi everybody!' });

	        var channelData = channel.getChannelData();
	        channelData.on('add', function(key, value) {
	            console.log('Someone set ' + key + ' to ' + value);
	        });
	        channelData.put('colors', ['red', 'green', 'blue']);
	    });
	});


Servers
=======

To connect to BigBang.io you'll need a server URL. You can use `http://demo.bigbang.io` to try things out. When you are ready, you can create a free Big Bang account and create your first application for free
at [https://cloud.bigbang.io/](https://cloud.bigbang.io/).


Channels
========

Channels are publish/subscribe. You can subscribe to a Channel to get any
messages that are published to it. You can publish a message to send it to
all subscribers.

See Client#subscribe() for more!


Channel Data
============

Channels can have key/value pairs called ChannelData associated with them.
These persist as long as the Channel is active and they are automatically
synchronized to all subscribers of the channel.

See Channel#getChannelData() for more!


API
===

BigBang.Client
--------------

Client manages your connection to the server and lets you interface with Channels.

	var client = new BigBang.Client();
	client.connect('http://demo.bigbang.io', function(err) {
	    if (err) return;
	    console.log('Connected as ' + client.getClientId());
	});
	
	
### **client.connect**(url, options, function(err))

Connect to a Big Bang application at *url*.

**Params**

- url `string` HTTP or HTTPS URL to your application.

- options `object`

- callback (`Error`)


### **client.disconnect**()

Disconnect from the server.

**client.subscribe**(channelName, options, function(err, channel))

Subscribe to a 	channel called *channelName*. *channel* will be a Channel object.

**Params**

- channelName `string`

- options `object`

- callback (`Error`,`Channel`)


### **client.getClientId**():
 
Get your unique clientId. This identifies you to the server and to other users.

** Returns ** `string` clientid
 

### **client.getChannel**(channelName)

Get a reference to the Channel object for the 	subscribed channel called *channelName*.

**Params**

- channelName `string`

**Returns**  `Channel` 


**Events**

**on**('disconnected', function(reason)): 


Event is fired when the client has been disconnected, either from calling disconnect() or for reasons beyond your control.
    
BigBang.Channel
---------------

    client.subscribe('my-channel', function(err, channel) {
        if (err) return;
        channel.on('message', function(message) {
            console.log(message.senderId + ' said ' + message.payload.getBytesAsJSON().message);
        });	        
        channel.publish({ message : 'Hi everybody!' });
    });

### **channel.publish**(obj, function(err))

 
Publish *obj* to the channel. *obj* must be an object or array (for now).

**Params**

- obj `object:array` A javascript object or array
- callback (`Error`) Error if publish fails or is rejected

### **channel.getChannelData**(namespace)

 Returns a *ChannelData* object for the given namespace. If no namespace is supplied a default will be used. Namespaces can be used to organize your channel's data.

**Params**

- namespace `string`


**Returns** `ChannelData`


### **channel.getNamespaces()**

Get the current *ChannelData* namespace names as an Array

**Returns** `ChannelData` or null if namespace does not exist.


### **channel.getSubscribers()**

**Returns** `Array` The clientIds of the current subscribers on this channel as an Array.


### **channel.unsubscribe**(function())

Unsubscribe from the current channel.


### **Events**

### **channel.on('message', function(msg) )**

Fired when a message is received on the channel


###  **channel.on('join', function(clientId))**

Fired when a subscriber joins the channel.

### **channel.on('leave', function(clientId))** 

Fired when a scubscriber leaves the channel.

BigBang.ChannelData
-------------------

    var channelData = channel.getChannelData();
    channelData.on('add', function(key, value) {
        console.log('Someone set ' + key + ' to ' + value);
    });
    channelData.put('colors', ['red', 'green', 'blue']);
	
### **channelData.get**(key)

**Params**

- key `string`

**Returns** `object|Array` Return value associated with key, or null if the key does not exist

### **channelData.put**(key, value)

Set the *value* for *key*.

**Params** 

- key `string`
- value `object|Array`

### **channelData.remove**(key): 

Remove the value associated with *key*.


### **Events**

### **channelData.on**('add', function(key, value))

Fires when a new key and value is added.

### **channelData.on**('update', function(key, value))

Fires when a key's value is updated.

### **channelData.on**('remove', function(key))

Fired when a key (and it's value) is removed.


### **channelData.on**(key, function(value, operation))

Fired when anything happens to key. *value* will be the new value or null in the case of a remove. *operation* is one of add, update or remove. This event is an easy way to monitor a single key.
