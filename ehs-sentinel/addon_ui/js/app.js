// EHS-Sentinel UI JavaScript
// Main application logic for the EHS-Sentinel monitoring interface

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing EHS-Sentinel UI...');
    
    // Initialize tabs
    initializeTabs();
    
    // Load initial data
    loadDashboardData();
    
    // Set up tab event listeners
    document.getElementById('tab-dashboard').addEventListener('click', function() {
        showTab('dashboard');
    });
    
    document.getElementById('tab-sensors').addEventListener('click', function() {
        showTab('sensors');
        loadSensorsData();
    });
    
    document.getElementById('tab-mqtt').addEventListener('click', function() {
        showTab('mqtt');
        loadMQTTData();
    });
    
    document.getElementById('tab-logs').addEventListener('click', function() {
        showTab('logs');
        loadLogsData();
    });
    
    document.getElementById('tab-config').addEventListener('click', function() {
        showTab('config');
        loadConfigData();
    });
    
    document.getElementById('tab-docs').addEventListener('click', function() {
        showTab('docs');
        loadDocumentation();
    });
    
    // Set up documentation tab event listeners
    document.getElementById('doc-tab-mqtt').addEventListener('click', function() {
        showDocTab('mqtt');
    });
    
    document.getElementById('doc-tab-conversion').addEventListener('click', function() {
        showDocTab('conversion');
    });
    
    document.getElementById('doc-tab-troubleshooting').addEventListener('click', function() {
        showDocTab('troubleshooting');
    });
    
    // Set up refresh buttons
    document.getElementById('refresh-sensors').addEventListener('click', loadSensorsData);
    document.getElementById('refresh-mqtt').addEventListener('click', loadMQTTData);
    document.getElementById('refresh-logs').addEventListener('click', loadLogsData);
    document.getElementById('refresh-config').addEventListener('click', loadConfigData);
    
    // Set up modal close buttons
    document.getElementById('close-modal').addEventListener('click', function() {
        document.getElementById('sensor-details-modal').classList.add('hidden');
    });
    
    document.getElementById('close-group-modal').addEventListener('click', function() {
        document.getElementById('group-edit-modal').classList.add('hidden');
    });
    
    // Set up filter change handlers
    document.getElementById('group-filter').addEventListener('change', filterSensors);
    document.getElementById('status-filter').addEventListener('change', filterSensors);
    
    document.getElementById('config-group-filter').addEventListener('change', filterParameters);
    
    document.getElementById('mqtt-sensor-filter').addEventListener('change', function() {
        document.getElementById('mqtt-load-history').disabled = !this.value;
    });
    
    document.getElementById('mqtt-load-history').addEventListener('click', loadMQTTHistory);
    
    // Set up log filter handlers
    document.getElementById('apply-log-filters').addEventListener('click', applyLogFilters);
    document.getElementById('load-more-logs').addEventListener('click', loadMoreLogs);
    document.getElementById('export-logs').addEventListener('click', exportLogs);
    
    // Set up documentation generation
    document.getElementById('generate-docs').addEventListener('click', generateDocumentation);
    
    // Set up auto-refresh
    setInterval(function() {
        if (document.getElementById('view-dashboard').classList.contains('hidden') === false) {
            loadLogsData();
        }
    }, 60000); // Refresh logs every minute
});

function loadDashboardData() {
    console.log('Loading dashboard data...');
    
    // Load health data
    fetch('/api/health')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateSystemHealth(data.data);
            } else {
                console.error('Error loading health data:', data.error);
            }
        })
        .catch(error => {
            console.error('Error loading health data:', error);
        });
    
    // Load sensor stats
    fetch('/api/sensors/status')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateSensorStats(data.data);
            } else {
                console.error('Error loading sensor stats:', data.error);
            }
        })
        .catch(error => {
            console.error('Error loading sensor stats:', error);
        });
    
    // Load MQTT stats
    fetch('/api/mqtt/stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateMQTTStats(data.data);
            } else {
                console.error('Error loading MQTT stats:', data.error);
            }
        })
        .catch(error => {
            console.error('Error loading MQTT stats:', error);
        });
    
    // Load log stats
    fetch('/api/logs/stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateLogStats(data.data);
            } else {
                console.error('Error loading log stats:', data.error);
            }
        })
        .catch(error => {
            console.error('Error loading log stats:', error);
        });
}

function updateSystemHealth(data) {
    const systemHealth = document.getElementById('system-health');
    const overallHealth = document.getElementById('overall-health');
    const activeSensors = document.getElementById('active-sensors');
    const errorSensors = document.getElementById('error-sensors');
    const unknownSensors = document.getElementById('unknown-sensors');
    
    // Update system health indicator
    if (data.overall_status === 'healthy') {
        systemHealth.textContent = '✅ System gesund';
        systemHealth.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800';
    } else if (data.overall_status === 'degraded') {
        systemHealth.textContent = '⚠️ System beeinträchtigt';
        systemHealth.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800';
    } else {
        systemHealth.textContent = '❌ System fehlerhaft';
        systemHealth.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800';
    }
    
    // Update last update timestamp
    document.getElementById('last-update').textContent = 'Letzte Aktualisierung: ' + new Date().toLocaleTimeString();
}

function updateSensorStats(data) {
    const overallHealth = document.getElementById('overall-health');
    const activeSensors = document.getElementById('active-sensors');
    const errorSensors = document.getElementById('error-sensors');
    const unknownSensors = document.getElementById('unknown-sensors');
    
    if (data && data.total_sensors) {
        overallHealth.textContent = data.overall_health + '%';
        activeSensors.textContent = data.active_sensors + ' / ' + data.total_sensors;
        errorSensors.textContent = data.error_sensors + ' / ' + data.total_sensors;
        unknownSensors.textContent = data.unknown_sensors + ' / ' + data.total_sensors;
        
        // Update critical sensors table
        updateCriticalSensorsTable(data);
    }
}

