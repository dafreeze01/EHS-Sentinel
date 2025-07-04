// EHS-Sentinel Addon UI JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the UI
    initUI();
    
    // Set up tab navigation
    setupTabs();
    
    // Load initial data
    loadDashboardData();
});

// Initialize the UI components
function initUI() {
    console.log('Initializing EHS-Sentinel UI...');
    
    // Set up event listeners for buttons
    document.getElementById('refresh-sensors')?.addEventListener('click', function() {
        loadSensorsData();
    });
    
    document.getElementById('refresh-mqtt')?.addEventListener('click', function() {
        loadMQTTData();
    });
    
    document.getElementById('refresh-logs')?.addEventListener('click', function() {
        loadLogsData();
    });
    
    document.getElementById('refresh-config')?.addEventListener('click', function() {
        loadConfigData();
    });
    
    document.getElementById('export-logs')?.addEventListener('click', function() {
        exportLogs();
    });
    
    document.getElementById('generate-docs')?.addEventListener('click', function() {
        generateDocumentation();
    });
    
    // Set up modal close buttons
    document.getElementById('close-modal')?.addEventListener('click', function() {
        document.getElementById('sensor-details-modal').classList.add('hidden');
    });
    
    document.getElementById('close-group-modal')?.addEventListener('click', function() {
        document.getElementById('group-edit-modal').classList.add('hidden');
    });
    
    // Set up filter change handlers
    document.getElementById('group-filter')?.addEventListener('change', function() {
        filterSensors();
    });
    
    document.getElementById('status-filter')?.addEventListener('change', function() {
        filterSensors();
    });
    
    document.getElementById('config-group-filter')?.addEventListener('change', function() {
        filterConfigParameters();
    });
    
    // Set up documentation tabs
    setupDocTabs();
}

// Set up tab navigation
function setupTabs() {
    const tabButtons = document.querySelectorAll('[id^="tab-"]');
    const tabContents = document.querySelectorAll('[id^="view-"]');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.id.replace('tab-', '');
            
            // Hide all tab contents
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });
            
            // Show selected tab content
            document.getElementById(`view-${tabId}`).classList.remove('hidden');
            
            // Update tab button styles
            tabButtons.forEach(btn => {
                btn.classList.remove('tab-active');
                btn.classList.add('tab-inactive');
            });
            
            this.classList.remove('tab-inactive');
            this.classList.add('tab-active');
            
            // Load data for the selected tab
            if (tabId === 'dashboard') {
                loadDashboardData();
            } else if (tabId === 'sensors') {
                loadSensorsData();
            } else if (tabId === 'mqtt') {
                loadMQTTData();
            } else if (tabId === 'logs') {
                loadLogsData();
            } else if (tabId === 'config') {
                loadConfigData();
            } else if (tabId === 'docs') {
                loadDocumentation();
            }
        });
    });
}

// Set up documentation tabs
function setupDocTabs() {
    const docTabButtons = document.querySelectorAll('[id^="doc-tab-"]');
    const docContents = document.querySelectorAll('[id^="doc-view-"]');
    
    docTabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.id.replace('doc-tab-', '');
            
            // Hide all doc contents
            docContents.forEach(content => {
                content.classList.add('hidden');
            });
            
            // Show selected doc content
            document.getElementById(`doc-view-${tabId}`).classList.remove('hidden');
            
            // Update tab button styles
            docTabButtons.forEach(btn => {
                btn.classList.remove('tab-active');
                btn.classList.add('tab-inactive');
            });
            
            this.classList.remove('tab-inactive');
            this.classList.add('tab-active');
            
            // Load documentation for the selected tab
            loadSpecificDocumentation(tabId);
        });
    });
}

// Load dashboard data
function loadDashboardData() {
    console.log('Loading dashboard data...');
    
    // Load system health
    fetch('/api/health')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateSystemHealth(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading health data:', error);
        });
    
    // Load sensor statistics
    fetch('/api/sensors/status')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateSensorStats(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading sensor stats:', error);
        });
    
    // Load MQTT statistics
    fetch('/api/mqtt/stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateMQTTStats(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading MQTT stats:', error);
        });
    
    // Load log statistics
    fetch('/api/logs/stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateLogStats(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading log stats:', error);
        });
}

// Update system health display
function updateSystemHealth(healthData) {
    const statusElement = document.getElementById('system-health');
    const lastUpdateElement = document.getElementById('last-update');
    
    if (statusElement) {
        const status = healthData.overall_status;
        statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        
        if (status === 'healthy') {
            statusElement.classList.add('bg-green-100', 'text-green-800');
        } else if (status === 'degraded') {
            statusElement.classList.add('bg-yellow-100', 'text-yellow-800');
        } else {
            statusElement.classList.add('bg-red-100', 'text-red-800');
        }
    }
    
    if (lastUpdateElement) {
        const now = new Date();
        lastUpdateElement.textContent = `Last updated: ${now.toLocaleTimeString()}`;
    }
    
    // Update component statuses
    document.getElementById('overall-health').textContent = `${healthData.overall_status.toUpperCase()}`;
}

