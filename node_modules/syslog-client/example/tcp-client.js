
// Copyright 2015 Stephen Vickers

var syslog = require ("../");

if (process.argv.length < 5) {
	console.log ("usage: udp-client <target> <port> <facility> <severity> "
			+ "<syslog-hostname> <message>");
	process.exit (1);
}

var target         = process.argv[2];
var port           = parseInt(process.argv[3]);
var facility       = process.argv[4];
var severity       = process.argv[5];
var syslogHostname = process.argv[6];
var message        = process.argv[7];

var createOptions = {
	syslogHostname: syslogHostname,
	transport: syslog.Transport.Tcp,
	port: port
};

var client = syslog.createClient(target, createOptions);

client.on("error", function(error) {
	console.error(error);
	client.close();
});

client.on("close", function() {
	console.log("connection closed");
});

var logOptions = {
	facility: syslog.Facility[facility],
	severity: syslog.Severity[severity]
};

for (var i = 0; i < 10; i++) {
	client.log(message, logOptions, function(error) {
		if (error) {
			console.error(error);
		} else {
			console.log("sent message successfully");
		}
	});
}