function updateCriticalSensorsTable(data) {
    const table = document.getElementById('critical-sensors-table');
    table.innerHTML = '';
    
    // Get all sensors from all groups
    let allSensors = [];
    for (const groupName in data.groups) {
        const group = data.groups[groupName];
        if (group.sensors) {
            // Filter for critical sensors (priority 1 or 2)
            const criticalSensors = group.sensors.filter(sensor => 
                sensor.priority <= 2
            );
            allSensors = allSensors.concat(criticalSensors);
        }
    }
    
    // Sort by status (error first, then unknown, then active)
    allSensors.sort((a, b) => {
        const statusOrder = { 'error': 0, 'crc_error': 1, 'timeout': 2, 'unknown': 3, 'active': 4 };
        return statusOrder[a.status] - statusOrder[b.status];
    });
    
    // Take top 5 sensors
    const topSensors = allSensors.slice(0, 5);
    
    // Add rows to table
    topSensors.forEach(sensor => {
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
        statusSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full ';
        
        switch (sensor.status) {
            case 'active':
                statusSpan.classList.add('bg-green-100', 'text-green-800');
                statusSpan.textContent = 'Aktiv';
                break;
            case 'error':
                statusSpan.classList.add('bg-red-100', 'text-red-800');
                statusSpan.textContent = 'Fehler';
                break;
            case 'timeout':
                statusSpan.classList.add('bg-yellow-100', 'text-yellow-800');
                statusSpan.textContent = 'Timeout';
                break;
            case 'crc_error':
                statusSpan.classList.add('bg-orange-100', 'text-orange-800');
                statusSpan.textContent = 'CRC Fehler';
                break;
            default:
                statusSpan.classList.add('bg-gray-100', 'text-gray-800');
                statusSpan.textContent = 'Unbekannt';
        }
        
        statusCell.appendChild(statusSpan);
        row.appendChild(statusCell);
        
        // Last value
        const valueCell = document.createElement('td');
        valueCell.className = 'px-6 py-4 whitespace-nowrap';
        if (sensor.last_reading && sensor.last_reading.value !== null) {
            valueCell.textContent = sensor.last_reading.value;
            if (sensor.unit) {
                valueCell.textContent += ' ' + sensor.unit;
            }
        } else {
            valueCell.textContent = '-';
        }
        row.appendChild(valueCell);
        
        // Timestamp
        const timestampCell = document.createElement('td');
        timestampCell.className = 'px-6 py-4 whitespace-nowrap';
        if (sensor.last_reading && sensor.last_reading.timestamp) {
            const date = new Date(sensor.last_reading.timestamp);
            timestampCell.textContent = date.toLocaleString();
        } else {
            timestampCell.textContent = '-';
        }
        row.appendChild(timestampCell);
        
        // Response time
        const responseCell = document.createElement('td');
        responseCell.className = 'px-6 py-4 whitespace-nowrap';
        if (sensor.last_reading && sensor.last_reading.response_time_ms) {
            responseCell.textContent = sensor.last_reading.response_time_ms.toFixed(2) + ' ms';
        } else {
            responseCell.textContent = '-';
        }
        row.appendChild(responseCell);
        
        table.appendChild(row);
    });
    
    // If no sensors, add a message
    if (topSensors.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 5;
        cell.className = 'px-6 py-4 text-center text-gray-500';
        cell.textContent = 'Keine kritischen Sensoren gefunden';
        row.appendChild(cell);
        table.appendChild(row);
    }
}

function updateMQTTStats(data) {
    if (!data) return;
    
    // Update MQTT stats
    document.getElementById('mqtt-total-messages').textContent = data.message_stats.total_messages;
    document.getElementById('mqtt-recent-messages').textContent = data.message_stats.messages_last_hour;
    document.getElementById('mqtt-success-rate').textContent = data.flow_stats.success_rate + '%';
    document.getElementById('mqtt-response-time').textContent = data.flow_stats.avg_response_time_ms + ' ms';
    
    // Update recent errors
    updateRecentErrors(data.recent_errors);
}

function updateLogStats(data) {
    if (!data) return;
    
    // Update log stats
    document.getElementById('log-total-entries').textContent = data.total_entries;
    document.getElementById('log-error-count').textContent = data.level_breakdown.ERROR || 0;
    document.getElementById('log-error-rate').textContent = data.error_rate + '%';
    document.getElementById('log-avg-duration').textContent = data.performance.avg_duration_ms + ' ms';
}

function updateRecentErrors(errors) {
    const container = document.getElementById('recent-errors');
    container.innerHTML = '';
    
    if (!errors || errors.length === 0) {
        const message = document.createElement('div');
        message.className = 'text-gray-500 text-center py-4';
        message.textContent = 'Keine aktuellen Fehler';
        container.appendChild(message);
        return;
    }
    
    errors.forEach(error => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'p-4 border rounded-lg mb-2 ' + 
            (error.type === 'communication_error' ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50');
        
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-2';
        
        const title = document.createElement('h4');
        title.className = 'font-semibold';
        title.textContent = error.type === 'communication_error' ? 'Kommunikationsfehler' : 'Konvertierungsfehler';
        
        const time = document.createElement('span');
        time.className = 'text-sm text-gray-500';
        const date = new Date(error.timestamp);
        time.textContent = date.toLocaleString();
        
        header.appendChild(title);
        header.appendChild(time);
        
        const content = document.createElement('div');
        content.className = 'text-sm';
        
        const sensor = document.createElement('div');
        sensor.className = 'mb-1';
        sensor.innerHTML = '<span class="font-medium">Sensor:</span> ' + error.sensor;
        
        const message = document.createElement('div');
        message.className = 'mb-1';
        message.innerHTML = '<span class="font-medium">Nachricht:</span> ' + error.message;
        
        const details = document.createElement('div');
        details.className = 'text-xs text-gray-600';
        details.innerHTML = '<span class="font-medium">Details:</span> ' + error.details;
        
        content.appendChild(sensor);
        content.appendChild(message);
        content.appendChild(details);
        
        errorDiv.appendChild(header);
        errorDiv.appendChild(content);
        
        container.appendChild(errorDiv);
    });
}

function loadSensorsData() {
    console.log('Loading sensors data...');
    
    fetch('/api/sensors/status')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateSensorsTable(data.data);
                populateGroupFilter(data.data);
            } else {
                console.error('Error loading sensors data:', data.error);
            }
        })
        .catch(error => {
            console.error('Error loading sensors data:', error);
        });
}

