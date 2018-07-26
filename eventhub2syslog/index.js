module.exports = function (context, myEventHubMessage) {
    var syslog = require("syslog-client");
    var syslogserver = "40.115.13.56"
    var options = {
        syslogHostname: "azurefunction",
        transport: syslog.Transport.Tcp,
        port: 1000
    };

    context.log('Event Hubs trigger function processed message: ', myEventHubMessage);
    context.log('EnqueuedTimeUtc =', context.bindingData.enqueuedTimeUtc);
    context.log('SequenceNumber =', context.bindingData.sequenceNumber);
    context.log('Offset =', context.bindingData.offset);
    
    
    var client = syslog.createClient(syslogserver, options);

    for(var i = 0; i < myEventHubMessage.records.length; i++) {
        var l = myEventHubMessage.records[i];
        client.log(JSON.stringify(l), options, function(error) {
            if (error) {
                context.log(error);
            } else {
                context.log("sent message successfully");
            }
}       );
    }
      

    context.done();
};