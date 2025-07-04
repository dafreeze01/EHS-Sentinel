// EHS-Sentinel UI JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing EHS-Sentinel UI...");

    // Get the base URL for API calls
    const baseUrl = window.location.origin;

    // Set up tab navigation
    const tabs = {
        'dashboard': document.getElementById('tab-dashboard'),
        'sensors': document.getElementById('tab-sensors'),
        'mqtt': document.getElementById('tab-mqtt'),
        'logs': document.getElementById('tab-logs'),
        'config': document.getElementById('tab-config'),
        'docs': document.getElementById('tab-docs')
    };

    const views = {
        'dashboard': document.getElementById('view-dashboard'),
        'sensors': document.getElementById('view-sensors'),
        'mqtt': document.getElementById('view-mqtt'),
        'logs': document.getElementById('view-logs'),
        'config': document.getElementById('view-config'),
        'docs': document.getElementById('view-docs')
    };

    // Documentation tabs
    const docTabs = {
        'mqtt': document.getElementById('doc-tab-mqtt'),
        'conversion': document.getElementById('doc-tab-conversion'),
        'troubleshooting': document.getElementById('doc-tab-troubleshooting')
    };

    const docViews = {
        'mqtt': document.getElementById('doc-view-mqtt'),
        'conversion': document.getElementById('doc-view-conversion'),
        'troubleshooting': document.getElementById('doc-view-troubleshooting')
    };

    // Set up tab click handlers
    for (const [tabName, tabElement] of Object.entries(tabs)) {
        tabElement.addEventListener('click', () => {
            setActiveTab(tabName);
        });
    }

    // Set up documentation tab click handlers
    for (const [docTabName, docTabElement] of Object.entries(docTabs)) {
        docTabElement.addEventListener('click', () => {
            setActiveDocTab(docTabName);
        });
    }

    // Set dashboard as the default active tab
    setActiveTab('dashboard');
    setActiveDocTab('mqtt');

    // Load initial data
    loadDashboardData();

    // Set up refresh buttons
    document.getElementById('refresh-sensors').addEventListener('click', loadSensorsData);
    document.getElementById('refresh-mqtt').addEventListener('click', loadMQTTData);
    document.getElementById('refresh-logs').addEventListener('click', loadLogsData);
    document.getElementById('refresh-config').addEventListener('click', loadConfigData);
    document.getElementById('generate-docs').addEventListener('click', generateDocumentation);
    document.getElementById('export-logs').addEventListener('click', exportLogs);

    // Set up modal close buttons
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('sensor-details-modal').classList.add('hidden');
    });

    document.getElementById('close-group-modal').addEventListener('click', () => {
        document.getElementById('group-edit-modal').classList.add('hidden');
    });

    // Set up form submissions
    document.getElementById('modal-save-config').addEventListener('click', saveSensorConfig);
    document.getElementById('group-modal-save').addEventListener('click', saveGroupConfig);
    document.getElementById('apply-log-filters').addEventListener('click', applyLogFilters);
    document.getElementById('mqtt-load-history').addEventListener('click', loadMQTTHistory);

    // Set up tab change listeners
    document.getElementById('tab-sensors').addEventListener('click', loadSensorsData);
    document.getElementById('tab-mqtt').addEventListener('click', loadMQTTData);
    document.getElementById('tab-logs').addEventListener('click', loadLogsData);
    document.getElementById('tab-config').addEventListener('click', loadConfigData);
    document.getElementById('tab-docs').addEventListener('click', loadDocumentation);

    // Set up documentation tab change listeners
    document.getElementById('doc-tab-mqtt').addEventListener('click', () => loadSpecificDocumentation('mqtt'));
    document.getElementById('doc-tab-conversion').addEventListener('click', () => loadSpecificDocumentation('conversion'));
    document.getElementById('doc-tab-troubleshooting').addEventListener('click', () => loadSpecificDocumentation('troubleshooting'));

    // Set up auto-refresh
    setInterval(loadDashboardData, 60000); // Refresh dashboard every minute
    setInterval(() => {
        const activeTab = document.querySelector('.tab-active').id;
        if (activeTab === 'tab-sensors') {
            loadSensorsData();
        } else if (activeTab === 'tab-mqtt') {
            loadMQTTData();
        } else if (activeTab === 'tab-logs') {
            loadLogsData();
        }
    }, 300000); // Refresh active tab every 5 minutes

    // Helper function to set the active tab
    function setActiveTab(tabName) {
        // Hide all views
        for (const view of Object.values(views)) {
            view.classList.add('hidden');
        }
        
        // Remove active class from all tabs
        for (const tab of Object.values(tabs)) {
            tab.classList.remove('tab-active');
            tab.classList.add('tab-inactive');
        }
        
        // Show the selected view and set the tab as active
        views[tabName].classList.remove('hidden');
        tabs[tabName].classList.remove('tab-inactive');
        tabs[tabName].classList.add('tab-active');
    }

    // Helper function to set the active documentation tab
    function setActiveDocTab(docTabName) {
        // Hide all doc views
        for (const docView of Object.values(docViews)) {
            docView.classList.add('hidden');
        }
        
        // Remove active class from all doc tabs
        for (const docTab of Object.values(docTabs)) {
            docTab.classList.remove('tab-active');
            docTab.classList.add('tab-inactive');
        }
        
        // Show the selected doc view and set the doc tab as active
        docViews[docTabName].classList.remove('hidden');
        docTabs[docTabName].classList.remove('tab-inactive');
        docTabs[docTabName].classList.add('tab-active');
    }

    // Load dashboard data
    function loadDashboardData() {
        console.log("Loading dashboard data...");
        
        // Load health data
        fetch(`${baseUrl}/api/health`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateSystemHealth(data.data);
                }
            })
            .catch(error => {
                console.error("Error loading health data:", error);
            });
        
        // Load sensor stats
        fetch(`${baseUrl}/api/sensors/status`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateSensorStats(data.data);
                }
            })
            .catch(error => {
                console.error("Error loading sensor stats:", error);
            });
        
        // Load MQTT stats
        fetch(`${baseUrl}/api/mqtt/stats`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateMQTTStats(data.data);
                }
            })
            .catch(error => {
                console.error("Error loading MQTT stats:", error);
            });
        
        // Load log stats
        fetch(`${baseUrl}/api/logs/stats`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateLogStats(data.data);
                }
            })
            .catch(error => {
                console.error("Error loading log stats:", error);
            });
    }

    // Update system health display
    function updateSystemHealth(healthData) {
        const systemHealthElement = document.getElementById('system-health');
        const overallHealthElement = document.getElementById('overall-health');
        const activeSensorsElement = document.getElementById('active-sensors');
        const errorSensorsElement = document.getElementById('error-sensors');
        const unknownSensorsElement = document.getElementById('unknown-sensors');
        const lastUpdateElement = document.getElementById('last-update');
        
        // Update system health indicator
        if (healthData.overall_status === 'healthy') {
            systemHealthElement.textContent = '✅ System Gesund';
            systemHealthElement.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800';
        } else if (healthData.overall_status === 'degraded') {
            systemHealthElement.textContent = '⚠️ System Beeinträchtigt';
            systemHealthElement.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800';
        } else {
            systemHealthElement.textContent = '❌ System Fehlerhaft';
            systemHealthElement.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800';
        }
        
        // Update last update time
        const timestamp = new Date(healthData.components.timestamp);
        lastUpdateElement.textContent = `Letzte Aktualisierung: ${timestamp.toLocaleTimeString()}`;
        
        // Update overall health if available
        if (overallHealthElement && healthData.components.sensor_monitor) {
            const healthPercentage = healthData.components.sensor_monitor.health_percentage || 0;
            overallHealthElement.textContent = `${healthPercentage.toFixed(1)}%`;
            
            // Color based on health
            if (healthPercentage >= 90) {
                overallHealthElement.className = 'font-semibold text-green-600';
            } else if (healthPercentage >= 70) {
                overallHealthElement.className = 'font-semibold text-yellow-600';
            } else {
                overallHealthElement.className = 'font-semibold text-red-600';
            }
        }
    }

    // Update sensor statistics display
    function updateSensorStats(sensorData) {
        const activeSensorsElement = document.getElementById('active-sensors');
        const errorSensorsElement = document.getElementById('error-sensors');
        const unknownSensorsElement = document.getElementById('unknown-sensors');
        
        if (activeSensorsElement) {
            activeSensorsElement.textContent = sensorData.active_sensors || 0;
        }
        
        if (errorSensorsElement) {
            errorSensorsElement.textContent = sensorData.error_sensors || 0;
        }
        
        if (unknownSensorsElement) {
            unknownSensorsElement.textContent = sensorData.unknown_sensors || 0;
        }
        
        // Update critical sensors table
        updateCriticalSensorsTable(sensorData);
    }

    // Update critical sensors table
    function updateCriticalSensorsTable(sensorData) {
        const tableElement = document.getElementById('critical-sensors-table');
        if (!tableElement) return;
        
        // Clear existing rows
        tableElement.innerHTML = '';
        
        // Get critical sensors (priority 1 and 2)
        let criticalSensors = [];
        for (const groupName in sensorData.groups) {
            const group = sensorData.groups[groupName];
            if (group.sensors) {
                const groupCriticalSensors = group.sensors.filter(sensor => 
                    sensor.priority <= 2 || sensor.status === 'error' || sensor.status === 'timeout'
                );
                criticalSensors = criticalSensors.concat(groupCriticalSensors);
            }
        }
        
        // Sort by status (errors first) then by name
        criticalSensors.sort((a, b) => {
            if (a.status === 'error' && b.status !== 'error') return -1;
            if (a.status !== 'error' && b.status === 'error') return 1;
            if (a.status === 'timeout' && b.status !== 'timeout') return -1;
            if (a.status !== 'timeout' && b.status === 'timeout') return 1;
            return a.name.localeCompare(b.name);
        });
        
        // Limit to top 10
        criticalSensors = criticalSensors.slice(0, 10);
        
        // Add rows for each critical sensor
        for (const sensor of criticalSensors) {
            const row = document.createElement('tr');
            
            // Sensor name
            const nameCell = document.createElement('td');
            nameCell.className = 'px-6 py-4 whitespace-nowrap';
            nameCell.textContent = sensor.name;
            row.appendChild(nameCell);
            
            // Status
            const statusCell = document.createElement('td');
            statusCell.className = 'px-6 py-4 whitespace-nowrap';
            const statusSpan = document.createElement('span');
            
            if (sensor.status === 'active') {
                statusSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800';
                statusSpan.textContent = 'Aktiv';
            } else if (sensor.status === 'error') {
                statusSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800';
                statusSpan.textContent = 'Fehler';
            } else if (sensor.status === 'timeout') {
                statusSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800';
                statusSpan.textContent = 'Timeout';
            } else {
                statusSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800';
                statusSpan.textContent = sensor.status || 'Unbekannt';
            }
            
            statusCell.appendChild(statusSpan);
            row.appendChild(statusCell);
            
            // Last value
            const valueCell = document.createElement('td');
            valueCell.className = 'px-6 py-4 whitespace-nowrap';
            if (sensor.last_reading && sensor.last_reading.value !== null) {
                valueCell.textContent = sensor.last_reading.value;
            } else {
                valueCell.textContent = '-';
            }
            row.appendChild(valueCell);
            
            // Timestamp
            const timestampCell = document.createElement('td');
            timestampCell.className = 'px-6 py-4 whitespace-nowrap';
            if (sensor.last_reading && sensor.last_reading.timestamp) {
                const timestamp = new Date(sensor.last_reading.timestamp);
                timestampCell.textContent = timestamp.toLocaleString();
            } else {
                timestampCell.textContent = '-';
            }
            row.appendChild(timestampCell);
            
            // Response time
            const responseTimeCell = document.createElement('td');
            responseTimeCell.className = 'px-6 py-4 whitespace-nowrap';
            if (sensor.last_reading && sensor.last_reading.response_time_ms) {
                responseTimeCell.textContent = `${sensor.last_reading.response_time_ms.toFixed(2)} ms`;
            } else {
                responseTimeCell.textContent = '-';
            }
            row.appendChild(responseTimeCell);
            
            tableElement.appendChild(row);
        }
        
        // If no critical sensors, add a message
        if (criticalSensors.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 5;
            cell.className = 'px-6 py-4 text-center text-gray-500';
            cell.textContent = 'Keine kritischen Sensoren gefunden';
            row.appendChild(cell);
            tableElement.appendChild(row);
        }
    }

    // Update MQTT statistics display
    function updateMQTTStats(mqttData) {
        const totalMessagesElement = document.getElementById('mqtt-total-messages');
        const recentMessagesElement = document.getElementById('mqtt-recent-messages');
        const successRateElement = document.getElementById('mqtt-success-rate');
        const responseTimeElement = document.getElementById('mqtt-response-time');
        
        if (totalMessagesElement) {
            totalMessagesElement.textContent = mqttData.message_stats?.total_messages || 0;
        }
        
        if (recentMessagesElement) {
            recentMessagesElement.textContent = mqttData.message_stats?.messages_last_hour || 0;
        }
        
        if (successRateElement) {
            const successRate = mqttData.flow_stats?.success_rate || 0;
            successRateElement.textContent = `${successRate.toFixed(1)}%`;
        }
        
        if (responseTimeElement) {
            const responseTime = mqttData.flow_stats?.avg_response_time_ms || 0;
            responseTimeElement.textContent = `${responseTime.toFixed(2)} ms`;
        }
        
        // Update recent errors
        updateRecentErrors(mqttData.recent_errors || []);
    }

    // Update recent errors display
    function updateRecentErrors(errors) {
        const recentErrorsElement = document.getElementById('recent-errors');
        if (!recentErrorsElement) return;
        
        // Clear existing errors
        recentErrorsElement.innerHTML = '';
        
        // Add each error
        for (const error of errors) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'bg-red-50 border border-red-200 rounded-md p-4';
            
            const errorHeader = document.createElement('div');
            errorHeader.className = 'flex justify-between';
            
            const errorType = document.createElement('span');
            errorType.className = 'font-semibold text-red-800';
            errorType.textContent = error.type;
            errorHeader.appendChild(errorType);
            
            const errorTime = document.createElement('span');
            errorTime.className = 'text-sm text-gray-500';
            const timestamp = new Date(error.timestamp);
            errorTime.textContent = timestamp.toLocaleString();
            errorHeader.appendChild(errorTime);
            
            errorDiv.appendChild(errorHeader);
            
            const errorMessage = document.createElement('p');
            errorMessage.className = 'mt-2 text-sm text-gray-700';
            errorMessage.textContent = error.message;
            errorDiv.appendChild(errorMessage);
            
            const errorDetails = document.createElement('p');
            errorDetails.className = 'mt-1 text-xs text-gray-500';
            errorDetails.textContent = `Sensor: ${error.sensor}, Details: ${error.details}`;
            errorDiv.appendChild(errorDetails);
            
            recentErrorsElement.appendChild(errorDiv);
        }
        
        // If no errors, add a message
        if (errors.length === 0) {
            const noErrorsDiv = document.createElement('div');
            noErrorsDiv.className = 'bg-green-50 border border-green-200 rounded-md p-4 text-center';
            noErrorsDiv.textContent = 'Keine aktuellen Fehler';
            recentErrorsElement.appendChild(noErrorsDiv);
        }
    }

    // Update log statistics display
    function updateLogStats(logData) {
        const totalEntriesElement = document.getElementById('log-total-entries');
        const errorCountElement = document.getElementById('log-error-count');
        const errorRateElement = document.getElementById('log-error-rate');
        const avgDurationElement = document.getElementById('log-avg-duration');
        
        if (totalEntriesElement) {
            totalEntriesElement.textContent = logData.total_entries || 0;
        }
        
        if (errorCountElement) {
            errorCountElement.textContent = logData.level_breakdown?.ERROR || 0;
        }
        
        if (errorRateElement) {
            const errorRate = logData.error_rate || 0;
            errorRateElement.textContent = `${errorRate.toFixed(1)}%`;
        }
        
        if (avgDurationElement) {
            const avgDuration = logData.performance?.avg_duration_ms || 0;
            avgDurationElement.textContent = `${avgDuration.toFixed(2)} ms`;
        }
        
        // Update level breakdown
        updateLogLevelBreakdown(logData.level_breakdown || {});
        
        // Update category breakdown
        updateLogCategoryBreakdown(logData.category_breakdown || {});
        
        // Update sensor breakdown
        updateLogSensorBreakdown(logData.sensor_breakdown || {});
    }

    // Update log level breakdown
    function updateLogLevelBreakdown(levelData) {
        const levelStatsElement = document.getElementById('log-stats-level');
        if (!levelStatsElement) return;
        
        // Clear existing stats
        levelStatsElement.innerHTML = '';
        
        // Add each level
        for (const [level, count] of Object.entries(levelData)) {
            const levelDiv = document.createElement('div');
            levelDiv.className = 'flex justify-between';
            
            const levelName = document.createElement('span');
            levelName.className = 'text-gray-600';
            levelName.textContent = level;
            levelDiv.appendChild(levelName);
            
            const levelCount = document.createElement('span');
            levelCount.className = 'font-semibold';
            
            // Color based on level
            if (level === 'ERROR' || level === 'CRITICAL') {
                levelCount.className += ' text-red-600';
            } else if (level === 'WARNING') {
                levelCount.className += ' text-yellow-600';
            } else {
                levelCount.className += ' text-blue-600';
            }
            
            levelCount.textContent = count;
            levelDiv.appendChild(levelCount);
            
            levelStatsElement.appendChild(levelDiv);
        }
    }

    // Update log category breakdown
    function updateLogCategoryBreakdown(categoryData) {
        const categoryStatsElement = document.getElementById('log-stats-category');
        if (!categoryStatsElement) return;
        
        // Clear existing stats
        categoryStatsElement.innerHTML = '';
        
        // Add each category
        for (const [category, count] of Object.entries(categoryData)) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'flex justify-between';
            
            const categoryName = document.createElement('span');
            categoryName.className = 'text-gray-600';
            categoryName.textContent = category.replace(/_/g, ' ');
            categoryDiv.appendChild(categoryName);
            
            const categoryCount = document.createElement('span');
            categoryCount.className = 'font-semibold';
            categoryCount.textContent = count;
            categoryDiv.appendChild(categoryCount);
            
            categoryStatsElement.appendChild(categoryDiv);
        }
    }

    // Update log sensor breakdown
    function updateLogSensorBreakdown(sensorData) {
        const sensorStatsElement = document.getElementById('log-stats-sensors');
        if (!sensorStatsElement) return;
        
        // Clear existing stats
        sensorStatsElement.innerHTML = '';
        
        // Convert to array and sort by errors (descending)
        const sensors = Object.entries(sensorData)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.errors - a.errors)
            .slice(0, 5); // Top 5
        
        // Add each sensor
        for (const sensor of sensors) {
            if (sensor.errors === 0) continue; // Skip sensors with no errors
            
            const sensorDiv = document.createElement('div');
            sensorDiv.className = 'flex justify-between';
            
            const sensorName = document.createElement('span');
            sensorName.className = 'text-gray-600';
            sensorName.textContent = sensor.name;
            sensorDiv.appendChild(sensorName);
            
            const sensorStats = document.createElement('span');
            sensorStats.className = 'font-semibold';
            const errorRate = (sensor.errors / sensor.total * 100).toFixed(1);
            sensorStats.textContent = `${sensor.errors} (${errorRate}%)`;
            
            // Color based on error rate
            if (errorRate > 50) {
                sensorStats.className += ' text-red-600';
            } else if (errorRate > 20) {
                sensorStats.className += ' text-yellow-600';
            } else {
                sensorStats.className += ' text-orange-600';
            }
            
            sensorDiv.appendChild(sensorStats);
            
            sensorStatsElement.appendChild(sensorDiv);
        }
        
        // If no sensors with errors, add a message
        if (sensors.length === 0 || sensors.every(s => s.errors === 0)) {
            const noErrorsDiv = document.createElement('div');
            noErrorsDiv.className = 'text-center text-green-600';
            noErrorsDiv.textContent = 'Keine Sensoren mit Fehlern';
            sensorStatsElement.appendChild(noErrorsDiv);
        }
    }

    // Load sensors data
    function loadSensorsData() {
        console.log("Loading sensors data...");
        
        fetch(`${baseUrl}/api/sensors/status`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateSensorsTable(data.data);
                    updateGroupFilter(data.data);
                }
            })
            .catch(error => {
                console.error("Error loading sensors data:", error);
            });
    }

    // Update sensors table
    function updateSensorsTable(sensorData) {
        const tableElement = document.getElementById('sensors-table');
        if (!tableElement) return;
        
        // Clear existing rows
        tableElement.innerHTML = '';
        
        // Get all sensors from all groups
        let allSensors = [];
        for (const groupName in sensorData.groups) {
            const group = sensorData.groups[groupName];
            if (group.sensors) {
                for (const sensor of group.sensors) {
                    sensor.group = groupName; // Add group name to sensor
                    allSensors.push(sensor);
                }
            }
        }
        
        // Apply filters
        const groupFilter = document.getElementById('group-filter').value;
        const statusFilter = document.getElementById('status-filter').value;
        
        if (groupFilter !== 'all') {
            allSensors = allSensors.filter(sensor => sensor.group === groupFilter);
        }
        
        if (statusFilter !== 'all') {
            allSensors = allSensors.filter(sensor => sensor.status === statusFilter);
        }
        
        // Sort by name
        allSensors.sort((a, b) => a.name.localeCompare(b.name));
        
        // Add rows for each sensor
        for (const sensor of allSensors) {
            const row = document.createElement('tr');
            
            // Sensor name
            const nameCell = document.createElement('td');
            nameCell.className = 'px-6 py-4 whitespace-nowrap';
            nameCell.textContent = sensor.name;
            row.appendChild(nameCell);
            
            // Description
            const descCell = document.createElement('td');
            descCell.className = 'px-6 py-4 whitespace-nowrap';
            descCell.textContent = sensor.description || '-';
            row.appendChild(descCell);
            
            // Group
            const groupCell = document.createElement('td');
            groupCell.className = 'px-6 py-4 whitespace-nowrap';
            groupCell.textContent = sensor.group || '-';
            row.appendChild(groupCell);
            
            // Status
            const statusCell = document.createElement('td');
            statusCell.className = 'px-6 py-4 whitespace-nowrap';
            const statusSpan = document.createElement('span');
            
            if (sensor.status === 'active') {
                statusSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800';
                statusSpan.textContent = 'Aktiv';
            } else if (sensor.status === 'error') {
                statusSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800';
                statusSpan.textContent = 'Fehler';
            } else if (sensor.status === 'timeout') {
                statusSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800';
                statusSpan.textContent = 'Timeout';
            } else {
                statusSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800';
                statusSpan.textContent = sensor.status || 'Unbekannt';
            }
            
            statusCell.appendChild(statusSpan);
            row.appendChild(statusCell);
            
            // Last value
            const valueCell = document.createElement('td');
            valueCell.className = 'px-6 py-4 whitespace-nowrap';
            if (sensor.last_reading && sensor.last_reading.value !== null) {
                valueCell.textContent = sensor.last_reading.value;
            } else {
                valueCell.textContent = '-';
            }
            row.appendChild(valueCell);
            
            // Timestamp
            const timestampCell = document.createElement('td');
            timestampCell.className = 'px-6 py-4 whitespace-nowrap';
            if (sensor.last_reading && sensor.last_reading.timestamp) {
                const timestamp = new Date(sensor.last_reading.timestamp);
                timestampCell.textContent = timestamp.toLocaleString();
            } else {
                timestampCell.textContent = '-';
            }
            row.appendChild(timestampCell);
            
            // Actions
            const actionsCell = document.createElement('td');
            actionsCell.className = 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium';
            
            const detailsButton = document.createElement('button');
            detailsButton.className = 'text-indigo-600 hover:text-indigo-900 mr-2';
            detailsButton.textContent = 'Details';
            detailsButton.addEventListener('click', () => {
                showSensorDetails(sensor);
            });
            actionsCell.appendChild(detailsButton);
            
            row.appendChild(actionsCell);
            
            tableElement.appendChild(row);
        }
        
        // If no sensors, add a message
        if (allSensors.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 7;
            cell.className = 'px-6 py-4 text-center text-gray-500';
            cell.textContent = 'Keine Sensoren gefunden';
            row.appendChild(cell);
            tableElement.appendChild(row);
        }
    }

    // Update group filter dropdown
    function updateGroupFilter(sensorData) {
        const groupFilterElement = document.getElementById('group-filter');
        if (!groupFilterElement) return;
        
        // Save current selection
        const currentSelection = groupFilterElement.value;
        
        // Clear existing options (except 'all')
        while (groupFilterElement.options.length > 1) {
            groupFilterElement.remove(1);
        }
        
        // Add option for each group
        const groups = Object.keys(sensorData.groups || {}).sort();
        for (const group of groups) {
            const option = document.createElement('option');
            option.value = group;
            option.textContent = group;
            groupFilterElement.appendChild(option);
        }
        
        // Restore selection if it still exists
        if (currentSelection && Array.from(groupFilterElement.options).some(opt => opt.value === currentSelection)) {
            groupFilterElement.value = currentSelection;
        }
    }

    // Show sensor details in modal
    function showSensorDetails(sensor) {
        // Set modal title
        document.getElementById('modal-sensor-name').textContent = sensor.name;
        
        // Set sensor info
        document.getElementById('modal-description').textContent = sensor.description || '-';
        document.getElementById('modal-group').textContent = sensor.group || '-';
        document.getElementById('modal-priority').textContent = sensor.priority || '-';
        document.getElementById('modal-polling').textContent = `${sensor.polling_interval || '-'} s`;
        document.getElementById('modal-enabled').textContent = sensor.enabled ? 'Ja' : 'Nein';
        document.getElementById('modal-writable').textContent = sensor.writable ? 'Ja' : 'Nein';
        document.getElementById('modal-address').textContent = sensor.nasa_address || '-';
        document.getElementById('modal-entity-id').textContent = sensor.hass_entity_id || '-';
        
        // Set status info
        document.getElementById('modal-status').textContent = sensor.status || '-';
        
        if (sensor.last_reading) {
            document.getElementById('modal-last-value').textContent = sensor.last_reading.value !== null ? sensor.last_reading.value : '-';
            
            if (sensor.last_reading.timestamp) {
                const timestamp = new Date(sensor.last_reading.timestamp);
                document.getElementById('modal-timestamp').textContent = timestamp.toLocaleString();
            } else {
                document.getElementById('modal-timestamp').textContent = '-';
            }
            
            document.getElementById('modal-response-time').textContent = sensor.last_reading.response_time_ms ? 
                `${sensor.last_reading.response_time_ms.toFixed(2)} ms` : '-';
        } else {
            document.getElementById('modal-last-value').textContent = '-';
            document.getElementById('modal-timestamp').textContent = '-';
            document.getElementById('modal-response-time').textContent = '-';
        }
        
        if (sensor.statistics) {
            document.getElementById('modal-success-rate').textContent = `${sensor.statistics.success_rate.toFixed(1)}%`;
            document.getElementById('modal-error-count').textContent = sensor.statistics.error_count || 0;
        } else {
            document.getElementById('modal-success-rate').textContent = '-';
            document.getElementById('modal-error-count').textContent = '-';
        }
        
        // Set form values for configuration
        document.getElementById('modal-input-polling').value = sensor.polling_interval || 60;
        document.getElementById('modal-input-priority').value = sensor.priority || 3;
        document.getElementById('modal-input-enabled').checked = sensor.enabled !== false;
        
        // Load MQTT history
        loadSensorMQTTHistory(sensor.name);
        
        // Show modal
        document.getElementById('sensor-details-modal').classList.remove('hidden');
    }

    // Load sensor MQTT history
    function loadSensorMQTTHistory(sensorName) {
        const historyElement = document.getElementById('modal-mqtt-history');
        if (!historyElement) return;
        
        // Clear existing history
        historyElement.innerHTML = '<p class="text-center text-gray-500">Lade MQTT-Historie...</p>';
        
        fetch(`${baseUrl}/api/mqtt/history/${sensorName}?hours=24`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateSensorMQTTHistory(data.data);
                } else {
                    historyElement.innerHTML = '<p class="text-center text-red-500">Fehler beim Laden der MQTT-Historie</p>';
                }
            })
            .catch(error => {
                console.error("Error loading MQTT history:", error);
                historyElement.innerHTML = '<p class="text-center text-red-500">Fehler beim Laden der MQTT-Historie</p>';
            });
    }

    // Update sensor MQTT history display
    function updateSensorMQTTHistory(historyData) {
        const historyElement = document.getElementById('modal-mqtt-history');
        if (!historyElement) return;
        
        // Clear existing history
        historyElement.innerHTML = '';
        
        // Check if there's any history
        if (!historyData.communication_flows || historyData.communication_flows.length === 0) {
            historyElement.innerHTML = '<p class="text-center text-gray-500">Keine MQTT-Historie verfügbar</p>';
            return;
        }
        
        // Create table
        const table = document.createElement('table');
        table.className = 'min-w-full divide-y divide-gray-200';
        
        // Create header
        const thead = document.createElement('thead');
        thead.className = 'bg-gray-50';
        
        const headerRow = document.createElement('tr');
        
        const headers = ['Zeitpunkt', 'Typ', 'SET-Wert', 'STATE-Wert', 'Antwortzeit', 'Status'];
        for (const header of headers) {
            const th = document.createElement('th');
            th.className = 'px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
            th.textContent = header;
            headerRow.appendChild(th);
        }
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create body
        const tbody = document.createElement('tbody');
        tbody.className = 'bg-white divide-y divide-gray-200';
        
        // Add rows for each flow
        for (const flow of historyData.communication_flows) {
            const row = document.createElement('tr');
            
            // Timestamp
            const timestampCell = document.createElement('td');
            timestampCell.className = 'px-3 py-2 whitespace-nowrap text-sm';
            const timestamp = new Date(flow.timestamp);
            timestampCell.textContent = timestamp.toLocaleTimeString();
            row.appendChild(timestampCell);
            
            // Type
            const typeCell = document.createElement('td');
            typeCell.className = 'px-3 py-2 whitespace-nowrap text-sm';
            typeCell.textContent = flow.initiated_by === 'home_assistant' ? 'SET' : 'STATE';
            row.appendChild(typeCell);
            
            // SET value
            const setValueCell = document.createElement('td');
            setValueCell.className = 'px-3 py-2 whitespace-nowrap text-sm';
            setValueCell.textContent = flow.set_value !== null ? flow.set_value : '-';
            row.appendChild(setValueCell);
            
            // STATE value
            const stateValueCell = document.createElement('td');
            stateValueCell.className = 'px-3 py-2 whitespace-nowrap text-sm';
            stateValueCell.textContent = flow.state_value !== null ? flow.state_value : '-';
            row.appendChild(stateValueCell);
            
            // Response time
            const responseTimeCell = document.createElement('td');
            responseTimeCell.className = 'px-3 py-2 whitespace-nowrap text-sm';
            responseTimeCell.textContent = flow.response_time_ms ? `${flow.response_time_ms.toFixed(2)} ms` : '-';
            row.appendChild(responseTimeCell);
            
            // Status
            const statusCell = document.createElement('td');
            statusCell.className = 'px-3 py-2 whitespace-nowrap text-sm';
            
            if (flow.success) {
                statusCell.innerHTML = '<span class="text-green-600">✓</span>';
            } else if (flow.error_message) {
                statusCell.innerHTML = `<span class="text-red-600">✗</span> <span class="text-xs">${flow.error_message}</span>`;
            } else {
                statusCell.textContent = '-';
            }
            
            row.appendChild(statusCell);
            
            tbody.appendChild(row);
        }
        
        table.appendChild(tbody);
        historyElement.appendChild(table);
    }

    // Save sensor configuration
    function saveSensorConfig() {
        const sensorName = document.getElementById('modal-sensor-name').textContent;
        const pollingInterval = parseInt(document.getElementById('modal-input-polling').value);
        const priority = parseInt(document.getElementById('modal-input-priority').value);
        const enabled = document.getElementById('modal-input-enabled').checked;
        
        const updates = {
            polling_interval: pollingInterval,
            priority: priority,
            enabled: enabled
        };
        
        fetch(`${baseUrl}/api/config/parameter/${sensorName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Sensor-Konfiguration erfolgreich gespeichert');
                    document.getElementById('sensor-details-modal').classList.add('hidden');
                    loadSensorsData(); // Reload sensors data
                } else {
                    alert(`Fehler beim Speichern der Sensor-Konfiguration: ${data.error}`);
                }
            })
            .catch(error => {
                console.error("Error saving sensor config:", error);
                alert('Fehler beim Speichern der Sensor-Konfiguration');
            });
    }

    // Load MQTT data
    function loadMQTTData() {
        console.log("Loading MQTT data...");
        
        // Load MQTT stats
        fetch(`${baseUrl}/api/mqtt/stats`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateMQTTStatsDisplay(data.data);
                }
            })
            .catch(error => {
                console.error("Error loading MQTT data:", error);
            });
        
        // Load sensors for filter dropdown
        fetch(`${baseUrl}/api/sensors/status`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateMQTTSensorFilter(data.data);
                }
            })
            .catch(error => {
                console.error("Error loading sensors for MQTT filter:", error);
            });
    }

    // Update MQTT stats display
    function updateMQTTStatsDisplay(mqttData) {
        // Update message stats
        document.getElementById('mqtt-stats-total').textContent = mqttData.message_stats?.total_messages || 0;
        document.getElementById('mqtt-stats-hour').textContent = mqttData.message_stats?.messages_last_hour || 0;
        document.getElementById('mqtt-stats-pending').textContent = mqttData.message_stats?.pending_commands || 0;
        
        // Update conversion stats
        document.getElementById('mqtt-stats-conv-success').textContent = mqttData.conversion_stats?.successful_conversions || 0;
        document.getElementById('mqtt-stats-conv-failed').textContent = mqttData.conversion_stats?.failed_conversions || 0;
        document.getElementById('mqtt-stats-conv-rate').textContent = `${(mqttData.conversion_stats?.conversion_success_rate || 0).toFixed(1)}%`;
        
        // Update flow stats
        document.getElementById('mqtt-stats-flow-total').textContent = mqttData.flow_stats?.total_flows || 0;
        document.getElementById('mqtt-stats-flow-success').textContent = mqttData.flow_stats?.successful_flows || 0;
        document.getElementById('mqtt-stats-flow-rate').textContent = `${(mqttData.flow_stats?.success_rate || 0).toFixed(1)}%`;
        document.getElementById('mqtt-stats-flow-time').textContent = `${(mqttData.flow_stats?.avg_response_time_ms || 0).toFixed(2)} ms`;
        
        // Update recent errors
        updateMQTTRecentErrors(mqttData.recent_errors || []);
    }

    // Update MQTT recent errors display
    function updateMQTTRecentErrors(errors) {
        const errorsElement = document.getElementById('mqtt-recent-errors');
        if (!errorsElement) return;
        
        // Clear existing errors
        errorsElement.innerHTML = '';
        
        // Add each error
        for (const error of errors) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'bg-red-50 border border-red-200 rounded-md p-4';
            
            const errorHeader = document.createElement('div');
            errorHeader.className = 'flex justify-between';
            
            const errorType = document.createElement('span');
            errorType.className = 'font-semibold text-red-800';
            errorType.textContent = error.type;
            errorHeader.appendChild(errorType);
            
            const errorTime = document.createElement('span');
            errorTime.className = 'text-sm text-gray-500';
            const timestamp = new Date(error.timestamp);
            errorTime.textContent = timestamp.toLocaleString();
            errorHeader.appendChild(errorTime);
            
            errorDiv.appendChild(errorHeader);
            
            const errorMessage = document.createElement('p');
            errorMessage.className = 'mt-2 text-sm text-gray-700';
            errorMessage.textContent = error.message;
            errorDiv.appendChild(errorMessage);
            
            const errorDetails = document.createElement('p');
            errorDetails.className = 'mt-1 text-xs text-gray-500';
            errorDetails.textContent = `Sensor: ${error.sensor}, Details: ${error.details}`;
            errorDiv.appendChild(errorDetails);
            
            errorsElement.appendChild(errorDiv);
        }
        
        // If no errors, add a message
        if (errors.length === 0) {
            const noErrorsDiv = document.createElement('div');
            noErrorsDiv.className = 'bg-green-50 border border-green-200 rounded-md p-4 text-center';
            noErrorsDiv.textContent = 'Keine aktuellen Fehler';
            errorsElement.appendChild(noErrorsDiv);
        }
    }

    // Update MQTT sensor filter dropdown
    function updateMQTTSensorFilter(sensorData) {
        const filterElement = document.getElementById('mqtt-sensor-filter');
        if (!filterElement) return;
        
        // Save current selection
        const currentSelection = filterElement.value;
        
        // Clear existing options (except empty option)
        while (filterElement.options.length > 1) {
            filterElement.remove(1);
        }
        
        // Get all sensors from all groups
        let allSensors = [];
        for (const groupName in sensorData.groups) {
            const group = sensorData.groups[groupName];
            if (group.sensors) {
                for (const sensor of group.sensors) {
                    allSensors.push(sensor);
                }
            }
        }
        
        // Sort by name
        allSensors.sort((a, b) => a.name.localeCompare(b.name));
        
        // Add option for each sensor
        for (const sensor of allSensors) {
            const option = document.createElement('option');
            option.value = sensor.name;
            option.textContent = sensor.name;
            filterElement.appendChild(option);
        }
        
        // Restore selection if it still exists
        if (currentSelection && Array.from(filterElement.options).some(opt => opt.value === currentSelection)) {
            filterElement.value = currentSelection;
        }
    }

    // Load MQTT history for a specific sensor
    function loadMQTTHistory() {
        const sensorName = document.getElementById('mqtt-sensor-filter').value;
        if (!sensorName) {
            alert('Bitte wählen Sie einen Sensor aus');
            return;
        }
        
        fetch(`${baseUrl}/api/mqtt/history/${sensorName}?hours=24`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateMQTTHistoryTable(data.data);
                } else {
                    alert(`Fehler beim Laden der MQTT-Historie: ${data.error}`);
                }
            })
            .catch(error => {
                console.error("Error loading MQTT history:", error);
                alert('Fehler beim Laden der MQTT-Historie');
            });
    }

    // Update MQTT history table
    function updateMQTTHistoryTable(historyData) {
        const tableElement = document.getElementById('mqtt-history-table');
        if (!tableElement) return;
        
        // Clear existing rows
        tableElement.innerHTML = '';
        
        // Check if there's any history
        if (!historyData.communication_flows || historyData.communication_flows.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 7;
            cell.className = 'px-6 py-4 text-center text-gray-500';
            cell.textContent = 'Keine MQTT-Historie verfügbar';
            row.appendChild(cell);
            tableElement.appendChild(row);
            return;
        }
        
        // Add rows for each flow
        for (const flow of historyData.communication_flows) {
            const row = document.createElement('tr');
            
            // Timestamp
            const timestampCell = document.createElement('td');
            timestampCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
            const timestamp = new Date(flow.timestamp);
            timestampCell.textContent = timestamp.toLocaleString();
            row.appendChild(timestampCell);
            
            // Type
            const typeCell = document.createElement('td');
            typeCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
            typeCell.textContent = flow.initiated_by === 'home_assistant' ? 'SET' : 'STATE';
            row.appendChild(typeCell);
            
            // Initiated by
            const initiatedCell = document.createElement('td');
            initiatedCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
            initiatedCell.textContent = flow.initiated_by === 'home_assistant' ? 'Home Assistant' : 'EHS-Sentinel';
            row.appendChild(initiatedCell);
            
            // SET value
            const setValueCell = document.createElement('td');
            setValueCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
            setValueCell.textContent = flow.set_value !== null ? flow.set_value : '-';
            row.appendChild(setValueCell);
            
            // STATE value
            const stateValueCell = document.createElement('td');
            stateValueCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
            stateValueCell.textContent = flow.state_value !== null ? flow.state_value : '-';
            row.appendChild(stateValueCell);
            
            // Response time
            const responseTimeCell = document.createElement('td');
            responseTimeCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
            responseTimeCell.textContent = flow.response_time_ms ? `${flow.response_time_ms.toFixed(2)} ms` : '-';
            row.appendChild(responseTimeCell);
            
            // Status
            const statusCell = document.createElement('td');
            statusCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
            
            if (flow.success) {
                statusCell.innerHTML = '<span class="text-green-600">✓</span>';
            } else if (flow.error_message) {
                statusCell.innerHTML = `<span class="text-red-600">✗</span> <span class="text-xs">${flow.error_message}</span>`;
            } else {
                statusCell.textContent = '-';
            }
            
            row.appendChild(statusCell);
            
            tableElement.appendChild(row);
        }
    }

    // Load logs data
    function loadLogsData() {
        console.log("Loading logs data...");
        
        // Load log stats
        fetch(`${baseUrl}/api/logs/stats`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateLogStats(data.data);
                }
            })
            .catch(error => {
                console.error("Error loading log stats:", error);
            });
        
        // Load sensors for filter dropdown
        fetch(`${baseUrl}/api/sensors/status`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateLogSensorFilter(data.data);
                }
            })
            .catch(error => {
                console.error("Error loading sensors for log filter:", error);
            });
        
        // Load log entries
        loadLogEntries();
    }

    // Update log sensor filter dropdown
    function updateLogSensorFilter(sensorData) {
        const filterElement = document.getElementById('log-filter-sensor');
        if (!filterElement) return;
        
        // Save current selection
        const currentSelection = filterElement.value;
        
        // Clear existing options (except empty option)
        while (filterElement.options.length > 1) {
            filterElement.remove(1);
        }
        
        // Get all sensors from all groups
        let allSensors = [];
        for (const groupName in sensorData.groups) {
            const group = sensorData.groups[groupName];
            if (group.sensors) {
                for (const sensor of group.sensors) {
                    allSensors.push(sensor);
                }
            }
        }
        
        // Sort by name
        allSensors.sort((a, b) => a.name.localeCompare(b.name));
        
        // Add option for each sensor
        for (const sensor of allSensors) {
            const option = document.createElement('option');
            option.value = sensor.name;
            option.textContent = sensor.name;
            filterElement.appendChild(option);
        }
        
        // Restore selection if it still exists
        if (currentSelection && Array.from(filterElement.options).some(opt => opt.value === currentSelection)) {
            filterElement.value = currentSelection;
        }
    }

    // Load log entries
    function loadLogEntries() {
        // Get filter values
        const level = document.getElementById('log-filter-level').value;
        const category = document.getElementById('log-filter-category').value;
        const sensor = document.getElementById('log-filter-sensor').value;
        const startTime = document.getElementById('log-filter-start').value;
        const endTime = document.getElementById('log-filter-end').value;
        const errorsOnly = document.getElementById('log-filter-errors').checked;
        
        // Build query string
        let queryParams = new URLSearchParams();
        if (level) queryParams.append('level', level);
        if (category) queryParams.append('category', category);
        if (sensor) queryParams.append('sensor_name', sensor);
        if (startTime) queryParams.append('start_time', startTime);
        if (endTime) queryParams.append('end_time', endTime);
        if (errorsOnly) queryParams.append('errors_only', 'true');
        queryParams.append('limit', '50');
        
        fetch(`${baseUrl}/api/logs?${queryParams.toString()}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateLogEntriesTable(data.data.logs);
                } else {
                    alert(`Fehler beim Laden der Logs: ${data.error}`);
                }
            })
            .catch(error => {
                console.error("Error loading logs:", error);
                alert('Fehler beim Laden der Logs');
            });
    }

    // Apply log filters
    function applyLogFilters() {
        loadLogEntries();
    }

    // Update log entries table
    function updateLogEntriesTable(logs) {
        const tableElement = document.getElementById('log-entries-table');
        if (!tableElement) return;
        
        // Clear existing rows
        tableElement.innerHTML = '';
        
        // Check if there are any logs
        if (!logs || logs.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 6;
            cell.className = 'px-6 py-4 text-center text-gray-500';
            cell.textContent = 'Keine Logs gefunden';
            row.appendChild(cell);
            tableElement.appendChild(row);
            return;
        }
        
        // Add rows for each log
        for (const log of logs) {
            const row = document.createElement('tr');
            
            // Timestamp
            const timestampCell = document.createElement('td');
            timestampCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
            const timestamp = new Date(log.timestamp);
            timestampCell.textContent = timestamp.toLocaleString();
            row.appendChild(timestampCell);
            
            // Level
            const levelCell = document.createElement('td');
            levelCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
            const levelSpan = document.createElement('span');
            
            if (log.level === 'ERROR' || log.level === 'CRITICAL') {
                levelSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800';
            } else if (log.level === 'WARNING') {
                levelSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800';
            } else if (log.level === 'INFO') {
                levelSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800';
            } else {
                levelSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800';
            }
            
            levelSpan.textContent = log.level;
            levelCell.appendChild(levelSpan);
            row.appendChild(levelCell);
            
            // Category
            const categoryCell = document.createElement('td');
            categoryCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
            categoryCell.textContent = log.category || '-';
            row.appendChild(categoryCell);
            
            // Sensor
            const sensorCell = document.createElement('td');
            sensorCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
            sensorCell.textContent = log.sensor_name || '-';
            row.appendChild(sensorCell);
            
            // Message
            const messageCell = document.createElement('td');
            messageCell.className = 'px-6 py-4 text-sm';
            messageCell.textContent = log.message || '-';
            row.appendChild(messageCell);
            
            // Details
            const detailsCell = document.createElement('td');
            detailsCell.className = 'px-6 py-4 text-sm';
            
            if (log.details && Object.keys(log.details).length > 0) {
                const detailsButton = document.createElement('button');
                detailsButton.className = 'text-indigo-600 hover:text-indigo-900';
                detailsButton.textContent = 'Details anzeigen';
                
                // Create details popup
                detailsButton.addEventListener('click', () => {
                    alert(JSON.stringify(log.details, null, 2));
                });
                
                detailsCell.appendChild(detailsButton);
            } else {
                detailsCell.textContent = '-';
            }
            
            row.appendChild(detailsCell);
            
            tableElement.appendChild(row);
        }
    }

    // Export logs
    function exportLogs() {
        // Get filter values
        const level = document.getElementById('log-filter-level').value;
        const category = document.getElementById('log-filter-category').value;
        const sensor = document.getElementById('log-filter-sensor').value;
        const startTime = document.getElementById('log-filter-start').value;
        const endTime = document.getElementById('log-filter-end').value;
        const errorsOnly = document.getElementById('log-filter-errors').checked;
        const format = 'json'; // Default to JSON
        
        // Build query string
        let queryParams = new URLSearchParams();
        if (level) queryParams.append('level', level);
        if (category) queryParams.append('category', category);
        if (sensor) queryParams.append('sensor_name', sensor);
        if (startTime) queryParams.append('start_time', startTime);
        if (endTime) queryParams.append('end_time', endTime);
        if (errorsOnly) queryParams.append('errors_only', 'true');
        queryParams.append('format', format);
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = `${baseUrl}/api/logs/export?${queryParams.toString()}`;
        downloadLink.download = `ehs_logs_${new Date().toISOString().replace(/:/g, '-')}.json`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }

    // Load configuration data
    function loadConfigData() {
        console.log("Loading configuration data...");
        
        fetch(`${baseUrl}/api/config/ui`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateConfigurationDisplay(data.data);
                }
            })
            .catch(error => {
                console.error("Error loading configuration:", error);
            });
    }

    // Update configuration display
    function updateConfigurationDisplay(configData) {
        // Update group configuration table
        updateGroupConfigTable(configData.groups || {});
        
        // Update parameter configuration table
        updateParameterConfigTable(configData.parameters || {});
        
        // Update group filter dropdown
        updateConfigGroupFilter(configData.groups || {});
    }

    // Update group configuration table
    function updateGroupConfigTable(groups) {
        const tableElement = document.getElementById('group-config-table');
        if (!tableElement) return;
        
        // Clear existing rows
        tableElement.innerHTML = '';
        
        // Convert to array and sort by name
        const groupArray = Object.entries(groups)
            .map(([name, config]) => ({ name, ...config }))
            .sort((a, b) => a.name.localeCompare(b.name));
        
        // Add rows for each group
        for (const group of groupArray) {
            const row = document.createElement('tr');
            
            // Group name
            const nameCell = document.createElement('td');
            nameCell.className = 'px-6 py-4 whitespace-nowrap';
            nameCell.textContent = group.name;
            row.appendChild(nameCell);
            
            // Description
            const descCell = document.createElement('td');
            descCell.className = 'px-6 py-4 whitespace-nowrap';
            descCell.textContent = group.description || '-';
            row.appendChild(descCell);
            
            // Priority
            const priorityCell = document.createElement('td');
            priorityCell.className = 'px-6 py-4 whitespace-nowrap';
            priorityCell.textContent = group.priority || '-';
            row.appendChild(priorityCell);
            
            // Polling interval
            const pollingCell = document.createElement('td');
            pollingCell.className = 'px-6 py-4 whitespace-nowrap';
            pollingCell.textContent = group.default_polling_interval ? `${group.default_polling_interval} s` : '-';
            row.appendChild(pollingCell);
            
            // Sensor count
            const sensorCountCell = document.createElement('td');
            sensorCountCell.className = 'px-6 py-4 whitespace-nowrap';
            sensorCountCell.textContent = group.parameter_count || 0;
            row.appendChild(sensorCountCell);
            
            // Status
            const statusCell = document.createElement('td');
            statusCell.className = 'px-6 py-4 whitespace-nowrap';
            const statusSpan = document.createElement('span');
            
            if (group.enabled) {
                statusSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800';
                statusSpan.textContent = 'Aktiviert';
            } else {
                statusSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800';
                statusSpan.textContent = 'Deaktiviert';
            }
            
            statusCell.appendChild(statusSpan);
            row.appendChild(statusCell);
            
            // Actions
            const actionsCell = document.createElement('td');
            actionsCell.className = 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium';
            
            const editButton = document.createElement('button');
            editButton.className = 'text-indigo-600 hover:text-indigo-900';
            editButton.textContent = 'Bearbeiten';
            editButton.addEventListener('click', () => {
                showGroupEditModal(group);
            });
            
            actionsCell.appendChild(editButton);
            row.appendChild(actionsCell);
            
            tableElement.appendChild(row);
        }
        
        // If no groups, add a message
        if (groupArray.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 7;
            cell.className = 'px-6 py-4 text-center text-gray-500';
            cell.textContent = 'Keine Gruppen gefunden';
            row.appendChild(cell);
            tableElement.appendChild(row);
        }
    }

    // Update parameter configuration table
    function updateParameterConfigTable(parameters) {
        const tableElement = document.getElementById('parameter-config-table');
        if (!tableElement) return;
        
        // Clear existing rows
        tableElement.innerHTML = '';
        
        // Get group filter
        const groupFilter = document.getElementById('config-group-filter').value;
        
        // Convert to array and sort by name
        let paramArray = Object.entries(parameters)
            .map(([name, config]) => ({ name, ...config }))
            .sort((a, b) => a.name.localeCompare(b.name));
        
        // Apply group filter
        if (groupFilter !== 'all') {
            paramArray = paramArray.filter(param => param.group === groupFilter);
        }
        
        // Add rows for each parameter
        for (const param of paramArray) {
            const row = document.createElement('tr');
            
            // Parameter name
            const nameCell = document.createElement('td');
            nameCell.className = 'px-6 py-4 whitespace-nowrap';
            nameCell.textContent = param.name;
            row.appendChild(nameCell);
            
            // Description
            const descCell = document.createElement('td');
            descCell.className = 'px-6 py-4 whitespace-nowrap';
            descCell.textContent = param.display_name || '-';
            row.appendChild(descCell);
            
            // Type
            const typeCell = document.createElement('td');
            typeCell.className = 'px-6 py-4 whitespace-nowrap';
            typeCell.textContent = param.type || '-';
            row.appendChild(typeCell);
            
            // Group
            const groupCell = document.createElement('td');
            groupCell.className = 'px-6 py-4 whitespace-nowrap';
            groupCell.textContent = param.group || '-';
            row.appendChild(groupCell);
            
            // Polling interval
            const pollingCell = document.createElement('td');
            pollingCell.className = 'px-6 py-4 whitespace-nowrap';
            pollingCell.textContent = param.polling_interval ? `${param.polling_interval} s` : '-';
            row.appendChild(pollingCell);
            
            // Priority
            const priorityCell = document.createElement('td');
            priorityCell.className = 'px-6 py-4 whitespace-nowrap';
            priorityCell.textContent = param.priority || '-';
            row.appendChild(priorityCell);
            
            // Enabled
            const enabledCell = document.createElement('td');
            enabledCell.className = 'px-6 py-4 whitespace-nowrap';
            const enabledSpan = document.createElement('span');
            
            if (param.enabled) {
                enabledSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800';
                enabledSpan.textContent = 'Ja';
            } else {
                enabledSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800';
                enabledSpan.textContent = 'Nein';
            }
            
            enabledCell.appendChild(enabledSpan);
            row.appendChild(enabledCell);
            
            // Actions
            const actionsCell = document.createElement('td');
            actionsCell.className = 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium';
            
            const editButton = document.createElement('button');
            editButton.className = 'text-indigo-600 hover:text-indigo-900';
            editButton.textContent = 'Bearbeiten';
            editButton.addEventListener('click', () => {
                showSensorDetails(param);
            });
            
            actionsCell.appendChild(editButton);
            row.appendChild(actionsCell);
            
            tableElement.appendChild(row);
        }
        
        // If no parameters, add a message
        if (paramArray.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 8;
            cell.className = 'px-6 py-4 text-center text-gray-500';
            cell.textContent = 'Keine Parameter gefunden';
            row.appendChild(cell);
            tableElement.appendChild(row);
        }
    }

    // Update config group filter dropdown
    function updateConfigGroupFilter(groups) {
        const filterElement = document.getElementById('config-group-filter');
        if (!filterElement) return;
        
        // Save current selection
        const currentSelection = filterElement.value;
        
        // Clear existing options (except 'all')
        while (filterElement.options.length > 1) {
            filterElement.remove(1);
        }
        
        // Add option for each group
        const groupNames = Object.keys(groups).sort();
        for (const groupName of groupNames) {
            const option = document.createElement('option');
            option.value = groupName;
            option.textContent = groupName;
            filterElement.appendChild(option);
        }
        
        // Restore selection if it still exists
        if (currentSelection && Array.from(filterElement.options).some(opt => opt.value === currentSelection)) {
            filterElement.value = currentSelection;
        }
        
        // Add change handler
        filterElement.addEventListener('change', () => {
            updateParameterConfigTable(configData.parameters || {});
        });
    }

    // Show group edit modal
    function showGroupEditModal(group) {
        // Set modal title
        document.getElementById('group-modal-name').textContent = group.name;
        
        // Set form values
        document.getElementById('group-modal-polling').value = group.default_polling_interval || 60;
        document.getElementById('group-modal-enabled').checked = group.enabled !== false;
        
        // Show modal
        document.getElementById('group-edit-modal').classList.remove('hidden');
    }

    // Save group configuration
    function saveGroupConfig() {
        const groupName = document.getElementById('group-modal-name').textContent;
        const pollingInterval = parseInt(document.getElementById('group-modal-polling').value);
        const enabled = document.getElementById('group-modal-enabled').checked;
        
        const updates = {
            default_polling_interval: pollingInterval,
            enabled: enabled
        };
        
        fetch(`${baseUrl}/api/config/group/${groupName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Gruppen-Konfiguration erfolgreich gespeichert');
                    document.getElementById('group-edit-modal').classList.add('hidden');
                    loadConfigData(); // Reload configuration data
                } else {
                    alert(`Fehler beim Speichern der Gruppen-Konfiguration: ${data.error}`);
                }
            })
            .catch(error => {
                console.error("Error saving group config:", error);
                alert('Fehler beim Speichern der Gruppen-Konfiguration');
            });
    }

    // Load documentation
    function loadDocumentation() {
        console.log("Loading documentation...");
        
        // Load MQTT documentation by default
        loadSpecificDocumentation('mqtt');
    }

    // Load specific documentation
    function loadSpecificDocumentation(docType) {
        fetch(`${baseUrl}/api/documentation/${docType}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateDocumentationContent(docType, data.data.content);
                } else {
                    console.error(`Error loading ${docType} documentation:`, data.error);
                }
            })
            .catch(error => {
                console.error(`Error loading ${docType} documentation:`, error);
            });
    }

    // Update documentation content
    function updateDocumentationContent(docType, content) {
        const contentElement = document.getElementById(`${docType}-doc-content`);
        if (!contentElement) return;
        
        // Use marked.js to render markdown
        if (window.marked) {
            contentElement.innerHTML = marked.parse(content);
        } else {
            // Fallback to simple formatting
            contentElement.innerHTML = content
                .replace(/\n\n/g, '<br><br>')
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/#{3} (.*?)$/gm, '<h3>$1</h3>')
                .replace(/#{2} (.*?)$/gm, '<h2>$1</h2>')
                .replace(/#{1} (.*?)$/gm, '<h1>$1</h1>');
        }
    }

    // Generate documentation
    function generateDocumentation() {
        fetch(`${baseUrl}/api/documentation/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                output_dir: '/data/documentation'
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Dokumentation erfolgreich generiert');
                    // Reload current documentation
                    const activeDocTab = document.querySelector('#view-docs .tab-active').id;
                    const docType = activeDocTab.replace('doc-tab-', '');
                    loadSpecificDocumentation(docType);
                } else {
                    alert(`Fehler beim Generieren der Dokumentation: ${data.error}`);
                }
            })
            .catch(error => {
                console.error("Error generating documentation:", error);
                alert('Fehler beim Generieren der Dokumentation');
            });
    }
});