function populateSensorsTable(data) {
    const table = document.getElementById('sensors-table');
    table.innerHTML = '';
    
    // Get all sensors from all groups
    let allSensors = [];
    for (const groupName in data.groups) {
        const group = data.groups[groupName];
        if (group.sensors) {
            allSensors = allSensors.concat(group.sensors);
        }
    }
    
    // Apply filters
    const groupFilter = document.getElementById('group-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    
    let filteredSensors = allSensors;
    
    if (groupFilter !== 'all') {
        filteredSensors = filteredSensors.filter(sensor => sensor.group === groupFilter);
    }
    
    if (statusFilter !== 'all') {
        filteredSensors = filteredSensors.filter(sensor => sensor.status === statusFilter);
    }
    
    // Sort by priority, then by name
    filteredSensors.sort((a, b) => {
        if (a.priority !== b.priority) {
            return a.priority - b.priority;
        }
        return a.name.localeCompare(b.name);
    });
    
    // Add rows to table
    filteredSensors.forEach(sensor => {
        const row = document.createElement('tr');
        row.className = 'priority-' + sensor.priority;
        
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
        groupCell.textContent = sensor.group;
        row.appendChild(groupCell);
        
        // Status
        const statusCell = document.createElement('td');
        statusCell.className = 'px-6 py-4 whitespace-nowrap';
        const statusSpan = document.createElement('span');
        statusSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full status-' + sensor.status;
        
        switch (sensor.status) {
            case 'active':
                statusSpan.textContent = 'Aktiv';
                break;
            case 'error':
                statusSpan.textContent = 'Fehler';
                break;
            case 'timeout':
                statusSpan.textContent = 'Timeout';
                break;
            case 'crc_error':
                statusSpan.textContent = 'CRC Fehler';
                break;
            default:
                statusSpan.textContent = 'Unbekannt';
        }
        
        statusCell.appendChild(statusSpan);
        row.appendChild(statusCell);
        
        // Last value
        const valueCell = document.createElement('td');
        valueCell.className = 'px-6 py-4 whitespace-nowrap';
        if (sensor.last_reading && sensor.last_reading.value !== null) {
            valueCell.textContent = sensor.last_reading.value;
            if (sensor.unit) {
                valueCell.textContent += ' ' + sensor.unit;
            }
        } else {
            valueCell.textContent = '-';
        }
        row.appendChild(valueCell);
        
        // Timestamp
        const timestampCell = document.createElement('td');
        timestampCell.className = 'px-6 py-4 whitespace-nowrap';
        if (sensor.last_reading && sensor.last_reading.timestamp) {
            const date = new Date(sensor.last_reading.timestamp);
            timestampCell.textContent = date.toLocaleString();
        } else {
            timestampCell.textContent = '-';
        }
        row.appendChild(timestampCell);
        
        // Actions
        const actionsCell = document.createElement('td');
        actionsCell.className = 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium';
        
        const detailsButton = document.createElement('button');
        detailsButton.className = 'text-blue-600 hover:text-blue-900 mr-2';
        detailsButton.textContent = 'Details';
        detailsButton.addEventListener('click', () => showSensorDetails(sensor));
        
        actionsCell.appendChild(detailsButton);
        
        row.appendChild(actionsCell);
        
        table.appendChild(row);
    });
    
    // If no sensors, add a message
    if (filteredSensors.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 7;
        cell.className = 'px-6 py-4 text-center text-gray-500';
        cell.textContent = 'Keine Sensoren gefunden';
        row.appendChild(cell);
        table.appendChild(row);
    }
}

function populateGroupFilter(data) {
    const groupFilter = document.getElementById('group-filter');
    
    // Clear existing options except "all"
    while (groupFilter.options.length > 1) {
        groupFilter.remove(1);
    }
    
    // Add group options
    const groups = new Set();
    for (const groupName in data.groups) {
        groups.add(groupName);
    }
    
    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        groupFilter.appendChild(option);
    });
}

function filterSensors() {
    loadSensorsData();
}

function showSensorDetails(sensor) {
    // Populate modal with sensor details
    document.getElementById('modal-sensor-name').textContent = sensor.name;
    document.getElementById('modal-description').textContent = sensor.description || '-';
    document.getElementById('modal-group').textContent = sensor.group;
    document.getElementById('modal-priority').textContent = sensor.priority;
    document.getElementById('modal-polling').textContent = sensor.polling_interval + ' s';
    document.getElementById('modal-enabled').textContent = sensor.enabled ? 'Ja' : 'Nein';
    document.getElementById('modal-writable').textContent = sensor.writable ? 'Ja' : 'Nein';
    document.getElementById('modal-address').textContent = sensor.nasa_address || '-';
    document.getElementById('modal-entity-id').textContent = sensor.hass_entity_id || '-';
    
    document.getElementById('modal-status').textContent = sensor.status;
    document.getElementById('modal-status').className = 'font-semibold status-' + sensor.status;
    
    if (sensor.last_reading && sensor.last_reading.value !== null) {
        let valueText = sensor.last_reading.value;
        if (sensor.unit) {
            valueText += ' ' + sensor.unit;
        }
        document.getElementById('modal-last-value').textContent = valueText;
    } else {
        document.getElementById('modal-last-value').textContent = '-';
    }
    
    if (sensor.last_reading && sensor.last_reading.timestamp) {
        const date = new Date(sensor.last_reading.timestamp);
        document.getElementById('modal-timestamp').textContent = date.toLocaleString();
    } else {
        document.getElementById('modal-timestamp').textContent = '-';
    }
    
    if (sensor.last_reading && sensor.last_reading.response_time_ms) {
        document.getElementById('modal-response-time').textContent = sensor.last_reading.response_time_ms.toFixed(2) + ' ms';
    } else {
        document.getElementById('modal-response-time').textContent = '-';
    }
    
    document.getElementById('modal-success-rate').textContent = sensor.statistics.success_rate + '%';
    document.getElementById('modal-error-count').textContent = sensor.statistics.error_count;
    
    // Set up form fields for editing
    document.getElementById('modal-input-polling').value = sensor.polling_interval;
    document.getElementById('modal-input-priority').value = sensor.priority;
    document.getElementById('modal-input-enabled').checked = sensor.enabled;
    
    // Load MQTT history
    loadSensorMQTTHistory(sensor.name);
    
    // Show modal
    document.getElementById('sensor-details-modal').classList.remove('hidden');
}

