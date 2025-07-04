console.log("Initializing EHS-Sentinel UI...");

// Base URL for API requests
const API_BASE_URL = '';

// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tabs
    const tabs = {
        'tab-dashboard': 'view-dashboard',
        'tab-sensors': 'view-sensors',
        'tab-mqtt': 'view-mqtt',
        'tab-logs': 'view-logs',
        'tab-config': 'view-config',
        'tab-docs': 'view-docs'
    };
    
    // Set up tab click handlers
    for (const [tabId, viewId] of Object.entries(tabs)) {
        const tabElement = document.getElementById(tabId);
        if (tabElement) {
            tabElement.addEventListener('click', function() {
                // Hide all views
                for (const viewElement of document.querySelectorAll('.tab-content')) {
                    viewElement.classList.add('hidden');
                }
                
                // Show selected view
                const selectedView = document.getElementById(viewId);
                if (selectedView) {
                    selectedView.classList.remove('hidden');
                }
                
                // Update tab styles
                for (const tab of document.querySelectorAll('[id^="tab-"]')) {
                    tab.classList.remove('tab-active');
                    tab.classList.add('tab-inactive');
                }
                
                tabElement.classList.remove('tab-inactive');
                tabElement.classList.add('tab-active');
                
                // Load data for the selected tab
                if (tabId === 'tab-sensors') {
                    loadSensorsData();
                } else if (tabId === 'tab-mqtt') {
                    loadMQTTData();
                } else if (tabId === 'tab-logs') {
                    loadLogsData();
                } else if (tabId === 'tab-config') {
                    loadConfigData();
                } else if (tabId === 'tab-docs') {
                    loadDocumentation();
                }
            });
        }
    }
    
    // Set up documentation tab switching
    const docTabs = {
        'doc-tab-mqtt': 'doc-view-mqtt',
        'doc-tab-conversion': 'doc-view-conversion',
        'doc-tab-troubleshooting': 'doc-view-troubleshooting'
    };
    
    for (const [tabId, viewId] of Object.entries(docTabs)) {
        const tabElement = document.getElementById(tabId);
        if (tabElement) {
            tabElement.addEventListener('click', function() {
                // Hide all doc views
                for (const viewElement of document.querySelectorAll('.doc-content')) {
                    viewElement.classList.add('hidden');
                }
                
                // Show selected doc view
                const selectedView = document.getElementById(viewId);
                if (selectedView) {
                    selectedView.classList.remove('hidden');
                }
                
                // Update doc tab styles
                for (const tab of document.querySelectorAll('[id^="doc-tab-"]')) {
                    tab.classList.remove('tab-active');
                    tab.classList.add('tab-inactive');
                }
                
                tabElement.classList.remove('tab-inactive');
                tabElement.classList.add('tab-active');
                
                // Load documentation content
                if (tabId === 'doc-tab-mqtt') {
                    loadSpecificDocumentation('mqtt', 'mqtt-doc-content');
                } else if (tabId === 'doc-tab-conversion') {
                    loadSpecificDocumentation('conversion', 'conversion-doc-content');
                } else if (tabId === 'doc-tab-troubleshooting') {
                    loadSpecificDocumentation('troubleshooting', 'troubleshooting-doc-content');
                }
            });
        }
    }
    
    // Set up refresh buttons
    const refreshButtons = {
        'refresh-sensors': loadSensorsData,
        'refresh-mqtt': loadMQTTData,
        'refresh-logs': loadLogsData,
        'refresh-config': loadConfigData
    };
    
    for (const [buttonId, loadFunction] of Object.entries(refreshButtons)) {
        const buttonElement = document.getElementById(buttonId);
        if (buttonElement) {
            buttonElement.addEventListener('click', loadFunction);
        }
    }
    
    // Set up modal close buttons
    const modalCloseButtons = {
        'close-modal': 'sensor-details-modal',
        'close-group-modal': 'group-edit-modal'
    };
    
    for (const [buttonId, modalId] of Object.entries(modalCloseButtons)) {
        const buttonElement = document.getElementById(buttonId);
        if (buttonElement) {
            buttonElement.addEventListener('click', function() {
                document.getElementById(modalId).classList.add('hidden');
            });
        }
    }
    
    // Load initial dashboard data
    loadDashboardData();
});

// Load dashboard data
function loadDashboardData() {
    console.log("Loading dashboard data...");
    
    // Load health data
    fetch(`${API_BASE_URL}/api/health`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateDashboardHealth(data.data);
            }
        })
        .catch(error => {
            console.error("Error loading health data:", error);
        });
    
    // Load sensor stats
    fetch(`${API_BASE_URL}/api/sensors/status`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateDashboardSensors(data.data);
            }
        })
        .catch(error => {
            console.error("Error loading sensor stats:", error);
        });
    
    // Load MQTT stats
    fetch(`${API_BASE_URL}/api/mqtt/stats`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateDashboardMQTT(data.data);
            }
        })
        .catch(error => {
            console.error("Error loading MQTT stats:", error);
        });
    
    // Load log stats
    fetch(`${API_BASE_URL}/api/logs/stats`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateDashboardLogs(data.data);
            }
        })
        .catch(error => {
            console.error("Error loading log stats:", error);
        });
}

