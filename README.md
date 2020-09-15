# Forward Azure Monitor Logs to Syslog (via Event Hub)

[Azure Monitor](https://docs.microsoft.com/en-us/azure/monitoring-and-diagnostics/monitoring-overview-azure-monitor) provides base-level infrastructure metrics and logs for most services in Microsoft Azure. Azure services that do not yet put their data into Azure Monitor will put it there in the future.

Azure monitor allows you to [forward monitoring data to eventhub](https://docs.microsoft.com/en-us/azure/azure-monitor/platform/stream-monitoring-data-event-hubs).

A common scenario is to have a centralized SIEM based on syslog. The best option is for the SIEM to integrate directly with Azure monitor (Splunk, IBM QRadar, ArcSight...). If that is not available you can use an Azure Function accomplish this integration. 

**This project is a sample for testing purpuses**

# Overview
![alt text](https://github.com/miguelangelopereira/azuremonitor2syslog/blob/master/media/azuremonitor2syslog_overview.png "azuremonitor2syslog")

The Azure monitor will send metrics to Event Hub. The Event Hub messages will trigger this Javascript Azure Function that will convert the message to syslog format and send to the correct server.

Note: To send the syslog messages to an internal server in a VNET, configure the Function App with [VNET integration](https://docs.microsoft.com/en-us/azure/app-service/web-sites-integrate-with-vnet).

# Usage
* Create Event Hub and setup [Azure monitoring forwarding](https://azure.microsoft.com/en-us/blog/azure-monitor-send-monitoring-data-to-an-event-hub/)
* Create the Function App (v2). Make sure the runtime is Javascript.
* Import code or setup git deployment
* In the integrate section of the function, make sure Event Hub connection is pointing to the correct event hub
* In the Function App Application Settings, create the following App Settings:
  * SYSLOG_HOSTNAME: The source hostname in the syslog message
  * SYSLOG_SERVER: The remote syslog server
  * SYSLOG_PORT: The port syslog service is running
  * SYSLOG_PROTOCOL: TCP or UDP (defaults to UDP if not configured)
  * SYSLOG_FACILITY: SYSLOG Facility to be used (defaults to 16 = Local0)
 * Make sure the syslog-client package is updated
  
  
  Note: Make sure the EventHub function app extension is installed. See: https://github.com/Azure/azure-functions-host/wiki/Updating-your-function-app-extensions