function loadSensorMQTTHistory(sensorName) {
    const historyContainer = document.getElementById('modal-mqtt-history');
    historyContainer.innerHTML = '<div class="text-center py-4">Lade MQTT-Historie...</div>';
    
    fetch(`/api/mqtt/history/${sensorName}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displaySensorMQTTHistory(data.data);
            } else {
                historyContainer.innerHTML = `<div class="text-center py-4 text-red-500">Fehler: ${data.error}</div>`;
            }
        })
        .catch(error => {
            historyContainer.innerHTML = `<div class="text-center py-4 text-red-500">Fehler beim Laden der MQTT-Historie: ${error}</div>`;
        });
}

function displaySensorMQTTHistory(data) {
    const historyContainer = document.getElementById('modal-mqtt-history');
    historyContainer.innerHTML = '';
    
    if (!data.communication_flows || data.communication_flows.length === 0) {
        historyContainer.innerHTML = '<div class="text-center py-4 text-gray-500">Keine MQTT-Kommunikation in den letzten 24 Stunden</div>';
        return;
    }
    
    // Create table
    const table = document.createElement('table');
    table.className = 'min-w-full divide-y divide-gray-200';
    
    // Create header
    const thead = document.createElement('thead');
    thead.className = 'bg-gray-50';
    
    const headerRow = document.createElement('tr');
    
    const headers = ['Zeitstempel', 'Typ', 'Initiiert von', 'SET-Wert', 'STATE-Wert', 'Antwortzeit', 'Status'];
    
    headers.forEach(header => {
        const th = document.createElement('th');
        th.className = 'px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
        th.textContent = header;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create body
    const tbody = document.createElement('tbody');
    tbody.className = 'bg-white divide-y divide-gray-200';
    
    data.communication_flows.forEach(flow => {
        const row = document.createElement('tr');
        
        // Timestamp
        const timestampCell = document.createElement('td');
        timestampCell.className = 'px-3 py-2 whitespace-nowrap text-xs';
        const date = new Date(flow.timestamp);
        timestampCell.textContent = date.toLocaleString();
        row.appendChild(timestampCell);
        
        // Type
        const typeCell = document.createElement('td');
        typeCell.className = 'px-3 py-2 whitespace-nowrap text-xs';
        typeCell.textContent = flow.initiated_by === 'home_assistant' ? 'SET → STATE' : 'STATE';
        row.appendChild(typeCell);
        
        // Initiated by
        const initiatedCell = document.createElement('td');
        initiatedCell.className = 'px-3 py-2 whitespace-nowrap text-xs';
        initiatedCell.textContent = flow.initiated_by === 'home_assistant' ? 'Home Assistant' : 'EHS-Sentinel';
        row.appendChild(initiatedCell);
        
        // SET value
        const setValueCell = document.createElement('td');
        setValueCell.className = 'px-3 py-2 whitespace-nowrap text-xs';
        setValueCell.textContent = flow.set_value !== null ? flow.set_value : '-';
        row.appendChild(setValueCell);
        
        // STATE value
        const stateValueCell = document.createElement('td');
        stateValueCell.className = 'px-3 py-2 whitespace-nowrap text-xs';
        stateValueCell.textContent = flow.state_value !== null ? flow.state_value : '-';
        row.appendChild(stateValueCell);
        
        // Response time
        const responseTimeCell = document.createElement('td');
        responseTimeCell.className = 'px-3 py-2 whitespace-nowrap text-xs';
        responseTimeCell.textContent = flow.response_time_ms ? flow.response_time_ms.toFixed(2) + ' ms' : '-';
        row.appendChild(responseTimeCell);
        
        // Status
        const statusCell = document.createElement('td');
        statusCell.className = 'px-3 py-2 whitespace-nowrap text-xs';
        
        if (flow.success) {
            statusCell.innerHTML = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Erfolg</span>';
        } else {
            statusCell.innerHTML = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Fehler</span>';
        }
        
        row.appendChild(statusCell);
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    historyContainer.appendChild(table);
}

function loadMQTTData() {
    console.log('Loading MQTT data...');
    
    // Load MQTT stats
    fetch('/api/mqtt/stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateMQTTStatsDisplay(data.data);
            } else {
                console.error('Error loading MQTT data:', data.error);
            }
        })
        .catch(error => {
            console.error('Error loading MQTT data:', error);
        });
    
    // Load sensors for filter
    fetch('/api/sensors/status')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateMQTTSensorFilter(data.data);
            } else {
                console.error('Error loading sensors for MQTT filter:', data.error);
            }
        })
        .catch(error => {
            console.error('Error loading sensors for MQTT filter:', error);
        });
}

function updateMQTTStatsDisplay(data) {
    // Update message stats
    document.getElementById('mqtt-stats-total').textContent = data.message_stats.total_messages;
    document.getElementById('mqtt-stats-hour').textContent = data.message_stats.messages_last_hour;
    document.getElementById('mqtt-stats-pending').textContent = data.message_stats.pending_commands;
    
    // Update conversion stats
    document.getElementById('mqtt-stats-conv-success').textContent = data.conversion_stats.successful_conversions;
    document.getElementById('mqtt-stats-conv-failed').textContent = data.conversion_stats.failed_conversions;
    document.getElementById('mqtt-stats-conv-rate').textContent = data.conversion_stats.conversion_success_rate + '%';
    
    // Update flow stats
    document.getElementById('mqtt-stats-flow-total').textContent = data.flow_stats.total_flows;
    document.getElementById('mqtt-stats-flow-success').textContent = data.flow_stats.successful_flows;
    document.getElementById('mqtt-stats-flow-rate').textContent = data.flow_stats.success_rate + '%';
    document.getElementById('mqtt-stats-flow-time').textContent = data.flow_stats.avg_response_time_ms + ' ms';
    
    // Update recent errors
    updateMQTTRecentErrors(data.recent_errors);
}

function updateMQTTRecentErrors(errors) {
    const container = document.getElementById('mqtt-recent-errors');
    container.innerHTML = '';
    
    if (!errors || errors.length === 0) {
        const message = document.createElement('div');
        message.className = 'text-gray-500 text-center py-4';
        message.textContent = 'Keine aktuellen Fehler';
        container.appendChild(message);
        return;
    }
    
    errors.forEach(error => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'p-4 border rounded-lg mb-2 ' + 
            (error.type === 'communication_error' ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50');
        
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-2';
        
        const title = document.createElement('h4');
        title.className = 'font-semibold';
        title.textContent = error.type === 'communication_error' ? 'Kommunikationsfehler' : 'Konvertierungsfehler';
        
        const time = document.createElement('span');
        time.className = 'text-sm text-gray-500';
        const date = new Date(error.timestamp);
        time.textContent = date.toLocaleString();
        
        header.appendChild(title);
        header.appendChild(time);
        
        const content = document.createElement('div');
        content.className = 'text-sm';
        
        const sensor = document.createElement('div');
        sensor.className = 'mb-1';
        sensor.innerHTML = '<span class="font-medium">Sensor:</span> ' + error.sensor;
        
        const message = document.createElement('div');
        message.className = 'mb-1';
        message.innerHTML = '<span class="font-medium">Nachricht:</span> ' + error.message;
        
        const details = document.createElement('div');
        details.className = 'text-xs text-gray-600';
        details.innerHTML = '<span class="font-medium">Details:</span> ' + error.details;
        
        content.appendChild(sensor);
        content.appendChild(message);
        content.appendChild(details);
        
        errorDiv.appendChild(header);
        errorDiv.appendChild(content);
        
        container.appendChild(errorDiv);
    });
}

function populateMQTTSensorFilter(data) {
    const sensorFilter = document.getElementById('mqtt-sensor-filter');
    
    // Clear existing options except empty option
    while (sensorFilter.options.length > 1) {
        sensorFilter.remove(1);
    }
    
    // Get all sensors from all groups
    let allSensors = [];
    for (const groupName in data.groups) {
        const group = data.groups[groupName];
        if (group.sensors) {
            allSensors = allSensors.concat(group.sensors);
        }
    }
    
    // Sort by name
    allSensors.sort((a, b) => a.name.localeCompare(b.name));
    
    // Add sensor options
    allSensors.forEach(sensor => {
        const option = document.createElement('option');
        option.value = sensor.name;
        option.textContent = sensor.name;
        sensorFilter.appendChild(option);
    });
}

function loadMQTTHistory() {
    const sensorName = document.getElementById('mqtt-sensor-filter').value;
    if (!sensorName) return;
    
    const historyTable = document.getElementById('mqtt-history-table');
    historyTable.innerHTML = '<tr><td colspan="7" class="text-center py-4">Lade MQTT-Historie...</td></tr>';
    
    fetch(`/api/mqtt/history/${sensorName}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayMQTTHistory(data.data);
            } else {
                historyTable.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-red-500">Fehler: ${data.error}</td></tr>`;
            }
        })
        .catch(error => {
            historyTable.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-red-500">Fehler beim Laden der MQTT-Historie: ${error}</td></tr>`;
        });
}