// Update dashboard health section
function updateDashboardHealth(data) {
    const systemHealth = document.getElementById('system-health');
    const lastUpdate = document.getElementById('last-update');
    
    if (systemHealth && data.overall_status) {
        systemHealth.textContent = data.overall_status === 'healthy' ? 'Gesund' : 'Probleme';
        systemHealth.className = data.overall_status === 'healthy' 
            ? 'px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800' 
            : 'px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800';
    }
    
    if (lastUpdate && data.components && data.components.timestamp) {
        const date = new Date(data.components.timestamp);
        lastUpdate.textContent = `Aktualisiert: ${date.toLocaleTimeString()}`;
    }
}

// Update dashboard sensors section
function updateDashboardSensors(data) {
    // Update system overview
    document.getElementById('overall-health').textContent = `${data.overall_health}%`;
    document.getElementById('active-sensors').textContent = data.active_sensors;
    document.getElementById('error-sensors').textContent = data.error_sensors;
    document.getElementById('unknown-sensors').textContent = data.unknown_sensors;
    
    // Update critical sensors table
    const criticalSensorsTable = document.getElementById('critical-sensors-table');
    if (criticalSensorsTable) {
        criticalSensorsTable.innerHTML = '';
        
        // Get critical sensors (priority 1)
        const criticalSensors = [];
        for (const groupName in data.groups) {
            const group = data.groups[groupName];
            if (group.sensors) {
                for (const sensor of group.sensors) {
                    if (sensor.priority === 1) {
                        criticalSensors.push(sensor);
                    }
                }
            }
        }
        
        // Sort by status (error first)
        criticalSensors.sort((a, b) => {
            if (a.status === 'error' && b.status !== 'error') return -1;
            if (a.status !== 'error' && b.status === 'error') return 1;
            return 0;
        });
        
        // Add rows
        for (const sensor of criticalSensors) {
            const row = document.createElement('tr');
            
            // Format last reading
            let lastValue = 'N/A';
            let timestamp = 'N/A';
            let responseTime = 'N/A';
            
            if (sensor.last_reading) {
                lastValue = sensor.last_reading.value !== null ? sensor.last_reading.value : 'N/A';
                
                if (sensor.last_reading.timestamp) {
                    const date = new Date(sensor.last_reading.timestamp);
                    timestamp = date.toLocaleTimeString();
                }
                
                if (sensor.last_reading.response_time_ms) {
                    responseTime = `${sensor.last_reading.response_time_ms.toFixed(1)} ms`;
                }
            }
            
            // Create status badge
            const statusBadge = document.createElement('span');
            statusBadge.className = `px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full status-${sensor.status}`;
            statusBadge.textContent = sensor.status.charAt(0).toUpperCase() + sensor.status.slice(1);
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">${sensor.name}</td>
                <td class="px-6 py-4 whitespace-nowrap"></td>
                <td class="px-6 py-4 whitespace-nowrap">${lastValue}</td>
                <td class="px-6 py-4 whitespace-nowrap">${timestamp}</td>
                <td class="px-6 py-4 whitespace-nowrap">${responseTime}</td>
            `;
            
            // Insert status badge
            row.children[1].appendChild(statusBadge);
            
            criticalSensorsTable.appendChild(row);
        }
    }
    
    // Update recent errors
    const recentErrors = document.getElementById('recent-errors');
    if (recentErrors) {
        recentErrors.innerHTML = '';
        
        // Collect errors from all sensors
        const errors = [];
        for (const groupName in data.groups) {
            const group = data.groups[groupName];
            if (group.sensors) {
                for (const sensor of group.sensors) {
                    if (sensor.status === 'error' || sensor.status === 'timeout') {
                        errors.push({
                            name: sensor.name,
                            status: sensor.status,
                            description: sensor.description || sensor.name,
                            statistics: sensor.statistics
                        });
                    }
                }
            }
        }
        
        // Sort by error count
        errors.sort((a, b) => {
            const aCount = a.statistics ? a.statistics.error_count : 0;
            const bCount = b.statistics ? b.statistics.error_count : 0;
            return bCount - aCount;
        });
        
        // Show top 5 errors
        const topErrors = errors.slice(0, 5);
        
        if (topErrors.length === 0) {
            recentErrors.innerHTML = '<div class="text-green-600 font-medium">Keine aktuellen Fehler! 🎉</div>';
        } else {
            for (const error of topErrors) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'bg-red-50 border border-red-200 rounded-md p-4';
                
                const errorCount = error.statistics ? error.statistics.error_count : 'N/A';
                const successRate = error.statistics ? `${error.statistics.success_rate}%` : 'N/A';
                
                errorDiv.innerHTML = `
                    <div class="flex justify-between">
                        <h4 class="font-medium text-red-800">${error.description}</h4>
                        <span class="text-red-600">${error.status.toUpperCase()}</span>
                    </div>
                    <div class="mt-2 text-sm text-red-700">
                        <p>Sensor: ${error.name}</p>
                        <p>Fehler: ${errorCount} | Erfolgsrate: ${successRate}</p>
                    </div>
                `;
                
                recentErrors.appendChild(errorDiv);
            }
        }
    }
}

// Update dashboard MQTT section
function updateDashboardMQTT(data) {
    // Update MQTT stats
    document.getElementById('mqtt-total-messages').textContent = data.message_stats.total_messages;
    document.getElementById('mqtt-recent-messages').textContent = data.message_stats.messages_last_hour;
    document.getElementById('mqtt-success-rate').textContent = `${data.flow_stats.success_rate}%`;
    document.getElementById('mqtt-response-time').textContent = `${data.flow_stats.avg_response_time_ms} ms`;
}

// Update dashboard logs section
function updateDashboardLogs(data) {
    // Update log stats
    document.getElementById('log-total-entries').textContent = data.total_entries;
    document.getElementById('log-error-count').textContent = data.level_breakdown.ERROR || 0;
    document.getElementById('log-error-rate').textContent = `${data.error_rate}%`;
    document.getElementById('log-avg-duration').textContent = `${data.performance.avg_duration_ms} ms`;
}

// Load sensors data
function loadSensorsData() {
    console.log("Loading sensors data...");
    
    fetch(`${API_BASE_URL}/api/sensors/status`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateSensorsView(data.data);
            }
        })
        .catch(error => {
            console.error("Error loading sensors data:", error);
        });
}

// Update sensors view
function updateSensorsView(data) {
    // Update group filter
    const groupFilter = document.getElementById('group-filter');
    if (groupFilter) {
        // Save current selection
        const currentValue = groupFilter.value;
        
        // Clear options
        groupFilter.innerHTML = '<option value="all">Alle Gruppen</option>';
        
        // Add groups
        for (const groupName in data.groups) {
            const option = document.createElement('option');
            option.value = groupName;
            option.textContent = data.groups[groupName].group;
            groupFilter.appendChild(option);
        }
        
        // Restore selection if possible
        if (currentValue && Array.from(groupFilter.options).some(opt => opt.value === currentValue)) {
            groupFilter.value = currentValue;
        }
    }
    
    // Update sensors table
    const sensorsTable = document.getElementById('sensors-table');
    if (sensorsTable) {
        sensorsTable.innerHTML = '';
        
        // Get selected filters
        const selectedGroup = groupFilter ? groupFilter.value : 'all';
        const selectedStatus = document.getElementById('status-filter').value;
        
        // Collect all sensors
        let allSensors = [];
        for (const groupName in data.groups) {
            if (selectedGroup === 'all' || selectedGroup === groupName) {
                const group = data.groups[groupName];
                if (group.sensors) {
                    for (const sensor of group.sensors) {
                        if (selectedStatus === 'all' || selectedStatus === sensor.status) {
                            allSensors.push({
                                ...sensor,
                                group: groupName
                            });
                        }
                    }
                }
            }
        }
        
        // Sort by priority then name
        allSensors.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return a.name.localeCompare(b.name);
        });
        
        // Add rows
        for (const sensor of allSensors) {
            const row = document.createElement('tr');
            row.className = `priority-${sensor.priority}`;
            
            // Format last reading
            let lastValue = 'N/A';
            let timestamp = 'N/A';
            
            if (sensor.last_reading) {
                lastValue = sensor.last_reading.value !== null ? sensor.last_reading.value : 'N/A';
                
                if (sensor.last_reading.timestamp) {
                    const date = new Date(sensor.last_reading.timestamp);
                    timestamp = date.toLocaleTimeString();
                }
            }
            
            // Create status badge
            const statusBadge = document.createElement('span');
            statusBadge.className = `px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full status-${sensor.status}`;
            statusBadge.textContent = sensor.status.charAt(0).toUpperCase() + sensor.status.slice(1);
            
            // Create action button
            const actionButton = document.createElement('button');
            actionButton.className = 'text-blue-600 hover:text-blue-900';
            actionButton.innerHTML = '<i class="fas fa-info-circle"></i>';
            actionButton.addEventListener('click', () => showSensorDetails(sensor.name));
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap font-medium">${sensor.name}</td>
                <td class="px-6 py-4 whitespace-nowrap">${sensor.description || sensor.name}</td>
                <td class="px-6 py-4 whitespace-nowrap">${data.groups[sensor.group].group}</td>
                <td class="px-6 py-4 whitespace-nowrap"></td>
                <td class="px-6 py-4 whitespace-nowrap">${lastValue}</td>
                <td class="px-6 py-4 whitespace-nowrap">${timestamp}</td>
                <td class="px-6 py-4 whitespace-nowrap"></td>
            `;
            
            // Insert status badge and action button
            row.children[3].appendChild(statusBadge);
            row.children[6].appendChild(actionButton);
            
            sensorsTable.appendChild(row);
        }
    }
}