// Update sensor statistics display
function updateSensorStats(sensorData) {
    document.getElementById('active-sensors').textContent = sensorData.active_sensors;
    document.getElementById('error-sensors').textContent = sensorData.error_sensors;
    document.getElementById('unknown-sensors').textContent = sensorData.unknown_sensors;
    
    // Update critical sensors table
    const criticalSensorsTable = document.getElementById('critical-sensors-table');
    if (criticalSensorsTable) {
        criticalSensorsTable.innerHTML = '';
        
        // Get critical sensors (priority 1-2)
        const criticalSensors = [];
        for (const groupName in sensorData.groups) {
            const group = sensorData.groups[groupName];
            for (const sensor of group.sensors) {
                if (sensor.priority <= 2) {
                    criticalSensors.push(sensor);
                }
            }
        }
        
        // Sort by status (errors first)
        criticalSensors.sort((a, b) => {
            if (a.status === 'error' && b.status !== 'error') return -1;
            if (a.status !== 'error' && b.status === 'error') return 1;
            return 0;
        });
        
        // Add rows for each critical sensor
        for (const sensor of criticalSensors.slice(0, 10)) {
            const row = document.createElement('tr');
            
            // Sensor name
            const nameCell = document.createElement('td');
            nameCell.className = 'px-6 py-4 whitespace-nowrap';
            nameCell.textContent = sensor.name;
            row.appendChild(nameCell);
            
            // Status
            const statusCell = document.createElement('td');
            statusCell.className = 'px-6 py-4 whitespace-nowrap';
            const statusBadge = document.createElement('span');
            statusBadge.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full status-${sensor.status}`;
            statusBadge.textContent = sensor.status.toUpperCase();
            statusCell.appendChild(statusBadge);
            row.appendChild(statusCell);
            
            // Last value
            const valueCell = document.createElement('td');
            valueCell.className = 'px-6 py-4 whitespace-nowrap';
            valueCell.textContent = sensor.last_reading ? sensor.last_reading.value : 'N/A';
            row.appendChild(valueCell);
            
            // Timestamp
            const timeCell = document.createElement('td');
            timeCell.className = 'px-6 py-4 whitespace-nowrap';
            timeCell.textContent = sensor.last_reading ? new Date(sensor.last_reading.timestamp).toLocaleTimeString() : 'N/A';
            row.appendChild(timeCell);
            
            // Response time
            const responseCell = document.createElement('td');
            responseCell.className = 'px-6 py-4 whitespace-nowrap';
            responseCell.textContent = sensor.last_reading && sensor.last_reading.response_time_ms ? 
                `${sensor.last_reading.response_time_ms.toFixed(2)} ms` : 'N/A';
            row.appendChild(responseCell);
            
            criticalSensorsTable.appendChild(row);
        }
    }
}

// Update MQTT statistics display
function updateMQTTStats(mqttData) {
    document.getElementById('mqtt-total-messages').textContent = mqttData.message_stats.total_messages;
    document.getElementById('mqtt-recent-messages').textContent = mqttData.message_stats.messages_last_hour;
    document.getElementById('mqtt-success-rate').textContent = `${mqttData.flow_stats.success_rate}%`;
    document.getElementById('mqtt-response-time').textContent = `${mqttData.flow_stats.avg_response_time_ms} ms`;
    
    // Update recent errors
    const recentErrorsContainer = document.getElementById('recent-errors');
    if (recentErrorsContainer) {
        recentErrorsContainer.innerHTML = '';
        
        if (mqttData.recent_errors.length === 0) {
            const noErrorsMsg = document.createElement('div');
            noErrorsMsg.className = 'text-green-600 font-semibold';
            noErrorsMsg.textContent = 'No recent errors! 👍';
            recentErrorsContainer.appendChild(noErrorsMsg);
        } else {
            for (const error of mqttData.recent_errors) {
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
                errorTime.textContent = new Date(error.timestamp).toLocaleTimeString();
                errorHeader.appendChild(errorTime);
                
                errorDiv.appendChild(errorHeader);
                
                const errorMessage = document.createElement('p');
                errorMessage.className = 'mt-2 text-sm text-red-700';
                errorMessage.textContent = error.message;
                errorDiv.appendChild(errorMessage);
                
                if (error.sensor) {
                    const errorSensor = document.createElement('p');
                    errorSensor.className = 'mt-1 text-xs text-gray-600';
                    errorSensor.textContent = `Sensor: ${error.sensor}`;
                    errorDiv.appendChild(errorSensor);
                }
                
                recentErrorsContainer.appendChild(errorDiv);
            }
        }
    }
}

// Update log statistics display
function updateLogStats(logData) {
    document.getElementById('log-total-entries').textContent = logData.total_entries;
    document.getElementById('log-error-count').textContent = logData.level_breakdown.ERROR || 0;
    document.getElementById('log-error-rate').textContent = `${logData.error_rate}%`;
    document.getElementById('log-avg-duration').textContent = `${logData.performance.avg_duration_ms} ms`;
    
    // Update level breakdown
    const levelStatsContainer = document.getElementById('log-stats-level');
    if (levelStatsContainer) {
        levelStatsContainer.innerHTML = '';
        
        for (const [level, count] of Object.entries(logData.level_breakdown)) {
            const levelDiv = document.createElement('div');
            levelDiv.className = 'flex justify-between';
            
            const levelName = document.createElement('span');
            levelName.textContent = level;
            levelDiv.appendChild(levelName);
            
            const levelCount = document.createElement('span');
            levelCount.className = 'font-semibold';
            levelCount.textContent = count;
            levelDiv.appendChild(levelCount);
            
            levelStatsContainer.appendChild(levelDiv);
        }
    }
    
    // Update category breakdown
    const categoryStatsContainer = document.getElementById('log-stats-category');
    if (categoryStatsContainer) {
        categoryStatsContainer.innerHTML = '';
        
        for (const [category, count] of Object.entries(logData.category_breakdown)) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'flex justify-between';
            
            const categoryName = document.createElement('span');
            categoryName.textContent = category.replace(/_/g, ' ');
            categoryDiv.appendChild(categoryName);
            
            const categoryCount = document.createElement('span');
            categoryCount.className = 'font-semibold';
            categoryCount.textContent = count;
            categoryDiv.appendChild(categoryCount);
            
            categoryStatsContainer.appendChild(categoryDiv);
        }
    }
    
    // Update sensor breakdown
    const sensorStatsContainer = document.getElementById('log-stats-sensors');
    if (sensorStatsContainer) {
        sensorStatsContainer.innerHTML = '';
        
        // Sort sensors by error count
        const sortedSensors = Object.entries(logData.sensor_breakdown)
            .sort((a, b) => b[1].errors - a[1].errors)
            .slice(0, 5);
        
        for (const [sensor, stats] of sortedSensors) {
            if (stats.errors > 0) {
                const sensorDiv = document.createElement('div');
                sensorDiv.className = 'flex justify-between';
                
                const sensorName = document.createElement('span');
                sensorName.textContent = sensor;
                sensorDiv.appendChild(sensorName);
                
                const sensorErrors = document.createElement('span');
                sensorErrors.className = 'font-semibold text-red-600';
                sensorErrors.textContent = `${stats.errors} errors`;
                sensorDiv.appendChild(sensorErrors);
                
                sensorStatsContainer.appendChild(sensorDiv);
            }
        }
        
        if (sensorStatsContainer.children.length === 0) {
            const noErrorsMsg = document.createElement('div');
            noErrorsMsg.className = 'text-green-600 font-semibold';
            noErrorsMsg.textContent = 'No sensor errors! 👍';
            sensorStatsContainer.appendChild(noErrorsMsg);
        }
    }
}

// Load sensors data
function loadSensorsData() {
    console.log('Loading sensors data...');
    
    fetch('/api/sensors/status')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateSensorsTable(data.data);
                populateGroupFilter(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading sensors data:', error);
        });
}

// Populate sensors table
function populateSensorsTable(sensorData) {
    const sensorsTable = document.getElementById('sensors-table');
    if (!sensorsTable) return;
    
    sensorsTable.innerHTML = '';
    
    // Flatten sensors from all groups
    const allSensors = [];
    for (const groupName in sensorData.groups) {
        const group = sensorData.groups[groupName];
        for (const sensor of group.sensors) {
            sensor.group = groupName;
            allSensors.push(sensor);
        }
    }
    
    // Sort by priority and status
    allSensors.sort((a, b) => {
        if (a.priority !== b.priority) {
            return a.priority - b.priority;
        }
        
        if (a.status === 'error' && b.status !== 'error') return -1;
        if (a.status !== 'error' && b.status === 'error') return 1;
        
        return a.name.localeCompare(b.name);
    });
    
    // Apply filters
    const groupFilter = document.getElementById('group-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    
    const filteredSensors = allSensors.filter(sensor => {
        if (groupFilter !== 'all' && sensor.group !== groupFilter) {
            return false;
        }
        
        if (statusFilter !== 'all' && sensor.status !== statusFilter) {
            return false;
        }
        
        return true;
    });
    
    // Add rows for each sensor
    for (const sensor of filteredSensors) {
        const row = document.createElement('tr');
        row.className = `priority-${sensor.priority}`;
        
        // Sensor name
        const nameCell = document.createElement('td');
        nameCell.className = 'px-6 py-4 whitespace-nowrap';
        nameCell.textContent = sensor.name;
        row.appendChild(nameCell);
        
        // Description
        const descCell = document.createElement('td');
        descCell.className = 'px-6 py-4';
        descCell.textContent = sensor.description;
        row.appendChild(descCell);
        
        // Group
        const groupCell = document.createElement('td');
        groupCell.className = 'px-6 py-4 whitespace-nowrap';
        groupCell.textContent = sensor.group;
        row.appendChild(groupCell);
        
        // Status
        const statusCell = document.createElement('td');
        statusCell.className = 'px-6 py-4 whitespace-nowrap';
        const statusBadge = document.createElement('span');
        statusBadge.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full status-${sensor.status}`;
        statusBadge.textContent = sensor.status.toUpperCase();
        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);
        
        // Last value
        const valueCell = document.createElement('td');
        valueCell.className = 'px-6 py-4 whitespace-nowrap';
        valueCell.textContent = sensor.last_reading ? sensor.last_reading.value : 'N/A';
        row.appendChild(valueCell);
        
        // Timestamp
        const timeCell = document.createElement('td');
        timeCell.className = 'px-6 py-4 whitespace-nowrap';
        timeCell.textContent = sensor.last_reading ? new Date(sensor.last_reading.timestamp).toLocaleTimeString() : 'N/A';
        row.appendChild(timeCell);
        
        // Actions
        const actionsCell = document.createElement('td');
        actionsCell.className = 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium';
        
        const detailsButton = document.createElement('button');
        detailsButton.className = 'text-indigo-600 hover:text-indigo-900 mr-2';
        detailsButton.textContent = 'Details';
        detailsButton.addEventListener('click', function() {
            showSensorDetails(sensor);
        });
        actionsCell.appendChild(detailsButton);
        
        row.appendChild(actionsCell);
        
        sensorsTable.appendChild(row);
    }
}

