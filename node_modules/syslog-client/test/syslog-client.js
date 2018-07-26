var chai = require("chai"),
	expect = chai.expect,
	assert = chai.assert,
	net = require("net"),
	syslogClient = require("../index.js"),
	syslogUdpPort = 5514,
	syslogTcpPort = 5514,
	dgram = require("dgram"),
	net = require("net"),
	rl = require("readline"),
	os = require("os"),
	Promise = require("bluebird"),
	queuedSyslogUdpMessages = [],
	pendingSyslogUdpPromises = [],
	queuedSyslogTcpMessages = [],
	pendingSyslogTcpPromises = [];

chai.should();

function awaitSyslogUdpMsg() {
	return new Promise(function (resolve, reject) {
		var queued = queuedSyslogUdpMessages.shift();
		if (queued)
			return resolve(queued);
		pendingSyslogUdpPromises.push(resolve);
	});
}
function awaitSyslogTcpMsg() {
	return new Promise(function (resolve, reject) {
		var queued = queuedSyslogTcpMessages.shift();
		if (queued)
			return resolve(queued);
		pendingSyslogTcpPromises.push(resolve);
	});
}

function escapeRegExp(string) {
	return (""+string).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}

function constructSyslogRegex(pri, hostname, msg, timestamp) {

	var pat_date;
	if (typeof timestamp === 'undefined') {
		pat_date = "\\w+\\s{1,2}\\d{1,2} \\d{2}:\\d{2}:\\d{2}";
	} else {
		var elems = timestamp.toString().split(/\s+/);

		var month = elems[1];
		var day = elems[2];
		var time = elems[4];

		if (day[0] === "0")
			day = " " + day.substr(1, 1);

		pat_date = escapeRegExp(month + " " + day + " " + time);
	}

	return new RegExp(
		"^<"+
		escapeRegExp(pri)+
		">"+
		pat_date+
		" "+
		escapeRegExp(hostname)+
		" "+
		escapeRegExp(msg)+
		"\\n?$"
	);
}

function constructRfc5424Regex(pri, hostname, msg, msgid, timestamp) {
	var pat_date = typeof timestamp === 'undefined' ?
		"\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\.\\d+)Z" :
		escapeRegExp(timestamp.toISOString());
	return new RegExp(
		"^<"+
		escapeRegExp(pri)+
		">\\d+ "+
		pat_date+
		" "+
		escapeRegExp(hostname)+
		" \\S{1,48} \\d+ "+
		escapeRegExp(msgid)+
		" - "+
		escapeRegExp(msg)+
		"\\n?$"
	);
}

var udpServer = dgram.createSocket("udp4"),
	tcpServer;

before(function (_done) {
	var count = 2;
	var done = function () {
		count--;
		if (count === 0)
			_done();
	};
	udpServer.on("message", function (msg, rinfo) {
		var pend = pendingSyslogUdpPromises.shift();
		if (pend)
			return pend(msg.toString());
		queuedSyslogUdpMessages.push(msg.toString());
	});
	udpServer.on("listening", function () {
		console.log("Started UDP syslog server");
		done();
	});
	udpServer.on("error", function (err) {
		throw new Error(err);
	});
	udpServer.bind(syslogUdpPort);

	tcpServer = net.createServer(function (socket) {
		var lines = rl.createInterface(socket, socket);
		lines.on("line", function (line) {
			var pend = pendingSyslogTcpPromises.shift();
			if (pend)
				return pend(line);
			queuedSyslogTcpMessages.push(line);
		});
	});
	tcpServer.on("error", function (err) {
		throw new Error(err);
	});
	tcpServer.listen(syslogTcpPort, function () {
		console.log("Started TCP syslog server");
		done();
	});

});

