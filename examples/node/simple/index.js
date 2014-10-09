var BigBang = require('bigbang.io');

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