function displayMQTTHistory(data) {
    const historyTable = document.getElementById('mqtt-history-table');
    historyTable.innerHTML = '';
    
    if (!data.communication_flows || data.communication_flows.length === 0) {
        historyTable.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">Keine MQTT-Kommunikation in den letzten 24 Stunden</td></tr>';
        return;
    }
    
    data.communication_flows.forEach(flow => {
        const row = document.createElement('tr');
        
        // Timestamp
        const timestampCell = document.createElement('td');
        timestampCell.className = 'px-6 py-3 text-sm';
        const date = new Date(flow.timestamp);
        timestampCell.textContent = date.toLocaleString();
        row.appendChild(timestampCell);
        
        // Type
        const typeCell = document.createElement('td');
        typeCell.className = 'px-6 py-3 text-sm';
        typeCell.textContent = flow.initiated_by === 'home_assistant' ? 'SET → STATE' : 'STATE';
        row.appendChild(typeCell);
        
        // Initiated by
        const initiatedCell = document.createElement('td');
        initiatedCell.className = 'px-6 py-3 text-sm';
        initiatedCell.textContent = flow.initiated_by === 'home_assistant' ? 'Home Assistant' : 'EHS-Sentinel';
        row.appendChild(initiatedCell);
        
        // SET value
        const setValueCell = document.createElement('td');
        setValueCell.className = 'px-6 py-3 text-sm';
        setValueCell.textContent = flow.set_value !== null ? flow.set_value : '-';
        row.appendChild(setValueCell);
        
        // STATE value
        const stateValueCell = document.createElement('td');
        stateValueCell.className = 'px-6 py-3 text-sm';
        stateValueCell.textContent = flow.state_value !== null ? flow.state_value : '-';
        row.appendChild(stateValueCell);
        
        // Response time
        const responseTimeCell = document.createElement('td');
        responseTimeCell.className = 'px-6 py-3 text-sm';
        responseTimeCell.textContent = flow.response_time_ms ? flow.response_time_ms.toFixed(2) + ' ms' : '-';
        row.appendChild(responseTimeCell);
        
        // Status
        const statusCell = document.createElement('td');
        statusCell.className = 'px-6 py-3 text-sm';
        
        if (flow.success) {
            statusCell.innerHTML = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Erfolg</span>';
        } else {
            statusCell.innerHTML = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Fehler</span>';
        }
        
        row.appendChild(statusCell);
        
        historyTable.appendChild(row);
    });
}

function loadLogsData() {
    console.log('Loading logs data...');
    
    // Load log stats
    fetch('/api/logs/stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateLogStatsDisplay(data.data);
            } else {
                console.error('Error loading log stats:', data.error);
            }
        })
        .catch(error => {
            console.error('Error loading log stats:', error);
        });
    
    // Load sensors for filter
    fetch('/api/sensors/status')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateLogSensorFilter(data.data);
            } else {
                console.error('Error loading sensors for log filter:', data.error);
            }
        })
        .catch(error => {
            console.error('Error loading sensors for log filter:', error);
        });
    
    // Load initial logs
    loadLogEntries();
}

function updateLogStatsDisplay(data) {
    // Update level stats
    const levelStatsContainer = document.getElementById('log-stats-level');
    levelStatsContainer.innerHTML = '';
    
    for (const level in data.level_breakdown) {
        const count = data.level_breakdown[level];
        const percentage = (count / data.total_entries * 100).toFixed(1);
        
        const levelDiv = document.createElement('div');
        levelDiv.className = 'flex justify-between items-center';
        
        const label = document.createElement('span');
        label.textContent = level;
        
        const value = document.createElement('span');
        value.className = 'font-semibold';
        value.textContent = `${count} (${percentage}%)`;
        
        levelDiv.appendChild(label);
        levelDiv.appendChild(value);
        
        levelStatsContainer.appendChild(levelDiv);
    }
    
    // Update category stats
    const categoryStatsContainer = document.getElementById('log-stats-category');
    categoryStatsContainer.innerHTML = '';
    
    for (const category in data.category_breakdown) {
        const count = data.category_breakdown[category];
        const percentage = (count / data.total_entries * 100).toFixed(1);
        
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'flex justify-between items-center';
        
        const label = document.createElement('span');
        label.textContent = category;
        
        const value = document.createElement('span');
        value.className = 'font-semibold';
        value.textContent = `${count} (${percentage}%)`;
        
        categoryDiv.appendChild(label);
        categoryDiv.appendChild(value);
        
        categoryStatsContainer.appendChild(categoryDiv);
    }
    
    // Update sensor stats
    const sensorStatsContainer = document.getElementById('log-stats-sensors');
    sensorStatsContainer.innerHTML = '';
    
    // Get top 5 sensors with errors
    const sensorErrors = [];
    for (const sensor in data.sensor_breakdown) {
        const sensorData = data.sensor_breakdown[sensor];
        if (sensorData.errors > 0) {
            sensorErrors.push({
                name: sensor,
                errors: sensorData.errors,
                total: sensorData.total,
                error_rate: (sensorData.errors / sensorData.total * 100).toFixed(1)
            });
        }
    }
    
    sensorErrors.sort((a, b) => b.errors - a.errors);
    const topSensorErrors = sensorErrors.slice(0, 5);
    
    if (topSensorErrors.length === 0) {
        const noErrorsDiv = document.createElement('div');
        noErrorsDiv.className = 'text-center text-gray-500 py-2';
        noErrorsDiv.textContent = 'Keine Sensorfehler in den letzten 24 Stunden';
        sensorStatsContainer.appendChild(noErrorsDiv);
    } else {
        topSensorErrors.forEach(sensor => {
            const sensorDiv = document.createElement('div');
            sensorDiv.className = 'flex justify-between items-center mb-1';
            
            const label = document.createElement('span');
            label.textContent = sensor.name;
            
            const value = document.createElement('span');
            value.className = 'font-semibold';
            value.textContent = `${sensor.errors} Fehler (${sensor.error_rate}%)`;
            
            sensorDiv.appendChild(label);
            sensorDiv.appendChild(value);
            
            sensorStatsContainer.appendChild(sensorDiv);
        });
    }
}