// Show sensor details
function showSensorDetails(sensorName) {
    // Get sensor details
    fetch(`${API_BASE_URL}/api/sensors/${sensorName}/status`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const sensor = data.data;
                
                // Update modal fields
                document.getElementById('modal-sensor-name').textContent = sensor.name;
                document.getElementById('modal-description').textContent = sensor.description || sensor.name;
                document.getElementById('modal-group').textContent = sensor.group;
                document.getElementById('modal-priority').textContent = sensor.priority;
                document.getElementById('modal-polling').textContent = `${sensor.polling_interval} s`;
                document.getElementById('modal-enabled').textContent = sensor.enabled ? 'Ja' : 'Nein';
                document.getElementById('modal-writable').textContent = sensor.writable ? 'Ja' : 'Nein';
                document.getElementById('modal-address').textContent = sensor.nasa_address || 'N/A';
                document.getElementById('modal-entity-id').textContent = sensor.hass_entity_id || 'N/A';
                
                document.getElementById('modal-status').textContent = sensor.status.charAt(0).toUpperCase() + sensor.status.slice(1);
                
                // Last reading
                if (sensor.last_reading) {
                    document.getElementById('modal-last-value').textContent = sensor.last_reading.value !== null ? sensor.last_reading.value : 'N/A';
                    
                    if (sensor.last_reading.timestamp) {
                        const date = new Date(sensor.last_reading.timestamp);
                        document.getElementById('modal-timestamp').textContent = date.toLocaleString();
                    } else {
                        document.getElementById('modal-timestamp').textContent = 'N/A';
                    }
                    
                    document.getElementById('modal-response-time').textContent = sensor.last_reading.response_time_ms 
                        ? `${sensor.last_reading.response_time_ms.toFixed(1)} ms` 
                        : 'N/A';
                } else {
                    document.getElementById('modal-last-value').textContent = 'N/A';
                    document.getElementById('modal-timestamp').textContent = 'N/A';
                    document.getElementById('modal-response-time').textContent = 'N/A';
                }
                
                // Statistics
                if (sensor.statistics) {
                    document.getElementById('modal-success-rate').textContent = `${sensor.statistics.success_rate}%`;
                    document.getElementById('modal-error-count').textContent = sensor.statistics.error_count;
                } else {
                    document.getElementById('modal-success-rate').textContent = 'N/A';
                    document.getElementById('modal-error-count').textContent = 'N/A';
                }
                
                // Configuration inputs
                document.getElementById('modal-input-polling').value = sensor.polling_interval;
                document.getElementById('modal-input-priority').value = sensor.priority;
                document.getElementById('modal-input-enabled').checked = sensor.enabled;
                
                // Get MQTT history
                fetch(`${API_BASE_URL}/api/mqtt/history/${sensorName}`)
                    .then(response => response.json())
                    .then(historyData => {
                        if (historyData.success) {
                            updateMQTTHistory(historyData.data);
                        }
                    })
                    .catch(error => {
                        console.error("Error loading MQTT history:", error);
                        document.getElementById('modal-mqtt-history').innerHTML = '<div class="text-red-600">Fehler beim Laden der MQTT-Historie</div>';
                    });
                
                // Show modal
                document.getElementById('sensor-details-modal').classList.remove('hidden');
            }
        })
        .catch(error => {
            console.error("Error loading sensor details:", error);
        });
}