// Populate group filter dropdown
function populateGroupFilter(sensorData) {
    const groupFilter = document.getElementById('group-filter');
    if (!groupFilter) return;
    
    // Save current selection
    const currentValue = groupFilter.value;
    
    // Clear options except "All groups"
    while (groupFilter.options.length > 1) {
        groupFilter.remove(1);
    }
    
    // Add options for each group
    const groups = Object.keys(sensorData.groups);
    for (const group of groups) {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        groupFilter.appendChild(option);
    }
    
    // Restore selection if possible
    if (groups.includes(currentValue)) {
        groupFilter.value = currentValue;
    }
}

// Filter sensors based on selected filters
function filterSensors() {
    loadSensorsData();
}

// Show sensor details in modal
function showSensorDetails(sensor) {
    // Set modal title
    document.getElementById('modal-sensor-name').textContent = sensor.name;
    
    // Set sensor info
    document.getElementById('modal-description').textContent = sensor.description;
    document.getElementById('modal-group').textContent = sensor.group;
    document.getElementById('modal-priority').textContent = sensor.priority;
    document.getElementById('modal-polling').textContent = `${sensor.polling_interval} seconds`;
    document.getElementById('modal-enabled').textContent = sensor.enabled ? 'Yes' : 'No';
    document.getElementById('modal-writable').textContent = sensor.writable ? 'Yes' : 'No';
    document.getElementById('modal-address').textContent = sensor.nasa_address || 'N/A';
    document.getElementById('modal-entity-id').textContent = sensor.hass_entity_id;
    
    // Set status info
    document.getElementById('modal-status').textContent = sensor.status.toUpperCase();
    document.getElementById('modal-last-value').textContent = sensor.last_reading ? sensor.last_reading.value : 'N/A';
    document.getElementById('modal-timestamp').textContent = sensor.last_reading ? new Date(sensor.last_reading.timestamp).toLocaleString() : 'N/A';
    document.getElementById('modal-response-time').textContent = sensor.last_reading && sensor.last_reading.response_time_ms ? 
        `${sensor.last_reading.response_time_ms.toFixed(2)} ms` : 'N/A';
    document.getElementById('modal-success-rate').textContent = `${sensor.statistics.success_rate}%`;
    document.getElementById('modal-error-count').textContent = sensor.statistics.error_count;
    
    // Set form values for editing
    document.getElementById('modal-input-polling').value = sensor.polling_interval;
    document.getElementById('modal-input-priority').value = sensor.priority;
    document.getElementById('modal-input-enabled').checked = sensor.enabled;
    
    // Load MQTT history
    loadSensorMQTTHistory(sensor.name);
    
    // Show modal
    document.getElementById('sensor-details-modal').classList.remove('hidden');
}