function populateLogSensorFilter(data) {
    const sensorFilter = document.getElementById('log-filter-sensor');
    
    // Clear existing options except empty option
    while (sensorFilter.options.length > 1) {
        sensorFilter.remove(1);
    }
    
    // Get all sensors from all groups
    let allSensors = [];
    for (const groupName in data.groups) {
        const group = data.groups[groupName];
        if (group.sensors) {
            allSensors = allSensors.concat(group.sensors);
        }
    }
    
    // Sort by name
    allSensors.sort((a, b) => a.name.localeCompare(b.name));
    
    // Add sensor options
    allSensors.forEach(sensor => {
        const option = document.createElement('option');
        option.value = sensor.name;
        option.textContent = sensor.name;
        sensorFilter.appendChild(option);
    });
}

function loadLogEntries(append = false) {
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
    if (startTime) queryParams.append('start_time', new Date(startTime).toISOString());
    if (endTime) queryParams.append('end_time', new Date(endTime).toISOString());
    if (errorsOnly) queryParams.append('errors_only', 'true');
    
    // Set limit and offset
    const limit = 50;
    const offset = append ? document.querySelectorAll('#log-entries-table tr').length : 0;
    queryParams.append('limit', limit);
    if (offset > 0) queryParams.append('offset', offset);
    
    // Fetch logs
    fetch(`/api/logs?${queryParams.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayLogEntries(data.data, append);
            } else {
                console.error('Error loading logs:', data.error);
                const table = document.getElementById('log-entries-table');
                table.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Fehler: ${data.error}</td></tr>`;
            }
        })
        .catch(error => {
            console.error('Error loading logs:', error);
            const table = document.getElementById('log-entries-table');
            table.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Fehler beim Laden der Logs: ${error}</td></tr>`;
        });
}

function displayLogEntries(data, append = false) {
    const table = document.getElementById('log-entries-table');
    
    if (!append) {
        table.innerHTML = '';
    }
    
    if (!data.logs || data.logs.length === 0) {
        if (!append) {
            table.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">Keine Logs gefunden</td></tr>';
        }
        
        // Hide load more button if no more logs
        document.getElementById('load-more-logs').classList.add('hidden');
        return;
    }
    
    data.logs.forEach(log => {
        const row = document.createElement('tr');
        
        // Timestamp
        const timestampCell = document.createElement('td');
        timestampCell.className = 'px-6 py-3 text-sm';
        const date = new Date(log.timestamp);
        timestampCell.textContent = date.toLocaleString();
        row.appendChild(timestampCell);
        
        // Level
        const levelCell = document.createElement('td');
        levelCell.className = 'px-6 py-3 text-sm';
        const levelSpan = document.createElement('span');
        levelSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full ';
        
        switch (log.level) {
            case 'DEBUG':
                levelSpan.classList.add('bg-gray-100', 'text-gray-800');
                break;
            case 'INFO':
                levelSpan.classList.add('bg-blue-100', 'text-blue-800');
                break;
            case 'WARNING':
                levelSpan.classList.add('bg-yellow-100', 'text-yellow-800');
                break;
            case 'ERROR':
                levelSpan.classList.add('bg-red-100', 'text-red-800');
                break;
            case 'CRITICAL':
                levelSpan.classList.add('bg-red-100', 'text-red-800', 'font-bold');
                break;
        }
        
        levelSpan.textContent = log.level;
        levelCell.appendChild(levelSpan);
        row.appendChild(levelCell);
        
        // Category
        const categoryCell = document.createElement('td');
        categoryCell.className = 'px-6 py-3 text-sm';
        categoryCell.textContent = log.category;
        row.appendChild(categoryCell);
        
        // Sensor
        const sensorCell = document.createElement('td');
        sensorCell.className = 'px-6 py-3 text-sm';
        sensorCell.textContent = log.sensor_name || '-';
        row.appendChild(sensorCell);
        
        // Message
        const messageCell = document.createElement('td');
        messageCell.className = 'px-6 py-3 text-sm';
        messageCell.textContent = log.message;
        row.appendChild(messageCell);
        
        // Details
        const detailsCell = document.createElement('td');
        detailsCell.className = 'px-6 py-3 text-sm';
        
        if (log.details && Object.keys(log.details).length > 0) {
            const detailsButton = document.createElement('button');
            detailsButton.className = 'text-blue-600 hover:text-blue-900';
            detailsButton.textContent = 'Details anzeigen';
            
            detailsButton.addEventListener('click', () => {
                alert(JSON.stringify(log.details, null, 2));
            });
            
            detailsCell.appendChild(detailsButton);
        } else {
            detailsCell.textContent = '-';
        }
        
        row.appendChild(detailsCell);
        
        table.appendChild(row);
    });
    
    // Show/hide load more button
    if (data.logs.length < 50) {
        document.getElementById('load-more-logs').classList.add('hidden');
    } else {
        document.getElementById('load-more-logs').classList.remove('hidden');
    }
}

function applyLogFilters() {
    loadLogEntries(false);
}

function loadMoreLogs() {
    loadLogEntries(true);
}

function exportLogs() {
    // Get filter values
    const level = document.getElementById('log-filter-level').value;
    const category = document.getElementById('log-filter-category').value;
    const sensor = document.getElementById('log-filter-sensor').value;
    const startTime = document.getElementById('log-filter-start').value;
    const endTime = document.getElementById('log-filter-end').value;
    const errorsOnly = document.getElementById('log-filter-errors').checked;
    const format = 'json'; // or 'csv'
    
    // Build query string
    let queryParams = new URLSearchParams();
    if (level) queryParams.append('level', level);
    if (category) queryParams.append('category', category);
    if (sensor) queryParams.append('sensor_name', sensor);
    if (startTime) queryParams.append('start_time', new Date(startTime).toISOString());
    if (endTime) queryParams.append('end_time', new Date(endTime).toISOString());
    if (errorsOnly) queryParams.append('errors_only', 'true');
    queryParams.append('format', format);
    
    // Open download URL
    window.open(`/api/logs/export?${queryParams.toString()}`);
}

function loadConfigData() {
    console.log('Loading configuration data...');
    
    fetch('/api/config/ui')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayConfigData(data.data);
            } else {
                console.error('Error loading configuration:', data.error);
            }
        })
        .catch(error => {
            console.error('Error loading configuration:', error);
        });
}

function displayConfigData(data) {
    // Populate group configuration table
    const groupTable = document.getElementById('group-config-table');
    groupTable.innerHTML = '';
    
    for (const groupName in data.groups) {
        const group = data.groups[groupName];
        
        const row = document.createElement('tr');
        
        // Group name
        const nameCell = document.createElement('td');
        nameCell.className = 'px-6 py-3 text-sm';
        nameCell.textContent = groupName;
        row.appendChild(nameCell);
        
        // Description
        const descCell = document.createElement('td');
        descCell.className = 'px-6 py-3 text-sm';
        descCell.textContent = group.description;
        row.appendChild(descCell);
        
        // Priority
        const priorityCell = document.createElement('td');
        priorityCell.className = 'px-6 py-3 text-sm';
        priorityCell.textContent = group.priority;
        row.appendChild(priorityCell);
        
        // Polling interval
        const pollingCell = document.createElement('td');
        pollingCell.className = 'px-6 py-3 text-sm';
        pollingCell.textContent = group.default_polling_interval + ' s';
        row.appendChild(pollingCell);
        
        // Sensor count
        const countCell = document.createElement('td');
        countCell.className = 'px-6 py-3 text-sm';
        countCell.textContent = group.parameter_count;
        row.appendChild(countCell);
        
        // Status
        const statusCell = document.createElement('td');
        statusCell.className = 'px-6 py-3 text-sm';
        
        const statusSpan = document.createElement('span');
        statusSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full ';
        
        if (group.enabled) {
            statusSpan.classList.add('bg-green-100', 'text-green-800');
            statusSpan.textContent = 'Aktiviert';
        } else {
            statusSpan.classList.add('bg-gray-100', 'text-gray-800');
            statusSpan.textContent = 'Deaktiviert';
        }
        
        statusCell.appendChild(statusSpan);
        row.appendChild(statusCell);
        
        // Actions
        const actionsCell = document.createElement('td');
        actionsCell.className = 'px-6 py-3 text-sm text-right';
        
        const editButton = document.createElement('button');
        editButton.className = 'text-blue-600 hover:text-blue-900';
        editButton.textContent = 'Bearbeiten';
        editButton.addEventListener('click', () => showGroupEditModal(groupName, group));
        
        actionsCell.appendChild(editButton);
        row.appendChild(actionsCell);
        
        groupTable.appendChild(row);
    }
    
    // Populate parameter configuration table
    const paramTable = document.getElementById('parameter-config-table');
    paramTable.innerHTML = '';
    
    // Populate group filter
    const groupFilter = document.getElementById('config-group-filter');
    
    // Clear existing options except "all"
    while (groupFilter.options.length > 1) {
        groupFilter.remove(1);
    }
    
    // Add group options
    for (const groupName in data.groups) {
        const option = document.createElement('option');
        option.value = groupName;
        option.textContent = data.groups[groupName].display_name || groupName;
        groupFilter.appendChild(option);
    }
    
    // Add parameters
    for (const paramName in data.parameters) {
        const param = data.parameters[paramName];
        
        // Apply group filter
        const selectedGroup = groupFilter.value;
        if (selectedGroup !== 'all' && param.group !== selectedGroup) {
            continue;
        }
        
        const row = document.createElement('tr');
        
        // Parameter name
        const nameCell = document.createElement('td');
        nameCell.className = 'px-6 py-3 text-sm';
        nameCell.textContent = paramName;
        row.appendChild(nameCell);
        
        // Description
        const descCell = document.createElement('td');
        descCell.className = 'px-6 py-3 text-sm';
        descCell.textContent = param.display_name;
        row.appendChild(descCell);
        
        // Type
        const typeCell = document.createElement('td');
        typeCell.className = 'px-6 py-3 text-sm';
        typeCell.textContent = param.type;
        row.appendChild(typeCell);
        
        // Group
        const groupCell = document.createElement('td');
        groupCell.className = 'px-6 py-3 text-sm';
        groupCell.textContent = param.group;
        row.appendChild(groupCell);
        
        // Polling interval
        const pollingCell = document.createElement('td');
        pollingCell.className = 'px-6 py-3 text-sm';
        pollingCell.textContent = param.polling_interval + ' s';
        row.appendChild(pollingCell);
        
        // Priority
        const priorityCell = document.createElement('td');
        priorityCell.className = 'px-6 py-3 text-sm';
        priorityCell.textContent = param.priority;
        row.appendChild(priorityCell);
        
        // Enabled
        const enabledCell = document.createElement('td');
        enabledCell.className = 'px-6 py-3 text-sm';
        
        const enabledSpan = document.createElement('span');
        enabledSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full ';
        
        if (param.enabled) {
            enabledSpan.classList.add('bg-green-100', 'text-green-800');
            enabledSpan.textContent = 'Ja';
        } else {
            enabledSpan.classList.add('bg-gray-100', 'text-gray-800');
            enabledSpan.textContent = 'Nein';
        }
        
        enabledCell.appendChild(enabledSpan);
        row.appendChild(enabledCell);
        
        // Actions
        const actionsCell = document.createElement('td');
        actionsCell.className = 'px-6 py-3 text-sm text-right';
        
        const editButton = document.createElement('button');
        editButton.className = 'text-blue-600 hover:text-blue-900';
        editButton.textContent = 'Bearbeiten';
        editButton.addEventListener('click', () => showParameterEditModal(paramName, param));
        
        actionsCell.appendChild(editButton);
        row.appendChild(actionsCell);
        
        paramTable.appendChild(row);
    }
}

function showGroupEditModal(groupName, group) {
    // Populate modal
    document.getElementById('group-modal-name').textContent = group.display_name || groupName;
    document.getElementById('group-modal-polling').value = group.default_polling_interval;
    document.getElementById('group-modal-enabled').checked = group.enabled;
    
    // Set up save button
    document.getElementById('group-modal-save').onclick = function() {
        const updates = {
            default_polling_interval: parseInt(document.getElementById('group-modal-polling').value),
            enabled: document.getElementById('group-modal-enabled').checked
        };
        
        saveGroupConfig(groupName, updates);
    };
    
    // Show modal
    document.getElementById('group-edit-modal').classList.remove('hidden');
}

function saveGroupConfig(groupName, updates) {
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
                
                // Reload config data
                loadConfigData();
                
                // Show success message
                alert('Gruppe erfolgreich aktualisiert');
            } else {
                alert('Fehler: ' + data.error);
            }
        })
        .catch(error => {
            alert('Fehler: ' + error);
        });
}

function showParameterEditModal(paramName, param) {
    // Populate modal
    document.getElementById('modal-sensor-name').textContent = param.display_name || paramName;
    document.getElementById('modal-description').textContent = param.display_name;
    document.getElementById('modal-group').textContent = param.group;
    document.getElementById('modal-priority').textContent = param.priority;
    document.getElementById('modal-polling').textContent = param.polling_interval + ' s';
    document.getElementById('modal-enabled').textContent = param.enabled ? 'Ja' : 'Nein';
    document.getElementById('modal-writable').textContent = param.writable ? 'Ja' : 'Nein';
    document.getElementById('modal-address').textContent = param.nasa_address || '-';
    document.getElementById('modal-entity-id').textContent = param.hass_entity_id || '-';
    
    // Set up form fields
    document.getElementById('modal-input-polling').value = param.polling_interval;
    document.getElementById('modal-input-priority').value = param.priority;
    document.getElementById('modal-input-enabled').checked = param.enabled;
    
    // Set up save button
    document.getElementById('modal-save-config').onclick = function() {
        const updates = {
            polling_interval: parseInt(document.getElementById('modal-input-polling').value),
            priority: parseInt(document.getElementById('modal-input-priority').value),
            enabled: document.getElementById('modal-input-enabled').checked
        };
        
        saveParameterConfig(paramName, updates);
    };
    
    // Show modal
    document.getElementById('sensor-details-modal').classList.remove('hidden');
}

function saveParameterConfig(paramName, updates) {
    fetch(`/api/config/parameter/${paramName}`, {
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
                document.getElementById('sensor-details-modal').classList.add('hidden');
                
                // Reload config data
                loadConfigData();
                
                // Show success message
                alert('Parameter erfolgreich aktualisiert');
            } else {
                alert('Fehler: ' + data.error);
            }
        })
        .catch(error => {
            alert('Fehler: ' + error);
        });
}

function filterParameters() {
    loadConfigData();
}

function loadDocumentation() {
    console.log('Loading documentation...');
    
    // Default to MQTT documentation
    loadSpecificDocumentation('mqtt');
}

function loadSpecificDocumentation(type) {
    fetch(`/api/documentation/${type}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayDocumentation(type, data.data.content);
            } else {
                console.error(`Error loading ${type} documentation:`, data.error);
                document.getElementById(`${type}-doc-content`).innerHTML = `<div class="text-red-500">Fehler beim Laden der Dokumentation: ${data.error}</div>`;
            }
        })
        .catch(error => {
            console.error(`Error loading ${type} documentation:`, error);
            document.getElementById(`${type}-doc-content`).innerHTML = `<div class="text-red-500">Fehler beim Laden der Dokumentation: ${error}</div>`;
        });
}

