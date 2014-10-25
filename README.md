BigBang.io Client
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
at [https://cloud.getbigbang.com/](https://cloud.getbigbang.com/).


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
	
* **connect**(url, options, function(err)): Connect to the server at *url*.
* **disconnect**(): Disconnect from the server.
* **subscribe**(channelName, options, function(err, channel)): Subscribe to a 	channel called *channelName*. *channel* will be a Channel object.
* **getClientId**(): Get your unique clientId. This identifies you to the server and
	to other users.
* **getChannel**(channelName): Get a reference to the Channel object for the 	subscribed channel called *channelName*.
* **on**('disconnected', function(reason)): When the client is disconnected 	from the server, either from calling disconnect() or for reasons beyond your 	control.
    
BigBang.Channel
---------------

    client.subscribe('my-channel', function(err, channel) {
        if (err) return;
        channel.on('message', function(message) {
            console.log(message.senderId + ' said ' + message.payload.getBytesAsJSON().message);
        });	        
        channel.publish({ message : 'Hi everybody!' });
    });

* **publish**(obj, function(err)): Publish *obj* to the channel. *obj* must be an object or array (for now).
* **getChannelData**(namespace): Returns a *ChannelData* object for the given namespace. If no namespace is supplied a default will be used. Namespaces can be used to organize your channel's data.
* **getSubscribers()**: Get the clientIds of the current subscribers on this channel as an Array.
* **unsubscribe**(function()): Unsubscribe from the current channel.
* **on**('message', function(message)): When a message is received on the channel.
* **on**('join', function(clientId)): When someone joins the channel.
* **on**('leave', function(clientId)): When someone leaves the channel.

BigBang.ChannelData
-------------------

    var channelData = channel.getChannelData();
    channelData.on('add', function(key, value) {
        console.log('Someone set ' + key + ' to ' + value);
    });
    channelData.put('colors', ['red', 'green', 'blue']);
	
* **get**(key): Get the value for *key*.
* **put**(key, value): Set the *value* for *key*.
* **remove**(key): Remove the value for *key*.
* **on**('add', function(key, value)): When a new key and value is added.
* **on**('update', function(key, value)): When a key's value is updated.
* **on**('remove', function(key)): When a key (and it's value) is removed.
* **on**(key, function(value, operation)): When anything happens to key. *value* will be the new 	value or null in the case of a remove. *operation* is one of add, update or remove. This 	event is an easy way to monitor just a single key.
