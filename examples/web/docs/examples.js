var client = new BigBang.Client();
client.connect('https://demo.bigbang.io', function (err) {
    if (err) {
        return;
    }
    console.log('Connected as ' + client.getClientId());
    continueExamples();
});


function continueExamples() {

    //Subscribe
    client.subscribe('example-channel', function (err, channel) {
        if (err) {
            return;
        }
        console.log('Subscribed to channel ' + channel.getName());


        //Get Channel
        //var channel = client.getChannel('example-channel');


        channel.on('message', function (msg) {
            console.log(JSON.stringify(msg.payload.getBytesAsJSON()));
        });

       	channel.on('join', function(joined) {
       		console.log('clientId ' + joined + ' joined the channel.');
       	});


       	channel.on('leave', function(left) {
       		console.log('clientId ' + left + ' left the channel.');
       	});

        var channelData = channel.getChannelData();

        channelData.on('add', function (key, val) {
            console.log('added ' + key + ' => ' + JSON.stringify(val));
        });

        channelData.on('update', function (key, val) {
            console.log('updated ' + key + ' => ' + JSON.stringify(val));
        });

        channelData.on('remove', function (key) {
            console.log('removed ' + key);
        });


        channel.publish({ message: 'hello' })


        channelData.put('myKey', {message: 'hello channeldata!'});
        channelData.put('myKey', {message: 'hello again channeldata!'});
        channelData.remove('myKey');


        client.on('disconnected', function () {
            console.log('Client disconnected.');
        })


        setTimeout(function () {
            client.disconnect();
        }, 2000);

    });


}