// Update MQTT history in sensor details modal
function updateMQTTHistory(data) {
    const historyContainer = document.getElementById('modal-mqtt-history');
    historyContainer.innerHTML = '';
    
    if (data.messages && data.messages.length > 0) {
        const table = document.createElement('table');
        table.className = 'min-w-full divide-y divide-gray-200';
        
        table.innerHTML = `
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zeit</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payload</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
            </tbody>
        `;
        
        const tbody = table.querySelector('tbody');
        
        // Sort messages by timestamp (newest first)
        data.messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Add rows
        for (const message of data.messages.slice(0, 10)) {
            const row = document.createElement('tr');
            
            const date = new Date(message.timestamp);
            const formattedTime = date.toLocaleTimeString();
            
            row.innerHTML = `
                <td class="px-4 py-2 whitespace-nowrap">${formattedTime}</td>
                <td class="px-4 py-2 whitespace-nowrap">${message.type}</td>
                <td class="px-4 py-2 whitespace-nowrap text-xs">${message.topic}</td>
                <td class="px-4 py-2 whitespace-nowrap">${message.payload}</td>
            `;
            
            tbody.appendChild(row);
        }
        
        historyContainer.appendChild(table);
    } else {
        historyContainer.innerHTML = '<div class="text-gray-500">Keine MQTT-Nachrichten in den letzten 24 Stunden</div>';
    }
}

// Save sensor configuration
document.getElementById('modal-save-config').addEventListener('click', function() {
    const sensorName = document.getElementById('modal-sensor-name').textContent;
    const pollingInterval = parseInt(document.getElementById('modal-input-polling').value);
    const priority = parseInt(document.getElementById('modal-input-priority').value);
    const enabled = document.getElementById('modal-input-enabled').checked;
    
    const updates = {
        polling_interval: pollingInterval,
        priority: priority,
        enabled: enabled
    };
    
    fetch(`${API_BASE_URL}/api/config/parameter/${sensorName}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Konfiguration erfolgreich gespeichert!');
                document.getElementById('sensor-details-modal').classList.add('hidden');
                loadSensorsData();
            } else {
                alert(`Fehler: ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Error saving configuration:", error);
            alert('Fehler beim Speichern der Konfiguration');
        });
});

// Load MQTT data
function loadMQTTData() {
    console.log("Loading MQTT data...");
    
    // Load MQTT stats
    fetch(`${API_BASE_URL}/api/mqtt/stats`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateMQTTStats(data.data);
            }
        })
        .catch(error => {
            console.error("Error loading MQTT data:", error);
        });
    
    // Load sensors for MQTT filter
    fetch(`${API_BASE_URL}/api/sensors/status`)
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