describe("Syslog Client", function () {
	it("should set options correctly with defaults", function (done) {
		var client;
		client = new syslogClient.createClient();
		client.target.should.equal("127.0.0.1");
		client.port.should.equal(514);
		client.syslogHostname.should.equal(os.hostname());
		client.tcpTimeout.should.equal(10000);
		client.transport.should.equal(syslogClient.Transport.Udp);

		client = new syslogClient.createClient("127.0.0.2");
		client.target.should.equal("127.0.0.2");
		client.port.should.equal(514);
		client.syslogHostname.should.equal(os.hostname());
		client.tcpTimeout.should.equal(10000);
		client.transport.should.equal(syslogClient.Transport.Udp);

		client = new syslogClient.createClient("127.0.0.2", {});
		client.target.should.equal("127.0.0.2");
		client.port.should.equal(514);
		client.syslogHostname.should.equal(os.hostname());
		client.tcpTimeout.should.equal(10000);
		client.transport.should.equal(syslogClient.Transport.Udp);

		client = new syslogClient.createClient("127.0.0.2", {
			syslogHostname: "test"
		});
		client.target.should.equal("127.0.0.2");
		client.port.should.equal(514);
		client.syslogHostname.should.equal("test");
		client.tcpTimeout.should.equal(10000);
		client.transport.should.equal(syslogClient.Transport.Udp);

		client = new syslogClient.createClient("127.0.0.2", {
			syslogHostname: "test",
			port: 5555
		});
		client.target.should.equal("127.0.0.2");
		client.port.should.equal(5555);
		client.syslogHostname.should.equal("test");
		client.tcpTimeout.should.equal(10000);
		client.transport.should.equal(syslogClient.Transport.Udp);

		client = new syslogClient.createClient("127.0.0.2", {
			syslogHostname: "test",
			port: 5555,
			tcpTimeout: 50
		});
		client.target.should.equal("127.0.0.2");
		client.port.should.equal(5555);
		client.syslogHostname.should.equal("test");
		client.tcpTimeout.should.equal(50);
		client.transport.should.equal(syslogClient.Transport.Udp);

		client = new syslogClient.createClient("127.0.0.2", {
			syslogHostname: "test",
			port: 5555,
			tcpTimeout: 50,
			transport: syslogClient.Transport.Tcp
		});
		client.target.should.equal("127.0.0.2");
		client.port.should.equal(5555);
		client.syslogHostname.should.equal("test");
		client.tcpTimeout.should.equal(50);
		client.transport.should.equal(syslogClient.Transport.Tcp);

		client = new syslogClient.createClient("127.0.0.2", {
			syslogHostname: "test",
			port: 5555,
			tcpTimeout: 50,
			transport: "Not a valid transport"
		});
		client.target.should.equal("127.0.0.2");
		client.port.should.equal(5555);
		client.syslogHostname.should.equal("test");
		client.tcpTimeout.should.equal(50);
		client.transport.should.equal(syslogClient.Transport.Udp);

		done();
	});
	it("should connect to UDP and send log(s)", function () {
		var hostname = "testhostname";
		var client = new syslogClient.createClient("127.0.0.1", {
			port: syslogUdpPort,
			syslogHostname: hostname,
			transport: syslogClient.Transport.Udp
		});

		client.log("This is a test");

		return awaitSyslogUdpMsg()
		.then(function (msg) {
			assert.match(msg, constructSyslogRegex(134, hostname, "This is a test"));
			client.log("This is a second test");
			return awaitSyslogUdpMsg();
		})
		.then(function (msg) {
			assert.match(msg, constructSyslogRegex(134, hostname, "This is a second test"));
		});
	});
	it("should connect to TCP and send log(s)", function () {
		var hostname = "testhostname";
		var client = new syslogClient.createClient("127.0.0.1", {
			port: syslogTcpPort,
			syslogHostname: hostname,
			transport: syslogClient.Transport.Tcp
		});

		client.log("This is a test");

		return awaitSyslogTcpMsg()
		.then(function (msg) {
			assert.match(msg, constructSyslogRegex(134, hostname, "This is a test"));
			client.log("This is a second test");
			return awaitSyslogTcpMsg();
		})
		.then(function (msg) {
			assert.match(msg, constructSyslogRegex(134, hostname, "This is a second test"));
		});
	});
	it("should reuse the UDP transport", function () {
		var hostname = "testhostname";
		var client = new syslogClient.createClient("127.0.0.1", {
			port: syslogUdpPort,
			syslogHostname: hostname,
			transport: syslogClient.Transport.Udp
		});

		client.log("Transport reuse test");
		var transport_;

		return awaitSyslogUdpMsg()
		.then(function (msg) {
			transport_ = client.transport_;
			client.log("Transport reuse test 2");
			assert.typeOf(transport_, "object");
			return awaitSyslogUdpMsg();
		})
		.then(function (msg) {
			assert.equal(transport_, client.transport_);
		});
	});
	it("should reuse the TCP transport", function () {
		var hostname = "testhostname";
		var client = new syslogClient.createClient("127.0.0.1", {
			port: syslogTcpPort,
			syslogHostname: hostname,
			transport: syslogClient.Transport.Tcp
		});

		client.log("Transport reuse test");
		var transport_;

		return awaitSyslogTcpMsg()
		.then(function (msg) {
			transport_ = client.transport_;
			assert.typeOf(transport_, "object");
			client.log("Transport reuse test 2");
			return awaitSyslogTcpMsg();
		})
		.then(function (msg) {
			assert.equal(transport_, client.transport_);
		});
	});
	it("should call close event when closed UDP", function (done) {
		var hostname = "testhostname";
		var client = new syslogClient.createClient("127.0.0.1", {
			port: syslogUdpPort,
			syslogHostname: hostname,
			transport: syslogClient.Transport.Udp
		});

		client.log("Transport close test");
		client.once("close", function () {
			assert.equal(client.transport_, undefined);
			client.once("close", function () {
				assert.equal(client.transport_, undefined);
				done();
			});
			client.close();
		});

		awaitSyslogUdpMsg()
		.then(function (msg) {
			client.close();
		})
	});
	it("should call close event when closed TCP", function (done) {
		var hostname = "testhostname";
		var client = new syslogClient.createClient("127.0.0.1", {
			port: syslogTcpPort,
			syslogHostname: hostname,
			transport: syslogClient.Transport.Tcp
		});

		client.log("Transport close test");
		client.once("close", function () {
			assert.equal(client.transport_, undefined);
			client.once("close", function () {
				assert.equal(client.transport_, undefined);
				done();
			});
			client.close();
		});

		awaitSyslogTcpMsg()
		.then(function (msg) {
			client.close();
		})
	});
	it("should reconnect after connection is closed UDP", function (done) {
		var hostname = "testhostname";
		var client = new syslogClient.createClient("127.0.0.1", {
			port: syslogUdpPort,
			syslogHostname: hostname,
			transport: syslogClient.Transport.Udp
		});

		client.log("Transport close test");
		client.once("close", function () {
			client.log("Restart connection test");
			awaitSyslogUdpMsg()
			.then(function (msg) {
				assert.match(msg, constructSyslogRegex(134, hostname,
					"Restart connection test"));
				done();
			})
		});

		awaitSyslogUdpMsg()
		.then(function (msg) {
			client.close();
		})
	});
	it("should reconnect after connection is closed TCP", function (done) {
		var hostname = "testhostname";
		var client = new syslogClient.createClient("127.0.0.1", {
			port: syslogTcpPort,
			syslogHostname: hostname,
			transport: syslogClient.Transport.Tcp
		});

		client.log("Transport close test");
		client.once("close", function () {
			client.log("Restart connection test");
			awaitSyslogTcpMsg()
			.then(function (msg) {
				assert.match(msg, constructSyslogRegex(134, hostname,
					"Restart connection test"));
				done();
			})
		});

		awaitSyslogTcpMsg()
		.then(function (msg) {
			client.close();
		})
	});
	it("should throw if a string isnt provided to .log()", function () {
		var hostname = "testhostname";
		var client = new syslogClient.createClient("127.0.0.1", {
			port: syslogTcpPort,
			syslogHostname: hostname,
			transport: syslogClient.Transport.Tcp
		});

		(function () {
			client.log();
		}).should.throw(Error);

		(function () {
			client.log({});
		}).should.throw(Error);

		(function () {
			client.log([]);
		}).should.throw(Error);

		(function () {
			client.log(undefined);
		}).should.throw(Error);

		(function () {
			client.log(null);
		}).should.throw(Error);
	});
	it("should take a callback as the second argument to .log", function (done) {
		var hostname = "testhostname";
		var client = new syslogClient.createClient("127.0.0.1", {
			port: syslogTcpPort,
			syslogHostname: hostname,
			transport: syslogClient.Transport.Tcp
		});

		var count = 2,
			decFn = function () {
				count--;
				if (count === 0)
					done();
			};

		client.log("anything", decFn);
		awaitSyslogTcpMsg().then(decFn)
	});
	it("should take options as the second argument to .log", function (done) {
		var hostname = "testhostname";
		var client = new syslogClient.createClient("127.0.0.1", {
			port: syslogTcpPort,
			syslogHostname: hostname,
			transport: syslogClient.Transport.Tcp
		});

		var count = 2,
			decFn = function () {
				count--;
				if (count === 0)
					done();
			};

		client.log("anything", {
			facility: syslogClient.Facility.System,
			severity: syslogClient.Severity.Notice
		}, decFn);
		awaitSyslogTcpMsg().then(function (msg) {
			assert.match(msg, constructSyslogRegex(29, hostname,
				"anything"));
			decFn();
		});
	});
	it("should correctly calculate the PRI value", function (done) {
		var hostname = "testhostname";
		var client = new syslogClient.createClient("127.0.0.1", {
			port: syslogTcpPort,
			syslogHostname: hostname,
			transport: syslogClient.Transport.Tcp
		});

		var count = 2,
			decFn = function () {
				count--;
				if (count === 0)
					done();
			};

		client.log("anything", {
			facility: syslogClient.Facility.Local0,
			severity: syslogClient.Severity.Emergency
		}, decFn);
		awaitSyslogTcpMsg().then(function (msg) {
			assert.match(msg, constructSyslogRegex(128, hostname,
				"anything"));
			decFn();
		});
	})
	it("should call on error on connection error Tcp when invalid port", function (done) {
		var hostname = "testhostname";
		var client = new syslogClient.createClient("127.0.0.1", {
			port: 502342323, // hopefully this isnt in use, TODO find free ports for testing
			syslogHostname: hostname,
			transport: syslogClient.Transport.Tcp
		});

		var count = 2,
			decFn = function () {
				count--;
				if (count === 0)
					done();
			};

		client.on("error", function (err) {
			err.should.be.instanceof(Error);
			decFn();
		});

		client.log("shouldn't work", function (err) {
			err.should.be.instanceof(Error);
			decFn();
		});
	});
	it("should call on error on connection error Udp when invalid port", function (done) {
		var hostname = "testhostname";
		var client = new syslogClient.createClient("127.0.0.1", {
			port: 12378726362, // hopefully this isnt in use, TODO find free ports for testing
			syslogHostname: hostname,
			transport: syslogClient.Transport.Udp
		});

		var count = 2,
			decFn = function () {
				count--;
				if (count === 0)
					done();
			};

		client.on("error", function (err) {
			expect(err).to.be.instanceof(Error);
			decFn();
		});

		client.log("shouldn't work", function (err) {
			err.should.be.instanceof(Error);
			decFn();
		});
	});
	it("should call on error with timeout on connection error Tcp", function (done) {
		var hostname = "testhostname";
		var client = new syslogClient.createClient("203.0.113.1", {
			port: syslogTcpPort, // hopefully this isnt in use, TODO find free ports for testing
			tcpTimeout: 500,
			syslogHostname: hostname,
			transport: syslogClient.Transport.Tcp
		});

		var count = 2,
			decFn = function () {
				count--;
				if (count === 0)
					done();
			};

		client.on("error", function (err) {
			err.should.be.instanceof(Error);
			decFn();
		});

		client.log("shouldn't work", function (err) {
			err.should.be.instanceof(Error);
			decFn();
		});
	});
	it("should connect to UDP and send back-dated obsolete RFC 3164 log(s)", function () {
		var hostname = "testhostname";
		var client = new syslogClient.createClient("127.0.0.1", {
			port: syslogUdpPort,
			syslogHostname: hostname,
			transport: syslogClient.Transport.Udp
		});

		var backdate = new Date(2017, 02, 01);
		client.log("This is a test", {
			msgid: 98765, timestamp: backdate
		});

		return awaitSyslogUdpMsg()
		.then(function (msg) {
			assert.match(msg, constructSyslogRegex(134, hostname, "This is a test", backdate));
			client.log("This is a second test", {
				rfc3164: true, msgid: 102938
			});
			return awaitSyslogUdpMsg();
		})
		.then(function (msg) {
			assert.match(msg, constructSyslogRegex(134, hostname, "This is a second test"));
		});
	});
	it("should connect to UDP and send back-dated RFC 5424 log(s)", function () {
		var hostname = "testhostname";
		var client = new syslogClient.createClient("127.0.0.1", {
			port: syslogUdpPort,
			syslogHostname: hostname,
			transport: syslogClient.Transport.Udp
		});

		var backdate = new Date(2017, 02, 01);
		client.log("This is a test", {
			rfc3164: false, msgid: 98765, timestamp: backdate
		});

		return awaitSyslogUdpMsg()
		.then(function (msg) {
			assert.match(msg, constructRfc5424Regex(134, hostname, "This is a test", 98765, backdate));
			client.log("This is a second test", {
				rfc3164: false
			});
			return awaitSyslogUdpMsg();
		})
		.then(function (msg) {
			assert.match(msg, constructRfc5424Regex(134, hostname, "This is a second test", "-"));
		});
	});
});
