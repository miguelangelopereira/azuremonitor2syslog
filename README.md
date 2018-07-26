# eventhub2syslog
Forward Azure monitor logs to syslog (via Event Hub).

[Azure Monitor](https://docs.microsoft.com/en-us/azure/monitoring-and-diagnostics/monitoring-overview-azure-monitor) provides base-level infrastructure metrics and logs for most services in Microsoft Azure. Azure services that do not yet put their data into Azure Monitor will put it there in the future.

Azure monitor allows you to [forward monitoring data to eventhub](https://azure.microsoft.com/en-us/blog/azure-monitor-send-monitoring-data-to-an-event-hub/).

A common scenario is to have a centralized SIEM based on syslog. The best option is for the SIEM to integrate directly with Azure monitor (Splunk, IBM QRadar, ArcSight...). If that is not available you can use an Azure Function accomplish this integration. This project is a sample for that.