// Update MQTT stats
function updateMQTTStats(data) {
    // Message stats
    document.getElementById('mqtt-stats-total').textContent = data.message_stats.total_messages;
    document.getElementById('mqtt-stats-hour').textContent = data.message_stats.messages_last_hour;
    document.getElementById('mqtt-stats-pending').textContent = data.message_stats.pending_commands;
    
    // Conversion stats
    document.getElementById('mqtt-stats-conv-success').textContent = data.conversion_stats.successful_conversions;
    document.getElementById('mqtt-stats-conv-failed').textContent = data.conversion_stats.failed_conversions;
    document.getElementById('mqtt-stats-conv-rate').textContent = `${data.conversion_stats.conversion_success_rate}%`;
    
    // Flow stats
    document.getElementById('mqtt-stats-flow-total').textContent = data.flow_stats.total_flows;
    document.getElementById('mqtt-stats-flow-success').textContent = data.flow_stats.successful_flows;
    document.getElementById('mqtt-stats-flow-rate').textContent = `${data.flow_stats.success_rate}%`;
    document.getElementById('mqtt-stats-flow-time').textContent = `${data.flow_stats.avg_response_time_ms} ms`;
    
    // Recent errors
    const errorsContainer = document.getElementById('mqtt-recent-errors');
    errorsContainer.innerHTML = '';
    
    if (data.recent_errors && data.recent_errors.length > 0) {
        for (const error of data.recent_errors) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'bg-red-50 border border-red-200 rounded-md p-4';
            
            const date = new Date(error.timestamp);
            const formattedTime = date.toLocaleTimeString();
            
            errorDiv.innerHTML = `
                <div class="flex justify-between">
                    <h4 class="font-medium text-red-800">${error.sensor}</h4>
                    <span class="text-red-600">${formattedTime}</span>
                </div>
                <div class="mt-2 text-sm text-red-700">
                    <p>${error.message}</p>
                    <p class="text-xs mt-1">${error.details}</p>
                </div>
            `;
            
            errorsContainer.appendChild(errorDiv);
        }
    } else {
        errorsContainer.innerHTML = '<div class="text-green-600 font-medium">Keine aktuellen Fehler! 🎉</div>';
    }
}

// Update MQTT sensor filter
function updateMQTTSensorFilter(data) {
    const sensorFilter = document.getElementById('mqtt-sensor-filter');
    if (sensorFilter) {
        // Save current selection
        const currentValue = sensorFilter.value;
        
        // Clear options
        sensorFilter.innerHTML = '<option value="">Sensor auswählen...</option>';
        
        // Collect all sensors
        const allSensors = [];
        for (const groupName in data.groups) {
            const group = data.groups[groupName];
            if (group.sensors) {
                for (const sensor of group.sensors) {
                    allSensors.push(sensor);
                }
            }
        }
        
        // Sort by name
        allSensors.sort((a, b) => a.name.localeCompare(b.name));
        
        // Add options
        for (const sensor of allSensors) {
            const option = document.createElement('option');
            option.value = sensor.name;
            option.textContent = sensor.name;
            sensorFilter.appendChild(option);
        }
        
        // Restore selection if possible
        if (currentValue && Array.from(sensorFilter.options).some(opt => opt.value === currentValue)) {
            sensorFilter.value = currentValue;
        }
    }
}

