# Forward Azure Monitor Logs to Syslog (via Event Hub).

[Azure Monitor](https://docs.microsoft.com/en-us/azure/monitoring-and-diagnostics/monitoring-overview-azure-monitor) provides base-level infrastructure metrics and logs for most services in Microsoft Azure. Azure services that do not yet put their data into Azure Monitor will put it there in the future.

Azure monitor allows you to [forward monitoring data to eventhub](https://azure.microsoft.com/en-us/blog/azure-monitor-send-monitoring-data-to-an-event-hub/).

A common scenario is to have a centralized SIEM based on syslog. The best option is for the SIEM to integrate directly with Azure monitor (Splunk, IBM QRadar, ArcSight...). If that is not available you can use an Azure Function accomplish this integration. This project is a sample for that.

# Overview
![alt text](https://github.com/miguelangelopereira/azuremonitor2syslog/blob/master/media/evenhub2syslog_overview.png "azuremonitor2syslog")

# Usage
* Create Event Hub and setup [Azure monitoring forwarding](https://azure.microsoft.com/en-us/blog/azure-monitor-send-monitoring-data-to-an-event-hub/)
* Create the Function App (v2)
* Import code or setup git deployment
* In the integrate section of the function, make sure Event Hub connection is pointing to the correct event hub
* In the Function App Application Settings, create the following App Settings:
  * SYSLOG_HOSTNAME: The source hostname in the syslog message
  * SYSLOG_SERVER: The remote syslog server
  * SYSLOG_PORT: The port syslog service is running
  * SYSLOG_PROTOCOL: TCP or UDP