// Load MQTT history for a sensor
function loadSensorMQTTHistory(sensorName) {
    fetch(`/api/mqtt/history/${sensorName}?hours=24`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateMQTTHistory(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading MQTT history:', error);
        });
}

// Populate MQTT history in modal
function populateMQTTHistory(historyData) {
    const historyContainer = document.getElementById('modal-mqtt-history');
    if (!historyContainer) return;
    
    historyContainer.innerHTML = '';
    
    if (historyData.communication_flows.length === 0) {
        historyContainer.textContent = 'No MQTT communication in the last 24 hours.';
        return;
    }
    
    // Create table
    const table = document.createElement('table');
    table.className = 'min-w-full divide-y divide-gray-200';
    
    // Create header
    const thead = document.createElement('thead');
    thead.className = 'bg-gray-50';
    
    const headerRow = document.createElement('tr');
    
    const headers = ['Time', 'Type', 'Success', 'SET Value', 'STATE Value', 'Response Time'];
    for (const header of headers) {
        const th = document.createElement('th');
        th.className = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
        th.textContent = header;
        headerRow.appendChild(th);
    }
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create body
    const tbody = document.createElement('tbody');
    tbody.className = 'bg-white divide-y divide-gray-200';
    
    // Sort flows by timestamp (newest first)
    historyData.communication_flows.sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    // Add rows for each flow
    for (const flow of historyData.communication_flows.slice(0, 10)) {
        const row = document.createElement('tr');
        
        // Time
        const timeCell = document.createElement('td');
        timeCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        timeCell.textContent = new Date(flow.timestamp).toLocaleTimeString();
        row.appendChild(timeCell);
        
        // Type
        const typeCell = document.createElement('td');
        typeCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        typeCell.textContent = flow.initiated_by === 'home_assistant' ? 'SET → STATE' : 'STATE';
        row.appendChild(typeCell);
        
        // Success
        const successCell = document.createElement('td');
        successCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
        
        const successBadge = document.createElement('span');
        successBadge.className = flow.success ? 
            'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800' : 
            'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800';
        successBadge.textContent = flow.success ? 'Success' : 'Failed';
        successCell.appendChild(successBadge);
        
        row.appendChild(successCell);
        
        // SET Value
        const setValueCell = document.createElement('td');
        setValueCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        setValueCell.textContent = flow.set_value !== null ? flow.set_value : 'N/A';
        row.appendChild(setValueCell);
        
        // STATE Value
        const stateValueCell = document.createElement('td');
        stateValueCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        stateValueCell.textContent = flow.state_value !== null ? flow.state_value : 'N/A';
        row.appendChild(stateValueCell);
        
        // Response Time
        const responseTimeCell = document.createElement('td');
        responseTimeCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        responseTimeCell.textContent = flow.response_time_ms ? `${flow.response_time_ms.toFixed(2)} ms` : 'N/A';
        row.appendChild(responseTimeCell);
        
        tbody.appendChild(row);
    }
    
    table.appendChild(tbody);
    historyContainer.appendChild(table);
}

// Load MQTT data
function loadMQTTData() {
    console.log('Loading MQTT data...');
    
    fetch('/api/mqtt/stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateMQTTStatsDisplay(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading MQTT data:', error);
        });
    
    // Populate sensor filter dropdown
    fetch('/api/sensors/status')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateMQTTSensorFilter(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading sensors for MQTT filter:', error);
        });
}