function displayDocumentation(type, content) {
    // Convert markdown to HTML
    const html = marked.parse(content);
    
    // Display in the appropriate container
    document.getElementById(`${type}-doc-content`).innerHTML = html;
}

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
                alert('Dokumentation erfolgreich generiert');
                
                // Reload documentation
                loadDocumentation();
            } else {
                alert('Fehler: ' + data.error);
            }
        })
        .catch(error => {
            alert('Fehler: ' + error);
        });
}

function initializeTabs() {
    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Show dashboard tab
    document.getElementById('view-dashboard').classList.remove('hidden');
    
    // Set active tab
    document.querySelectorAll('.tab-active').forEach(tab => {
        tab.classList.remove('tab-active');
        tab.classList.add('tab-inactive');
    });
    
    document.getElementById('tab-dashboard').classList.remove('tab-inactive');
    document.getElementById('tab-dashboard').classList.add('tab-active');
    
    // Hide all doc content
    document.querySelectorAll('.doc-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Show MQTT doc tab
    document.getElementById('doc-view-mqtt').classList.remove('hidden');
    
    // Set active doc tab
    document.querySelectorAll('#doc-tab-mqtt, #doc-tab-conversion, #doc-tab-troubleshooting').forEach(tab => {
        tab.classList.remove('tab-active');
        tab.classList.add('tab-inactive');
    });
    
    document.getElementById('doc-tab-mqtt').classList.remove('tab-inactive');
    document.getElementById('doc-tab-mqtt').classList.add('tab-active');
}

function showTab(tabName) {
    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Show selected tab
    document.getElementById('view-' + tabName).classList.remove('hidden');
    
    // Update active tab
    document.querySelectorAll('#tab-dashboard, #tab-sensors, #tab-mqtt, #tab-logs, #tab-config, #tab-docs').forEach(tab => {
        tab.classList.remove('tab-active');
        tab.classList.add('tab-inactive');
    });
    
    document.getElementById('tab-' + tabName).classList.remove('tab-inactive');
    document.getElementById('tab-' + tabName).classList.add('tab-active');
}

function showDocTab(tabName) {
    // Hide all doc content
    document.querySelectorAll('.doc-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Show selected doc tab
    document.getElementById('doc-view-' + tabName).classList.remove('hidden');
    
    // Update active doc tab
    document.querySelectorAll('#doc-tab-mqtt, #doc-tab-conversion, #doc-tab-troubleshooting').forEach(tab => {
        tab.classList.remove('tab-active');
        tab.classList.add('tab-inactive');
    });
    
    document.getElementById('doc-tab-' + tabName).classList.remove('tab-inactive');
    document.getElementById('doc-tab-' + tabName).classList.add('tab-active');
    
    // Load documentation if not already loaded
    if (document.getElementById(`${tabName}-doc-content`).innerHTML === '') {
        loadSpecificDocumentation(tabName);
    }
}