// Load MQTT history for a specific sensor
document.getElementById('mqtt-load-history').addEventListener('click', function() {
    const sensorName = document.getElementById('mqtt-sensor-filter').value;
    if (!sensorName) {
        alert('Bitte wählen Sie einen Sensor aus');
        return;
    }
    
    fetch(`${API_BASE_URL}/api/mqtt/history/${sensorName}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateMQTTHistory(data.data);
            }
        })
        .catch(error => {
            console.error("Error loading MQTT history:", error);
            alert('Fehler beim Laden der MQTT-Historie');
        });
});

// Update MQTT history table
function updateMQTTHistory(data) {
    const historyTable = document.getElementById('mqtt-history-table');
    historyTable.innerHTML = '';
    
    if (data.communication_flows && data.communication_flows.length > 0) {
        // Sort by timestamp (newest first)
        data.communication_flows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Add rows
        for (const flow of data.communication_flows) {
            const row = document.createElement('tr');
            
            const date = new Date(flow.timestamp);
            const formattedTime = date.toLocaleString();
            
            // Create status badge
            const statusBadge = document.createElement('span');
            statusBadge.className = flow.success 
                ? 'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800' 
                : 'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800';
            statusBadge.textContent = flow.success ? 'Erfolgreich' : 'Fehler';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">${formattedTime}</td>
                <td class="px-6 py-4 whitespace-nowrap">${flow.initiated_by === 'home_assistant' ? 'SET' : 'STATE'}</td>
                <td class="px-6 py-4 whitespace-nowrap">${flow.initiated_by === 'home_assistant' ? 'Home Assistant' : 'EHS-Sentinel'}</td>
                <td class="px-6 py-4 whitespace-nowrap">${flow.set_value !== null ? flow.set_value : 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap">${flow.state_value !== null ? flow.state_value : 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap">${flow.response_time_ms ? `${flow.response_time_ms.toFixed(1)} ms` : 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap"></td>
            `;
            
            // Insert status badge
            row.children[6].appendChild(statusBadge);
            
            historyTable.appendChild(row);
        }
    } else {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="7" class="px-6 py-4 text-center text-gray-500">Keine MQTT-Historie verfügbar</td>
        `;
        historyTable.appendChild(row);
    }
}

// Load logs data
function loadLogsData() {
    console.log("Loading logs data...");
    
    // Load log stats
    fetch(`${API_BASE_URL}/api/logs/stats`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateLogStats(data.data);
            }
        })
        .catch(error => {
            console.error("Error loading log stats:", error);
        });
    
    // Load sensors for log filter
    fetch(`${API_BASE_URL}/api/sensors/status`)
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

// Update log stats
function updateLogStats(data) {
    // Level breakdown
    const levelStats = document.getElementById('log-stats-level');
    levelStats.innerHTML = '';
    
    for (const [level, count] of Object.entries(data.level_breakdown)) {
        const levelDiv = document.createElement('div');
        levelDiv.className = 'flex justify-between';
        levelDiv.innerHTML = `
            <span class="text-gray-600">${level}:</span>
            <span class="font-semibold">${count}</span>
        `;
        levelStats.appendChild(levelDiv);
    }
    
    // Category breakdown
    const categoryStats = document.getElementById('log-stats-category');
    categoryStats.innerHTML = '';
    
    for (const [category, count] of Object.entries(data.category_breakdown)) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'flex justify-between';
        categoryDiv.innerHTML = `
            <span class="text-gray-600">${category}:</span>
            <span class="font-semibold">${count}</span>
        `;
        categoryStats.appendChild(categoryDiv);
    }
    
    // Sensor breakdown
    const sensorStats = document.getElementById('log-stats-sensors');
    sensorStats.innerHTML = '';
    
    // Convert to array and sort by error count
    const sensorEntries = Object.entries(data.sensor_breakdown);
    sensorEntries.sort((a, b) => b[1].errors - a[1].errors);
    
    // Show top 5 sensors with errors
    for (const [sensor, stats] of sensorEntries.slice(0, 5)) {
        if (stats.errors > 0) {
            const sensorDiv = document.createElement('div');
            sensorDiv.className = 'flex justify-between';
            sensorDiv.innerHTML = `
                <span class="text-gray-600">${sensor}:</span>
                <span class="font-semibold">${stats.errors} Fehler (${(stats.errors / stats.total * 100).toFixed(1)}%)</span>
            `;
            sensorStats.appendChild(sensorDiv);
        }
    }
    
    if (sensorStats.children.length === 0) {
        sensorStats.innerHTML = '<div class="text-green-600 font-medium">Keine Sensor-Fehler! 🎉</div>';
    }
}

// Update log sensor filter
function updateLogSensorFilter(data) {
    const sensorFilter = document.getElementById('log-filter-sensor');
    if (sensorFilter) {
        // Save current selection
        const currentValue = sensorFilter.value;
        
        // Clear options
        sensorFilter.innerHTML = '<option value="">Alle Sensoren</option>';
        
        // Collect all sensors
        const allSensors = [];
        for (const groupName in data.groups) {
            const group = data.groups[groupName];
            if (group.sensors) {
                for (const sensor of group.sensors) {
                    allSensors.push(sensor);
                }
            }
        }
        
        // Sort by name
        allSensors.sort((a, b) => a.name.localeCompare(b.name));
        
        // Add options
        for (const sensor of allSensors) {
            const option = document.createElement('option');
            option.value = sensor.name;
            option.textContent = sensor.name;
            sensorFilter.appendChild(option);
        }
        
        // Restore selection if possible
        if (currentValue && Array.from(sensorFilter.options).some(opt => opt.value === currentValue)) {
            sensorFilter.value = currentValue;
        }
    }
}

// Load log entries
function loadLogEntries(filters = {}, limit = 50) {
    // Build query string
    const queryParams = new URLSearchParams();
    
    if (filters.level) queryParams.append('level', filters.level);
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.sensor_name) queryParams.append('sensor_name', filters.sensor_name);
    if (filters.start_time) queryParams.append('start_time', filters.start_time);
    if (filters.end_time) queryParams.append('end_time', filters.end_time);
    if (filters.errors_only) queryParams.append('errors_only', filters.errors_only);
    
    queryParams.append('limit', limit);
    
    fetch(`${API_BASE_URL}/api/logs?${queryParams.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateLogEntries(data.data.logs);
            }
        })
        .catch(error => {
            console.error("Error loading logs:", error);
        });
}