// Update MQTT stats display
function updateMQTTStatsDisplay(mqttData) {
    // Update message statistics
    document.getElementById('mqtt-stats-total').textContent = mqttData.message_stats.total_messages;
    document.getElementById('mqtt-stats-hour').textContent = mqttData.message_stats.messages_last_hour;
    document.getElementById('mqtt-stats-pending').textContent = mqttData.message_stats.pending_commands;
    
    // Update conversion statistics
    document.getElementById('mqtt-stats-conv-success').textContent = mqttData.conversion_stats.successful_conversions;
    document.getElementById('mqtt-stats-conv-failed').textContent = mqttData.conversion_stats.failed_conversions;
    document.getElementById('mqtt-stats-conv-rate').textContent = `${mqttData.conversion_stats.conversion_success_rate}%`;
    
    // Update flow statistics
    document.getElementById('mqtt-stats-flow-total').textContent = mqttData.flow_stats.total_flows;
    document.getElementById('mqtt-stats-flow-success').textContent = mqttData.flow_stats.successful_flows;
    document.getElementById('mqtt-stats-flow-rate').textContent = `${mqttData.flow_stats.success_rate}%`;
    document.getElementById('mqtt-stats-flow-time').textContent = `${mqttData.flow_stats.avg_response_time_ms} ms`;
    
    // Update recent errors
    const errorsContainer = document.getElementById('mqtt-recent-errors');
    if (errorsContainer) {
        errorsContainer.innerHTML = '';
        
        if (mqttData.recent_errors.length === 0) {
            const noErrorsMsg = document.createElement('div');
            noErrorsMsg.className = 'text-green-600 font-semibold';
            noErrorsMsg.textContent = 'No recent errors! 👍';
            errorsContainer.appendChild(noErrorsMsg);
        } else {
            for (const error of mqttData.recent_errors) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'bg-red-50 border border-red-200 rounded-md p-4 mb-4';
                
                const errorHeader = document.createElement('div');
                errorHeader.className = 'flex justify-between';
                
                const errorType = document.createElement('span');
                errorType.className = 'font-semibold text-red-800';
                errorType.textContent = error.type;
                errorHeader.appendChild(errorType);
                
                const errorTime = document.createElement('span');
                errorTime.className = 'text-sm text-gray-500';
                errorTime.textContent = new Date(error.timestamp).toLocaleTimeString();
                errorHeader.appendChild(errorTime);
                
                errorDiv.appendChild(errorHeader);
                
                const errorMessage = document.createElement('p');
                errorMessage.className = 'mt-2 text-sm text-red-700';
                errorMessage.textContent = error.message;
                errorDiv.appendChild(errorMessage);
                
                if (error.sensor) {
                    const errorSensor = document.createElement('p');
                    errorSensor.className = 'mt-1 text-xs text-gray-600';
                    errorSensor.textContent = `Sensor: ${error.sensor}`;
                    errorDiv.appendChild(errorSensor);
                }
                
                if (error.details) {
                    const errorDetails = document.createElement('p');
                    errorDetails.className = 'mt-1 text-xs text-gray-600';
                    errorDetails.textContent = `Details: ${error.details}`;
                    errorDiv.appendChild(errorDetails);
                }
                
                errorsContainer.appendChild(errorDiv);
            }
        }
    }
}

// Populate MQTT sensor filter dropdown
function populateMQTTSensorFilter(sensorData) {
    const sensorFilter = document.getElementById('mqtt-sensor-filter');
    if (!sensorFilter) return;
    
    // Save current selection
    const currentValue = sensorFilter.value;
    
    // Clear options except first one
    while (sensorFilter.options.length > 1) {
        sensorFilter.remove(1);
    }
    
    // Collect all sensors
    const allSensors = [];
    for (const groupName in sensorData.groups) {
        const group = sensorData.groups[groupName];
        for (const sensor of group.sensors) {
            allSensors.push(sensor.name);
        }
    }
    
    // Sort alphabetically
    allSensors.sort();
    
    // Add options for each sensor
    for (const sensor of allSensors) {
        const option = document.createElement('option');
        option.value = sensor;
        option.textContent = sensor;
        sensorFilter.appendChild(option);
    }
    
    // Restore selection if possible
    if (allSensors.includes(currentValue)) {
        sensorFilter.value = currentValue;
    }
    
    // Set up event listener for loading history
    document.getElementById('mqtt-load-history').addEventListener('click', function() {
        const selectedSensor = sensorFilter.value;
        if (selectedSensor) {
            loadMQTTHistoryForSensor(selectedSensor);
        }
    });
}

// Load MQTT history for selected sensor
function loadMQTTHistoryForSensor(sensorName) {
    fetch(`/api/mqtt/history/${sensorName}?hours=24`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateMQTTHistoryTable(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading MQTT history:', error);
        });
}

// Populate MQTT history table
function populateMQTTHistoryTable(historyData) {
    const historyTable = document.getElementById('mqtt-history-table');
    if (!historyTable) return;
    
    historyTable.innerHTML = '';
    
    if (historyData.communication_flows.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 7;
        cell.className = 'px-6 py-4 text-center text-gray-500';
        cell.textContent = 'No communication history available for this sensor.';
        row.appendChild(cell);
        historyTable.appendChild(row);
        return;
    }
    
    // Sort flows by timestamp (newest first)
    historyData.communication_flows.sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    // Add rows for each flow
    for (const flow of historyData.communication_flows) {
        const row = document.createElement('tr');
        
        // Timestamp
        const timeCell = document.createElement('td');
        timeCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        timeCell.textContent = new Date(flow.timestamp).toLocaleString();
        row.appendChild(timeCell);
        
        // Type
        const typeCell = document.createElement('td');
        typeCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        typeCell.textContent = flow.initiated_by === 'home_assistant' ? 'SET → STATE' : 'STATE';
        row.appendChild(typeCell);
        
        // Initiated by
        const initiatedCell = document.createElement('td');
        initiatedCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        initiatedCell.textContent = flow.initiated_by === 'home_assistant' ? 'Home Assistant' : 'EHS-Sentinel';
        row.appendChild(initiatedCell);
        
        // SET Value
        const setValueCell = document.createElement('td');
        setValueCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        setValueCell.textContent = flow.set_value !== null ? flow.set_value : 'N/A';
        row.appendChild(setValueCell);
        
        // STATE Value
        const stateValueCell = document.createElement('td');
        stateValueCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        stateValueCell.textContent = flow.state_value !== null ? flow.state_value : 'N/A';
        row.appendChild(stateValueCell);
        
        // Response Time
        const responseTimeCell = document.createElement('td');
        responseTimeCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        responseTimeCell.textContent = flow.response_time_ms ? `${flow.response_time_ms.toFixed(2)} ms` : 'N/A';
        row.appendChild(responseTimeCell);
        
        // Status
        const statusCell = document.createElement('td');
        statusCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
        
        const statusBadge = document.createElement('span');
        statusBadge.className = flow.success ? 
            'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800' : 
            'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800';
        statusBadge.textContent = flow.success ? 'Success' : 'Failed';
        statusCell.appendChild(statusBadge);
        
        row.appendChild(statusCell);
        
        historyTable.appendChild(row);
    }
}

