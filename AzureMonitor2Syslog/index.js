module.exports = function (context, myEventHubMessage) {
    var syslog = require("syslog-client");
    var syslogserver = GetEnvironmentVariable("SYSLOG_SERVER");
    var protocol;
    if (GetEnvironmentVariable("SYSLOG_PROTOCOL")=="TCP") {
        protocol = syslog.Transport.Tcp;
    } else {
        protocol = syslog.Transport.Udp;
    }

    var sourcehostname;

    if (GetEnvironmentVariable("SYSLOG_HOSTNAME")=="") {
        sourcehostname = "azurefunction"
    } else {
        sourcehostname = GetEnvironmentVariable("SYSLOG_HOSTNAME");
    }

    var options = {
        syslogHostname: sourcehostname,
        transport: protocol,    
        port: GetEnvironmentVariable("SYSLOG_PORT")
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