// Update log entries table
function updateLogEntries(logs) {
    const logsTable = document.getElementById('log-entries-table');
    logsTable.innerHTML = '';
    
    if (logs && logs.length > 0) {
        // Add rows
        for (const log of logs) {
            const row = document.createElement('tr');
            
            const date = new Date(log.timestamp);
            const formattedTime = date.toLocaleString();
            
            // Create level badge
            const levelBadge = document.createElement('span');
            let badgeClass = 'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ';
            
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
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">${formattedTime}</td>
                <td class="px-6 py-4 whitespace-nowrap"></td>
                <td class="px-6 py-4 whitespace-nowrap">${log.category}</td>
                <td class="px-6 py-4 whitespace-nowrap">${log.sensor_name || 'N/A'}</td>
                <td class="px-6 py-4">${log.message}</td>
                <td class="px-6 py-4 text-xs">${JSON.stringify(log.details) || 'N/A'}</td>
            `;
            
            // Insert level badge
            row.children[1].appendChild(levelBadge);
            
            logsTable.appendChild(row);
        }
    } else {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="6" class="px-6 py-4 text-center text-gray-500">Keine Log-Einträge gefunden</td>
        `;
        logsTable.appendChild(row);
    }
}

// Apply log filters
document.getElementById('apply-log-filters').addEventListener('click', function() {
    const filters = {
        level: document.getElementById('log-filter-level').value,
        category: document.getElementById('log-filter-category').value,
        sensor_name: document.getElementById('log-filter-sensor').value,
        start_time: document.getElementById('log-filter-start').value,
        end_time: document.getElementById('log-filter-end').value,
        errors_only: document.getElementById('log-filter-errors').checked
    };
    
    loadLogEntries(filters);
});

// Load more logs
document.getElementById('load-more-logs').addEventListener('click', function() {
    const currentRows = document.getElementById('log-entries-table').children.length;
    const newLimit = currentRows + 50;
    
    const filters = {
        level: document.getElementById('log-filter-level').value,
        category: document.getElementById('log-filter-category').value,
        sensor_name: document.getElementById('log-filter-sensor').value,
        start_time: document.getElementById('log-filter-start').value,
        end_time: document.getElementById('log-filter-end').value,
        errors_only: document.getElementById('log-filter-errors').checked
    };
    
    loadLogEntries(filters, newLimit);
});

// Export logs
document.getElementById('export-logs').addEventListener('click', function() {
    const filters = {
        level: document.getElementById('log-filter-level').value,
        category: document.getElementById('log-filter-category').value,
        sensor_name: document.getElementById('log-filter-sensor').value,
        start_time: document.getElementById('log-filter-start').value,
        end_time: document.getElementById('log-filter-end').value,
        errors_only: document.getElementById('log-filter-errors').checked
    };
    
    const format = 'json'; // or 'csv'
    
    // Build query string
    const queryParams = new URLSearchParams();
    
    if (filters.level) queryParams.append('level', filters.level);
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.sensor_name) queryParams.append('sensor_name', filters.sensor_name);
    if (filters.start_time) queryParams.append('start_time', filters.start_time);
    if (filters.end_time) queryParams.append('end_time', filters.end_time);
    if (filters.errors_only) queryParams.append('errors_only', filters.errors_only);
    
    queryParams.append('format', format);
    
    // Open download link
    window.open(`${API_BASE_URL}/api/logs/export?${queryParams.toString()}`);
});

// Load configuration data
function loadConfigData() {
    console.log("Loading configuration data...");
    
    fetch(`${API_BASE_URL}/api/config/ui`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateConfigView(data.data);
            }
        })
        .catch(error => {
            console.error("Error loading configuration:", error);
        });
}