// Load logs data
function loadLogsData() {
    console.log('Loading logs data...');
    
    // Load log statistics
    fetch('/api/logs/stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateLogStatsDisplay(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading log stats:', error);
        });
    
    // Load log entries
    loadLogEntries();
    
    // Populate sensor filter dropdown
    fetch('/api/sensors/status')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateLogSensorFilter(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading sensors for log filter:', error);
        });
    
    // Set up apply filters button
    document.getElementById('apply-log-filters').addEventListener('click', function() {
        loadLogEntries();
    });
    
    // Set up load more button
    document.getElementById('load-more-logs').addEventListener('click', function() {
        loadMoreLogs();
    });
}

// Update log statistics display
function updateLogStatsDisplay(logData) {
    // Update level breakdown
    const levelStatsContainer = document.getElementById('log-stats-level');
    if (levelStatsContainer) {
        levelStatsContainer.innerHTML = '';
        
        for (const [level, count] of Object.entries(logData.level_breakdown)) {
            const levelDiv = document.createElement('div');
            levelDiv.className = 'flex justify-between';
            
            const levelName = document.createElement('span');
            levelName.textContent = level;
            levelDiv.appendChild(levelName);
            
            const levelCount = document.createElement('span');
            levelCount.className = 'font-semibold';
            levelCount.textContent = count;
            levelDiv.appendChild(levelCount);
            
            levelStatsContainer.appendChild(levelDiv);
        }
    }
    
    // Update category breakdown
    const categoryStatsContainer = document.getElementById('log-stats-category');
    if (categoryStatsContainer) {
        categoryStatsContainer.innerHTML = '';
        
        for (const [category, count] of Object.entries(logData.category_breakdown)) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'flex justify-between';
            
            const categoryName = document.createElement('span');
            categoryName.textContent = category.replace(/_/g, ' ');
            categoryDiv.appendChild(categoryName);
            
            const categoryCount = document.createElement('span');
            categoryCount.className = 'font-semibold';
            categoryCount.textContent = count;
            categoryDiv.appendChild(categoryCount);
            
            categoryStatsContainer.appendChild(categoryDiv);
        }
    }
    
    // Update sensor breakdown
    const sensorStatsContainer = document.getElementById('log-stats-sensors');
    if (sensorStatsContainer) {
        sensorStatsContainer.innerHTML = '';
        
        // Sort sensors by error count
        const sortedSensors = Object.entries(logData.sensor_breakdown)
            .sort((a, b) => b[1].errors - a[1].errors)
            .slice(0, 5);
        
        for (const [sensor, stats] of sortedSensors) {
            if (stats.errors > 0) {
                const sensorDiv = document.createElement('div');
                sensorDiv.className = 'flex justify-between';
                
                const sensorName = document.createElement('span');
                sensorName.textContent = sensor;
                sensorDiv.appendChild(sensorName);
                
                const sensorErrors = document.createElement('span');
                sensorErrors.className = 'font-semibold text-red-600';
                sensorErrors.textContent = `${stats.errors} errors`;
                sensorDiv.appendChild(sensorErrors);
                
                sensorStatsContainer.appendChild(sensorDiv);
            }
        }
        
        if (sensorStatsContainer.children.length === 0) {
            const noErrorsMsg = document.createElement('div');
            noErrorsMsg.className = 'text-green-600 font-semibold';
            noErrorsMsg.textContent = 'No sensor errors! 👍';
            sensorStatsContainer.appendChild(noErrorsMsg);
        }
    }
}

// Load log entries with filters
function loadLogEntries() {
    // Build query parameters from filters
    const params = new URLSearchParams();
    
    const levelFilter = document.getElementById('log-filter-level').value;
    if (levelFilter) {
        params.append('level', levelFilter);
    }
    
    const categoryFilter = document.getElementById('log-filter-category').value;
    if (categoryFilter) {
        params.append('category', categoryFilter);
    }
    
    const sensorFilter = document.getElementById('log-filter-sensor').value;
    if (sensorFilter) {
        params.append('sensor_name', sensorFilter);
    }
    
    const startFilter = document.getElementById('log-filter-start').value;
    if (startFilter) {
        params.append('start_time', new Date(startFilter).toISOString());
    }
    
    const endFilter = document.getElementById('log-filter-end').value;
    if (endFilter) {
        params.append('end_time', new Date(endFilter).toISOString());
    }
    
    const errorsOnly = document.getElementById('log-filter-errors').checked;
    if (errorsOnly) {
        params.append('errors_only', 'true');
    }
    
    // Set limit
    params.append('limit', '50');
    
    // Fetch logs with filters
    fetch(`/api/logs?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateLogEntriesTable(data.data.logs);
            }
        })
        .catch(error => {
            console.error('Error loading logs:', error);
        });
}

// Populate log entries table
function populateLogEntriesTable(logs) {
    const logsTable = document.getElementById('log-entries-table');
    if (!logsTable) return;
    
    logsTable.innerHTML = '';
    
    if (logs.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 6;
        cell.className = 'px-6 py-4 text-center text-gray-500';
        cell.textContent = 'No log entries match the current filters.';
        row.appendChild(cell);
        logsTable.appendChild(row);
        return;
    }
    
    // Add rows for each log entry
    for (const log of logs) {
        const row = document.createElement('tr');
        
        // Timestamp
        const timeCell = document.createElement('td');
        timeCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        timeCell.textContent = new Date(log.timestamp).toLocaleString();
        row.appendChild(timeCell);
        
        // Level
        const levelCell = document.createElement('td');
        levelCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
        
        const levelBadge = document.createElement('span');
        let badgeClass = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full ';
        
        switch (log.level) {
            case 'DEBUG':
                badgeClass += 'bg-gray-100 text-gray-800';
                break;
            case 'INFO':
                badgeClass += 'bg-blue-100 text-blue-800';
                break;
            case 'WARNING':
                badgeClass += 'bg-yellow-100 text-yellow-800';
                break;
            case 'ERROR':
                badgeClass += 'bg-red-100 text-red-800';
                break;
            case 'CRITICAL':
                badgeClass += 'bg-purple-100 text-purple-800';
                break;
            default:
                badgeClass += 'bg-gray-100 text-gray-800';
        }
        
        levelBadge.className = badgeClass;
        levelBadge.textContent = log.level;
        levelCell.appendChild(levelBadge);
        
        row.appendChild(levelCell);
        
        // Category
        const categoryCell = document.createElement('td');
        categoryCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        categoryCell.textContent = log.category.replace(/_/g, ' ');
        row.appendChild(categoryCell);
        
        // Sensor
        const sensorCell = document.createElement('td');
        sensorCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        sensorCell.textContent = log.sensor_name || 'N/A';
        row.appendChild(sensorCell);
        
        // Message
        const messageCell = document.createElement('td');
        messageCell.className = 'px-6 py-4 text-sm text-gray-500';
        messageCell.textContent = log.message;
        row.appendChild(messageCell);
        
        // Details
        const detailsCell = document.createElement('td');
        detailsCell.className = 'px-6 py-4 text-sm text-gray-500';
        
        if (Object.keys(log.details).length > 0) {
            const detailsButton = document.createElement('button');
            detailsButton.className = 'text-indigo-600 hover:text-indigo-900';
            detailsButton.textContent = 'View Details';
            detailsButton.addEventListener('click', function() {
                alert(JSON.stringify(log.details, null, 2));
            });
            detailsCell.appendChild(detailsButton);
        } else {
            detailsCell.textContent = 'N/A';
        }
        
        row.appendChild(detailsCell);
        
        logsTable.appendChild(row);
    }
}

// Populate log sensor filter dropdown
function populateLogSensorFilter(sensorData) {
    const sensorFilter = document.getElementById('log-filter-sensor');
    if (!sensorFilter) return;
    
    // Save current selection
    const currentValue = sensorFilter.value;
    
    // Clear options except first one
    while (sensorFilter.options.length > 1) {
        sensorFilter.remove(1);
    }
    
    // Collect all sensors
    const allSensors = [];
    for (const groupName in sensorData.groups) {
        const group = sensorData.groups[groupName];
        for (const sensor of group.sensors) {
            allSensors.push(sensor.name);
        }
    }
    
    // Sort alphabetically
    allSensors.sort();
    
    // Add options for each sensor
    for (const sensor of allSensors) {
        const option = document.createElement('option');
        option.value = sensor;
        option.textContent = sensor;
        sensorFilter.appendChild(option);
    }
    
    // Restore selection if possible
    if (allSensors.includes(currentValue)) {
        sensorFilter.value = currentValue;
    }
}

// Load more logs
function loadMoreLogs() {
    // TODO: Implement pagination for logs
    console.log('Loading more logs...');
}

// Export logs
function exportLogs() {
    // Build query parameters from filters
    const params = new URLSearchParams();
    
    const levelFilter = document.getElementById('log-filter-level').value;
    if (levelFilter) {
        params.append('level', levelFilter);
    }
    
    const categoryFilter = document.getElementById('log-filter-category').value;
    if (categoryFilter) {
        params.append('category', categoryFilter);
    }
    
    const sensorFilter = document.getElementById('log-filter-sensor').value;
    if (sensorFilter) {
        params.append('sensor_name', sensorFilter);
    }
    
    const startFilter = document.getElementById('log-filter-start').value;
    if (startFilter) {
        params.append('start_time', new Date(startFilter).toISOString());
    }
    
    const endFilter = document.getElementById('log-filter-end').value;
    if (endFilter) {
        params.append('end_time', new Date(endFilter).toISOString());
    }
    
    const errorsOnly = document.getElementById('log-filter-errors').checked;
    if (errorsOnly) {
        params.append('errors_only', 'true');
    }
    
    // Set format
    params.append('format', 'csv');
    
    // Open export URL in new tab
    window.open(`/api/logs/export?${params.toString()}`);
}

// Load configuration data
function loadConfigData() {
    console.log('Loading configuration data...');
    
    // Load group configuration
    fetch('/api/config/ui')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateGroupConfig(data.data);
                populateParameterConfig(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading configuration:', error);
        });
}

// Populate group configuration table
function populateGroupConfig(configData) {
    const groupTable = document.getElementById('group-config-table');
    if (!groupTable) return;
    
    groupTable.innerHTML = '';
    
    // Sort groups by priority
    const sortedGroups = Object.entries(configData.groups)
        .sort((a, b) => a[1].priority - b[1].priority);
    
    // Add rows for each group
    for (const [groupName, group] of sortedGroups) {
        const row = document.createElement('tr');
        
        // Group name
        const nameCell = document.createElement('td');
        nameCell.className = 'px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900';
        nameCell.textContent = groupName;
        row.appendChild(nameCell);
        
        // Description
        const descCell = document.createElement('td');
        descCell.className = 'px-6 py-4 text-sm text-gray-500';
        descCell.textContent = group.description;
        row.appendChild(descCell);
        
        // Priority
        const priorityCell = document.createElement('td');
        priorityCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        priorityCell.textContent = group.priority;
        row.appendChild(priorityCell);
        
        // Polling interval
        const pollingCell = document.createElement('td');
        pollingCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        pollingCell.textContent = `${group.default_polling_interval} seconds`;
        row.appendChild(pollingCell);
        
        // Sensor count
        const sensorCell = document.createElement('td');
        sensorCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        sensorCell.textContent = group.parameter_count;
        row.appendChild(sensorCell);
        
        // Status
        const statusCell = document.createElement('td');
        statusCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
        
        const statusBadge = document.createElement('span');
        statusBadge.className = group.enabled ? 
            'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800' : 
            'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800';
        statusBadge.textContent = group.enabled ? 'Enabled' : 'Disabled';
        statusCell.appendChild(statusBadge);
        
        row.appendChild(statusCell);
        
        // Actions
        const actionsCell = document.createElement('td');
        actionsCell.className = 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium';
        
        const editButton = document.createElement('button');
        editButton.className = 'text-indigo-600 hover:text-indigo-900';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', function() {
            showGroupEditModal(groupName, group);
        });
        actionsCell.appendChild(editButton);
        
        row.appendChild(actionsCell);
        
        groupTable.appendChild(row);
    }
    
    // Populate group filter dropdown
    const groupFilter = document.getElementById('config-group-filter');
    if (groupFilter) {
        // Save current selection
        const currentValue = groupFilter.value;
        
        // Clear options except "All groups"
        while (groupFilter.options.length > 1) {
            groupFilter.remove(1);
        }
        
        // Add options for each group
        for (const [groupName, group] of sortedGroups) {
            const option = document.createElement('option');
            option.value = groupName;
            option.textContent = groupName;
            groupFilter.appendChild(option);
        }
        
        // Restore selection if possible
        if (Object.keys(configData.groups).includes(currentValue)) {
            groupFilter.value = currentValue;
        }
    }
}

// Show group edit modal
function showGroupEditModal(groupName, group) {
    // Set modal title
    document.getElementById('group-modal-name').textContent = groupName;
    
    // Set form values
    document.getElementById('group-modal-polling').value = group.default_polling_interval;
    document.getElementById('group-modal-enabled').checked = group.enabled;
    
    // Set up save button
    document.getElementById('group-modal-save').addEventListener('click', function() {
        saveGroupConfig(groupName);
    });
    
    // Show modal
    document.getElementById('group-edit-modal').classList.remove('hidden');
}

// Save group configuration
function saveGroupConfig(groupName) {
    const polling = parseInt(document.getElementById('group-modal-polling').value);
    const enabled = document.getElementById('group-modal-enabled').checked;
    
    const updates = {
        default_polling_interval: polling,
        enabled: enabled
    };
    
    fetch(`/api/config/group/${groupName}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Hide modal
                document.getElementById('group-edit-modal').classList.add('hidden');
                
                // Reload configuration
                loadConfigData();
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Error saving group configuration:', error);
            alert('Error saving configuration. See console for details.');
        });
}