// Update configuration view
function updateConfigView(data) {
    // Update group configuration table
    const groupTable = document.getElementById('group-config-table');
    if (groupTable) {
        groupTable.innerHTML = '';
        
        // Sort groups by priority
        const sortedGroups = Object.entries(data.groups)
            .sort((a, b) => a[1].priority - b[1].priority);
        
        // Add rows
        for (const [groupName, group] of sortedGroups) {
            const row = document.createElement('tr');
            
            // Create status badge
            const statusBadge = document.createElement('span');
            statusBadge.className = group.enabled 
                ? 'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800' 
                : 'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800';
            statusBadge.textContent = group.enabled ? 'Aktiv' : 'Inaktiv';
            
            // Create edit button
            const editButton = document.createElement('button');
            editButton.className = 'text-blue-600 hover:text-blue-900 mr-2';
            editButton.innerHTML = '<i class="fas fa-edit"></i>';
            editButton.addEventListener('click', () => showGroupEditModal(groupName, group));
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap font-medium">${group.display_name}</td>
                <td class="px-6 py-4">${group.description}</td>
                <td class="px-6 py-4 whitespace-nowrap">${group.priority}</td>
                <td class="px-6 py-4 whitespace-nowrap">${group.default_polling_interval} s</td>
                <td class="px-6 py-4 whitespace-nowrap">${group.parameter_count}</td>
                <td class="px-6 py-4 whitespace-nowrap"></td>
                <td class="px-6 py-4 whitespace-nowrap"></td>
            `;
            
            // Insert status badge and edit button
            row.children[5].appendChild(statusBadge);
            row.children[6].appendChild(editButton);
            
            groupTable.appendChild(row);
        }
    }
    
    // Update parameter configuration table
    const parameterTable = document.getElementById('parameter-config-table');
    if (parameterTable) {
        parameterTable.innerHTML = '';
        
        // Get selected group filter
        const groupFilter = document.getElementById('config-group-filter');
        const selectedGroup = groupFilter ? groupFilter.value : 'all';
        
        // Update group filter options
        if (groupFilter) {
            // Save current selection
            const currentValue = groupFilter.value;
            
            // Clear options
            groupFilter.innerHTML = '<option value="all">Alle Gruppen</option>';
            
            // Add groups
            for (const [groupName, group] of Object.entries(data.groups)) {
                const option = document.createElement('option');
                option.value = groupName;
                option.textContent = group.display_name;
                groupFilter.appendChild(option);
            }
            
            // Restore selection if possible
            if (currentValue && Array.from(groupFilter.options).some(opt => opt.value === currentValue)) {
                groupFilter.value = currentValue;
            }
        }
        
        // Collect parameters for selected group
        const filteredParameters = Object.entries(data.parameters)
            .filter(([_, param]) => selectedGroup === 'all' || param.group === selectedGroup)
            .sort((a, b) => {
                // Sort by priority then name
                if (a[1].priority !== b[1].priority) {
                    return a[1].priority - b[1].priority;
                }
                return a[0].localeCompare(b[0]);
            });
        
        // Add rows
        for (const [paramName, param] of filteredParameters) {
            const row = document.createElement('tr');
            
            // Create enabled checkbox
            const enabledCheckbox = document.createElement('input');
            enabledCheckbox.type = 'checkbox';
            enabledCheckbox.className = 'rounded border-gray-300 text-blue-600 shadow-sm';
            enabledCheckbox.checked = param.enabled;
            enabledCheckbox.addEventListener('change', function() {
                updateParameterConfig(paramName, { enabled: this.checked });
            });
            
            // Create edit button
            const editButton = document.createElement('button');
            editButton.className = 'text-blue-600 hover:text-blue-900 mr-2';
            editButton.innerHTML = '<i class="fas fa-edit"></i>';
            editButton.addEventListener('click', () => showSensorDetails(paramName));
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap font-medium">${paramName}</td>
                <td class="px-6 py-4">${param.display_name}</td>
                <td class="px-6 py-4 whitespace-nowrap">${param.type}</td>
                <td class="px-6 py-4 whitespace-nowrap">${data.groups[param.group].display_name}</td>
                <td class="px-6 py-4 whitespace-nowrap">${param.polling_interval} s</td>
                <td class="px-6 py-4 whitespace-nowrap">${param.priority}</td>
                <td class="px-6 py-4 whitespace-nowrap"></td>
                <td class="px-6 py-4 whitespace-nowrap"></td>
            `;
            
            // Insert enabled checkbox and edit button
            row.children[6].appendChild(enabledCheckbox);
            row.children[7].appendChild(editButton);
            
            parameterTable.appendChild(row);
        }
    }
}

// Show group edit modal
function showGroupEditModal(groupName, group) {
    document.getElementById('group-modal-name').textContent = group.display_name;
    document.getElementById('group-modal-polling').value = group.default_polling_interval;
    document.getElementById('group-modal-enabled').checked = group.enabled;
    
    // Set up save button
    document.getElementById('group-modal-save').onclick = function() {
        const updates = {
            default_polling_interval: parseInt(document.getElementById('group-modal-polling').value),
            enabled: document.getElementById('group-modal-enabled').checked
        };
        
        updateGroupConfig(groupName, updates);
    };
    
    // Show modal
    document.getElementById('group-edit-modal').classList.remove('hidden');
}

// Update parameter configuration
function updateParameterConfig(paramName, updates) {
    fetch(`${API_BASE_URL}/api/config/parameter/${paramName}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
    })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert(`Fehler: ${data.error}`);
                loadConfigData(); // Reload to reset UI
            }
        })
        .catch(error => {
            console.error("Error updating parameter config:", error);
            alert('Fehler beim Aktualisieren der Parameter-Konfiguration');
            loadConfigData(); // Reload to reset UI
        });
}

// Update group configuration
function updateGroupConfig(groupName, updates) {
    fetch(`${API_BASE_URL}/api/config/group/${groupName}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Gruppe erfolgreich aktualisiert!');
                document.getElementById('group-edit-modal').classList.add('hidden');
                loadConfigData();
            } else {
                alert(`Fehler: ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Error updating group config:", error);
            alert('Fehler beim Aktualisieren der Gruppen-Konfiguration');
        });
}

// Load documentation
function loadDocumentation() {
    console.log("Loading documentation...");
    
    // Load MQTT documentation by default
    loadSpecificDocumentation('mqtt', 'mqtt-doc-content');
}

// Load specific documentation
function loadSpecificDocumentation(type, containerId) {
    fetch(`${API_BASE_URL}/api/documentation/${type}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const container = document.getElementById(containerId);
                if (container) {
                    if (data.data.format === 'markdown') {
                        container.innerHTML = marked.parse(data.data.content);
                    } else {
                        container.textContent = data.data.content;
                    }
                }
            }
        })
        .catch(error => {
            console.error(`Error loading ${type} documentation:`, error);
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `<div class="text-red-600">Fehler beim Laden der Dokumentation: ${error.message}</div>`;
            }
        });
}

// Generate documentation
document.getElementById('generate-docs').addEventListener('click', function() {
    fetch(`${API_BASE_URL}/api/documentation/generate`, {
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
                alert('Dokumentation erfolgreich generiert!');
                
                // Reload current documentation
                const activeDocTab = document.querySelector('#view-docs .tab-active');
                if (activeDocTab) {
                    activeDocTab.click();
                }
            } else {
                alert(`Fehler: ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Error generating documentation:", error);
            alert('Fehler bei der Dokumentationsgenerierung');
        });
});