// Populate parameter configuration table
function populateParameterConfig(configData) {
    const paramTable = document.getElementById('parameter-config-table');
    if (!paramTable) return;
    
    paramTable.innerHTML = '';
    
    // Get selected group filter
    const groupFilter = document.getElementById('config-group-filter').value;
    
    // Convert parameters object to array and sort by group and name
    const parameters = Object.entries(configData.parameters)
        .map(([name, param]) => ({ name, ...param }))
        .filter(param => groupFilter === 'all' || param.group === groupFilter)
        .sort((a, b) => {
            if (a.group !== b.group) {
                return a.group.localeCompare(b.group);
            }
            return a.name.localeCompare(b.name);
        });
    
    // Add rows for each parameter
    for (const param of parameters) {
        const row = document.createElement('tr');
        
        // Parameter name
        const nameCell = document.createElement('td');
        nameCell.className = 'px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900';
        nameCell.textContent = param.name;
        row.appendChild(nameCell);
        
        // Description
        const descCell = document.createElement('td');
        descCell.className = 'px-6 py-4 text-sm text-gray-500';
        descCell.textContent = param.display_name;
        row.appendChild(descCell);
        
        // Type
        const typeCell = document.createElement('td');
        typeCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        typeCell.textContent = param.type;
        row.appendChild(typeCell);
        
        // Group
        const groupCell = document.createElement('td');
        groupCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        groupCell.textContent = param.group;
        row.appendChild(groupCell);
        
        // Polling interval
        const pollingCell = document.createElement('td');
        pollingCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        pollingCell.textContent = `${param.polling_interval} seconds`;
        row.appendChild(pollingCell);
        
        // Priority
        const priorityCell = document.createElement('td');
        priorityCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        priorityCell.textContent = param.priority;
        row.appendChild(priorityCell);
        
        // Enabled
        const enabledCell = document.createElement('td');
        enabledCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
        
        const enabledBadge = document.createElement('span');
        enabledBadge.className = param.enabled ? 
            'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800' : 
            'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800';
        enabledBadge.textContent = param.enabled ? 'Enabled' : 'Disabled';
        enabledCell.appendChild(enabledBadge);
        
        row.appendChild(enabledCell);
        
        // Actions
        const actionsCell = document.createElement('td');
        actionsCell.className = 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium';
        
        const editButton = document.createElement('button');
        editButton.className = 'text-indigo-600 hover:text-indigo-900';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', function() {
            showParameterEditModal(param);
        });
        actionsCell.appendChild(editButton);
        
        row.appendChild(actionsCell);
        
        paramTable.appendChild(row);
    }
}

// Filter configuration parameters based on selected group
function filterConfigParameters() {
    loadConfigData();
}

// Show parameter edit modal
function showParameterEditModal(param) {
    // Use the sensor details modal for now
    showSensorDetails(param);
}

// Load documentation
function loadDocumentation() {
    console.log('Loading documentation...');
    
    // Load MQTT documentation by default
    loadSpecificDocumentation('mqtt');
}

// Load specific documentation
function loadSpecificDocumentation(docType) {
    fetch(`/api/documentation/${docType}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const contentElement = document.getElementById(`${docType}-doc-content`);
                if (contentElement) {
                    contentElement.innerHTML = marked.parse(data.data.content);
                }
            }
        })
        .catch(error => {
            console.error(`Error loading ${docType} documentation:`, error);
        });
}

// Generate documentation
function generateDocumentation() {
    fetch('/api/documentation/generate', {
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
                alert('Documentation generated successfully!');
                loadDocumentation();
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Error generating documentation:', error);
            alert('Error generating documentation. See console for details.');
        });
}