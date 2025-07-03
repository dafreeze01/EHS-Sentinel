// EHS-Sentinel Monitoring UI
// Main JavaScript file

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Global state
let currentSensorData = {};
let currentGroupData = {};
let currentConfigData = {};
let currentMqttData = {};
let currentLogData = {};
let currentDocData = {};

// Current modal state
let currentSensor = null;
let currentGroup = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    setupTabNavigation();
    loadDashboardData();
    setupEventListeners();
    loadDocumentation();
});

// Setup tab navigation
function setupTabNavigation() {
    const tabs = [
        { id: 'tab-dashboard', view: 'view-dashboard' },
        { id: 'tab-sensors', view: 'view-sensors' },
        { id: 'tab-mqtt', view: 'view-mqtt' },
        { id: 'tab-logs', view: 'view-logs' },
        { id: 'tab-config', view: 'view-config' },
        { id: 'tab-docs', view: 'view-docs' }
    ];
    
    tabs.forEach(tab => {
        document.getElementById(tab.id).addEventListener('click', () => {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(el => {
                el.classList.add('hidden');
            });
            
            // Show selected tab content
            document.getElementById(tab.view).classList.remove('hidden');
            
            // Update tab styles
            document.querySelectorAll('[id^="tab-"]').forEach(el => {
                el.classList.remove('tab-active');
                el.classList.add('tab-inactive');
            });
            
            document.getElementById(tab.id).classList.remove('tab-inactive');
            document.getElementById(tab.id).classList.add('tab-active');
            
            // Load data for the selected tab if needed
            if (tab.id === 'tab-sensors') {
                loadSensorsData();
            } else if (tab.id === 'tab-mqtt') {
                loadMqttData();
            } else if (tab.id === 'tab-logs') {
                loadLogsData();
            } else if (tab.id === 'tab-config') {
                loadConfigData();
            }
        });
    });
    
    // Setup documentation tabs
    const docTabs = [
        { id: 'doc-tab-mqtt', view: 'doc-view-mqtt' },
        { id: 'doc-tab-conversion', view: 'doc-view-conversion' },
        { id: 'doc-tab-troubleshooting', view: 'doc-view-troubleshooting' }
    ];
    
    docTabs.forEach(tab => {
        document.getElementById(tab.id).addEventListener('click', () => {
            // Hide all doc contents
            document.querySelectorAll('.doc-content').forEach(el => {
                el.classList.add('hidden');
            });
            
            // Show selected doc content
            document.getElementById(tab.view).classList.remove('hidden');
            
            // Update tab styles
            document.querySelectorAll('[id^="doc-tab-"]').forEach(el => {
                el.classList.remove('tab-active');
                el.classList.add('tab-inactive');
            });
            
            document.getElementById(tab.id).classList.remove('tab-inactive');
            document.getElementById(tab.id).classList.add('tab-active');
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Refresh buttons
    document.getElementById('refresh-sensors').addEventListener('click', loadSensorsData);
    document.getElementById('refresh-mqtt').addEventListener('click', loadMqttData);
    document.getElementById('refresh-logs').addEventListener('click', loadLogsData);
    document.getElementById('refresh-config').addEventListener('click', loadConfigData);
    
    // Modal close buttons
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('sensor-details-modal').classList.add('hidden');
    });
    
    document.getElementById('close-group-modal').addEventListener('click', () => {
        document.getElementById('group-edit-modal').classList.add('hidden');
    });
    
    // Modal save buttons
    document.getElementById('modal-save-config').addEventListener('click', saveSensorConfig);
    document.getElementById('group-modal-save').addEventListener('click', saveGroupConfig);
    
    // MQTT history load button
    document.getElementById('mqtt-load-history').addEventListener('click', loadMqttHistory);
    
    // Log filters
    document.getElementById('apply-log-filters').addEventListener('click', applyLogFilters);
    document.getElementById('load-more-logs').addEventListener('click', loadMoreLogs);
    document.getElementById('export-logs').addEventListener('click', exportLogs);
    
    // Documentation generation
    document.getElementById('generate-docs').addEventListener('click', generateDocumentation);
    
    // Group filter for sensors
    document.getElementById('group-filter').addEventListener('change', filterSensors);
    document.getElementById('status-filter').addEventListener('change', filterSensors);
    
    // Group filter for config
    document.getElementById('config-group-filter').addEventListener('change', filterParameters);
}

// Load dashboard data
function loadDashboardData() {
    // Load system overview
    fetch(`${API_BASE_URL}/sensors/status`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateSystemOverview(data.data);
                updateCriticalSensors(data.data);
            }
        })
        .catch(error => console.error('Error loading system overview:', error));
    
    // Load MQTT stats
    fetch(`${API_BASE_URL}/mqtt/stats`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateMqttStats(data.data);
                updateRecentErrors(data.data.recent_errors);
            }
        })
        .catch(error => console.error('Error loading MQTT stats:', error));
    
    // Load log stats
    fetch(`${API_BASE_URL}/logs/stats`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateLogStats(data.data);
            }
        })
        .catch(error => console.error('Error loading log stats:', error));
    
    // Update last update time
    document.getElementById('last-update').textContent = `Letzte Aktualisierung: ${new Date().toLocaleTimeString()}`;
}

// Update system overview
function updateSystemOverview(data) {
    // Update health indicator
    const healthEl = document.getElementById('system-health');
    const healthValue = data.overall_health;
    
    if (healthValue >= 90) {
        healthEl.textContent = `Gesundheit: ${healthValue}% ✅`;
        healthEl.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800';
    } else if (healthValue >= 70) {
        healthEl.textContent = `Gesundheit: ${healthValue}% 🟢`;
        healthEl.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800';
    } else if (healthValue >= 50) {
        healthEl.textContent = `Gesundheit: ${healthValue}% 🟡`;
        healthEl.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800';
    } else {
        healthEl.textContent = `Gesundheit: ${healthValue}% 🔴`;
        healthEl.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800';
    }
    
    // Update overview stats
    document.getElementById('overall-health').textContent = `${healthValue}%`;
    document.getElementById('active-sensors').textContent = `${data.active_sensors}/${data.total_sensors}`;
    document.getElementById('error-sensors').textContent = data.error_sensors;
    document.getElementById('unknown-sensors').textContent = data.unknown_sensors;
}

// Update critical sensors table
function updateCriticalSensors(data) {
    const tableBody = document.getElementById('critical-sensors-table');
    tableBody.innerHTML = '';
    
    // Get all sensors
    const allSensors = [];
    Object.values(data.groups).forEach(group => {
        group.sensors.forEach(sensor => {
            allSensors.push(sensor);
        });
    });
    
    // Filter critical sensors (priority 1 and 2)
    const criticalSensors = allSensors.filter(sensor => sensor.priority <= 2);
    
    // Sort by status (errors first)
    criticalSensors.sort((a, b) => {
        if (a.status === 'error' && b.status !== 'error') return -1;
        if (a.status !== 'error' && b.status === 'error') return 1;
        return 0;
    });
    
    // Create table rows
    criticalSensors.forEach(sensor => {
        const row = document.createElement('tr');
        
        // Format last reading
        let lastValue = 'N/A';
        let timestamp = 'N/A';
        let responseTime = 'N/A';
        
        if (sensor.last_reading && sensor.last_reading.value !== null) {
            lastValue = sensor.last_reading.value;
            if (sensor.unit) {
                lastValue += ` ${sensor.unit}`;
            }
            
            if (sensor.last_reading.timestamp) {
                const date = new Date(sensor.last_reading.timestamp);
                timestamp = date.toLocaleString();
            }
            
            if (sensor.last_reading.response_time_ms) {
                responseTime = `${sensor.last_reading.response_time_ms.toFixed(2)} ms`;
            }
        }
        
        // Create status badge
        const statusBadge = document.createElement('span');
        statusBadge.className = `px-2 py-1 rounded-full text-xs font-semibold status-${sensor.status}`;
        statusBadge.textContent = sensor.status.toUpperCase();
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${sensor.name}</div>
                        <div class="text-xs text-gray-500">${sensor.description}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${statusBadge.outerHTML}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${lastValue}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${timestamp}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${responseTime}
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Update MQTT stats
function updateMqttStats(data) {
    // Message stats
    document.getElementById('mqtt-total-messages').textContent = data.message_stats.total_messages;
    document.getElementById('mqtt-recent-messages').textContent = data.message_stats.messages_last_hour;
    
    // Flow stats
    document.getElementById('mqtt-success-rate').textContent = `${data.flow_stats.success_rate}%`;
    document.getElementById('mqtt-response-time').textContent = `${data.flow_stats.avg_response_time_ms} ms`;
    
    // Dashboard MQTT stats
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
    
    // Update MQTT errors
    updateMqttErrors(data.recent_errors);
}

// Update MQTT errors
function updateMqttErrors(errors) {
    const container = document.getElementById('mqtt-recent-errors');
    container.innerHTML = '';
    
    if (!errors || errors.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Keine aktuellen Fehler</p>';
        return;
    }
    
    errors.forEach(error => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-50 border border-red-200 rounded-md p-4';
        
        const timestamp = new Date(error.timestamp).toLocaleString();
        
        errorDiv.innerHTML = `
            <div class="flex">
                <div class="flex-shrink-0">
                    <i class="fas fa-exclamation-circle text-red-400"></i>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">${error.type}</h3>
                    <div class="mt-2 text-sm text-red-700">
                        <p>${error.message}</p>
                        <p class="mt-1 text-xs text-red-500">Sensor: ${error.sensor} | ${timestamp}</p>
                        <p class="mt-1 text-xs text-red-500">Details: ${error.details}</p>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(errorDiv);
    });
    
    // Also update dashboard recent errors
    const dashboardErrors = document.getElementById('recent-errors');
    dashboardErrors.innerHTML = '';
    
    errors.slice(0, 3).forEach(error => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-50 border border-red-200 rounded-md p-4';
        
        const timestamp = new Date(error.timestamp).toLocaleString();
        
        errorDiv.innerHTML = `
            <div class="flex">
                <div class="flex-shrink-0">
                    <i class="fas fa-exclamation-circle text-red-400"></i>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">${error.type}</h3>
                    <div class="mt-2 text-sm text-red-700">
                        <p>${error.message}</p>
                        <p class="mt-1 text-xs text-red-500">Sensor: ${error.sensor} | ${timestamp}</p>
                    </div>
                </div>
            </div>
        `;
        
        dashboardErrors.appendChild(errorDiv);
    });
}

// Update log stats
function updateLogStats(data) {
    // Dashboard log stats
    document.getElementById('log-total-entries').textContent = data.total_entries;
    document.getElementById('log-error-count').textContent = data.level_breakdown.ERROR || 0;
    document.getElementById('log-error-rate').textContent = `${data.error_rate}%`;
    document.getElementById('log-avg-duration').textContent = `${data.performance.avg_duration_ms} ms`;
    
    // Log view stats
    const levelStats = document.getElementById('log-stats-level');
    levelStats.innerHTML = '';
    
    for (const [level, count] of Object.entries(data.level_breakdown)) {
        const levelDiv = document.createElement('div');
        levelDiv.className = 'flex justify-between';
        
        let levelClass = 'text-gray-600';
        if (level === 'ERROR') levelClass = 'text-red-600';
        if (level === 'WARNING') levelClass = 'text-yellow-600';
        if (level === 'INFO') levelClass = 'text-blue-600';
        if (level === 'DEBUG') levelClass = 'text-gray-600';
        
        levelDiv.innerHTML = `
            <span class="${levelClass}">${level}:</span>
            <span class="font-semibold">${count}</span>
        `;
        
        levelStats.appendChild(levelDiv);
    }
    
    // Category stats
    const categoryStats = document.getElementById('log-stats-category');
    categoryStats.innerHTML = '';
    
    for (const [category, count] of Object.entries(data.category_breakdown)) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'flex justify-between';
        
        categoryDiv.innerHTML = `
            <span class="text-gray-600">${formatCategory(category)}:</span>
            <span class="font-semibold">${count}</span>
        `;
        
        categoryStats.appendChild(categoryDiv);
    }
    
    // Sensor stats
    const sensorStats = document.getElementById('log-stats-sensors');
    sensorStats.innerHTML = '';
    
    // Get sensors with errors and sort by error count
    const sensorsWithErrors = Object.entries(data.sensor_breakdown)
        .filter(([_, stats]) => stats.errors > 0)
        .sort((a, b) => b[1].errors - a[1].errors)
        .slice(0, 5);
    
    if (sensorsWithErrors.length === 0) {
        sensorStats.innerHTML = '<p class="text-gray-500">Keine Sensor-Fehler</p>';
    } else {
        sensorsWithErrors.forEach(([sensor, stats]) => {
            const sensorDiv = document.createElement('div');
            sensorDiv.className = 'flex justify-between';
            
            const errorRate = (stats.errors / stats.total * 100).toFixed(1);
            
            sensorDiv.innerHTML = `
                <span class="text-gray-600">${sensor}:</span>
                <span class="font-semibold">${stats.errors} Fehler (${errorRate}%)</span>
            `;
            
            sensorStats.appendChild(sensorDiv);
        });
    }
}

// Load sensors data
function loadSensorsData() {
    fetch(`${API_BASE_URL}/sensors/status`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentSensorData = data.data;
                updateSensorsTable(data.data);
                populateGroupFilter(data.data);
            }
        })
        .catch(error => console.error('Error loading sensors data:', error));
}

// Update sensors table
function updateSensorsTable(data) {
    const tableBody = document.getElementById('sensors-table');
    tableBody.innerHTML = '';
    
    // Get all sensors
    const allSensors = [];
    Object.values(data.groups).forEach(group => {
        group.sensors.forEach(sensor => {
            allSensors.push(sensor);
        });
    });
    
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
    
    // Create table rows
    filteredSensors.forEach(sensor => {
        const row = document.createElement('tr');
        row.className = `priority-${sensor.priority}`;
        
        // Format last reading
        let lastValue = 'N/A';
        let timestamp = 'N/A';
        
        if (sensor.last_reading && sensor.last_reading.value !== null) {
            lastValue = sensor.last_reading.value;
            if (sensor.unit) {
                lastValue += ` ${sensor.unit}`;
            }
            
            if (sensor.last_reading.timestamp) {
                const date = new Date(sensor.last_reading.timestamp);
                timestamp = date.toLocaleString();
            }
        }
        
        // Create status badge
        const statusBadge = document.createElement('span');
        statusBadge.className = `px-2 py-1 rounded-full text-xs font-semibold status-${sensor.status}`;
        statusBadge.textContent = sensor.status.toUpperCase();
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${sensor.name}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">${sensor.description}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${sensor.group}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${statusBadge.outerHTML}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${lastValue}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${timestamp}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button class="text-blue-600 hover:text-blue-900 mr-3 view-sensor" data-sensor="${sensor.name}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="text-green-600 hover:text-green-900 edit-sensor" data-sensor="${sensor.name}">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.view-sensor').forEach(button => {
        button.addEventListener('click', () => {
            const sensorName = button.getAttribute('data-sensor');
            showSensorDetails(sensorName);
        });
    });
    
    document.querySelectorAll('.edit-sensor').forEach(button => {
        button.addEventListener('click', () => {
            const sensorName = button.getAttribute('data-sensor');
            showSensorDetails(sensorName, true);
        });
    });
}

// Populate group filter
function populateGroupFilter(data) {
    const groupFilter = document.getElementById('group-filter');
    const configGroupFilter = document.getElementById('config-group-filter');
    
    // Clear existing options except the first one
    while (groupFilter.options.length > 1) {
        groupFilter.remove(1);
    }
    
    while (configGroupFilter.options.length > 1) {
        configGroupFilter.remove(1);
    }
    
    // Add group options
    const groups = Object.keys(data.groups);
    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        
        groupFilter.appendChild(option.cloneNode(true));
        configGroupFilter.appendChild(option);
    });
    
    // Also populate MQTT sensor filter
    const mqttSensorFilter = document.getElementById('mqtt-sensor-filter');
    
    // Clear existing options except the first one
    while (mqttSensorFilter.options.length > 1) {
        mqttSensorFilter.remove(1);
    }
    
    // Get all sensors
    const allSensors = [];
    Object.values(data.groups).forEach(group => {
        group.sensors.forEach(sensor => {
            allSensors.push(sensor);
        });
    });
    
    // Sort by name
    allSensors.sort((a, b) => a.name.localeCompare(b.name));
    
    // Add sensor options
    allSensors.forEach(sensor => {
        const option = document.createElement('option');
        option.value = sensor.name;
        option.textContent = sensor.name;
        
        mqttSensorFilter.appendChild(option);
    });
    
    // Also populate log sensor filter
    const logSensorFilter = document.getElementById('log-filter-sensor');
    
    // Clear existing options except the first one
    while (logSensorFilter.options.length > 1) {
        logSensorFilter.remove(1);
    }
    
    // Add sensor options
    allSensors.forEach(sensor => {
        const option = document.createElement('option');
        option.value = sensor.name;
        option.textContent = sensor.name;
        
        logSensorFilter.appendChild(option);
    });
}

// Show sensor details
function showSensorDetails(sensorName, editMode = false) {
    // Fetch sensor details
    fetch(`${API_BASE_URL}/sensors/${sensorName}/status`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentSensor = data.data;
                updateSensorModal(data.data, editMode);
                
                // Also fetch MQTT history
                fetch(`${API_BASE_URL}/mqtt/history/${sensorName}`)
                    .then(response => response.json())
                    .then(mqttData => {
                        if (mqttData.success) {
                            updateMqttHistory(mqttData.data);
                        }
                    })
                    .catch(error => console.error('Error loading MQTT history:', error));
                
                // Show modal
                document.getElementById('sensor-details-modal').classList.remove('hidden');
            }
        })
        .catch(error => console.error('Error loading sensor details:', error));
}

// Update sensor modal
function updateSensorModal(sensor, editMode = false) {
    // Set sensor name
    document.getElementById('modal-sensor-name').textContent = sensor.name;
    
    // Set sensor info
    document.getElementById('modal-description').textContent = sensor.description;
    document.getElementById('modal-group').textContent = sensor.group;
    document.getElementById('modal-priority').textContent = `${sensor.priority} - ${getPriorityLabel(sensor.priority)}`;
    document.getElementById('modal-polling').textContent = `${sensor.polling_interval} Sekunden`;
    document.getElementById('modal-enabled').textContent = sensor.enabled ? 'Ja' : 'Nein';
    document.getElementById('modal-writable').textContent = sensor.writable ? 'Ja' : 'Nein';
    document.getElementById('modal-address').textContent = sensor.nasa_address || 'N/A';
    document.getElementById('modal-entity-id').textContent = sensor.hass_entity_id || 'N/A';
    
    // Set status info
    const statusEl = document.getElementById('modal-status');
    statusEl.textContent = sensor.status.toUpperCase();
    statusEl.className = `font-semibold status-${sensor.status} px-2 py-1 rounded-full text-xs`;
    
    // Set last reading
    if (sensor.last_reading && sensor.last_reading.value !== null) {
        let value = sensor.last_reading.value;
        if (sensor.unit) {
            value += ` ${sensor.unit}`;
        }
        document.getElementById('modal-last-value').textContent = value;
        
        if (sensor.last_reading.timestamp) {
            const date = new Date(sensor.last_reading.timestamp);
            document.getElementById('modal-timestamp').textContent = date.toLocaleString();
        } else {
            document.getElementById('modal-timestamp').textContent = 'N/A';
        }
        
        if (sensor.last_reading.response_time_ms) {
            document.getElementById('modal-response-time').textContent = `${sensor.last_reading.response_time_ms.toFixed(2)} ms`;
        } else {
            document.getElementById('modal-response-time').textContent = 'N/A';
        }
    } else {
        document.getElementById('modal-last-value').textContent = 'N/A';
        document.getElementById('modal-timestamp').textContent = 'N/A';
        document.getElementById('modal-response-time').textContent = 'N/A';
    }
    
    // Set statistics
    const stats = sensor.statistics;
    document.getElementById('modal-success-rate').textContent = `${stats.success_rate}%`;
    document.getElementById('modal-error-count').textContent = stats.error_count;
    
    // Set form values for editing
    document.getElementById('modal-input-polling').value = sensor.polling_interval;
    document.getElementById('modal-input-priority').value = sensor.priority;
    document.getElementById('modal-input-enabled').checked = sensor.enabled;
}

// Update MQTT history
function updateMqttHistory(data) {
    const container = document.getElementById('modal-mqtt-history');
    container.innerHTML = '';
    
    if (!data.communication_flows || data.communication_flows.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Keine MQTT-Kommunikation in den letzten 24 Stunden</p>';
        return;
    }
    
    // Sort by timestamp (newest first)
    data.communication_flows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Create history items
    data.communication_flows.slice(0, 10).forEach(flow => {
        const flowDiv = document.createElement('div');
        flowDiv.className = 'mb-4 pb-4 border-b border-gray-200';
        
        const timestamp = new Date(flow.timestamp).toLocaleString();
        const successClass = flow.success ? 'text-green-600' : 'text-red-600';
        const successIcon = flow.success ? 'fa-check-circle' : 'fa-times-circle';
        
        flowDiv.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <span class="text-xs text-gray-500">${timestamp}</span>
                    <p class="text-sm font-medium">
                        <i class="fas ${successIcon} ${successClass} mr-1"></i>
                        ${flow.initiated_by === 'home_assistant' ? 'SET-Kommando' : 'STATE-Update'}
                    </p>
                </div>
                <div class="text-right">
                    ${flow.response_time_ms ? `<span class="text-xs text-gray-500">${flow.response_time_ms.toFixed(2)} ms</span>` : ''}
                </div>
            </div>
            <div class="mt-2 grid grid-cols-2 gap-2">
                <div class="text-sm">
                    <span class="text-gray-500">SET:</span> 
                    <span class="font-mono">${flow.set_value !== null ? flow.set_value : 'N/A'}</span>
                </div>
                <div class="text-sm">
                    <span class="text-gray-500">STATE:</span> 
                    <span class="font-mono">${flow.state_value !== null ? flow.state_value : 'N/A'}</span>
                </div>
            </div>
            ${flow.error_message ? `<p class="mt-1 text-xs text-red-600">${flow.error_message}</p>` : ''}
        `;
        
        container.appendChild(flowDiv);
    });
}

// Save sensor configuration
function saveSensorConfig() {
    if (!currentSensor) return;
    
    const updates = {
        polling_interval: parseInt(document.getElementById('modal-input-polling').value),
        priority: parseInt(document.getElementById('modal-input-priority').value),
        enabled: document.getElementById('modal-input-enabled').checked
    };
    
    fetch(`${API_BASE_URL}/config/parameter/${currentSensor.name}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Close modal
                document.getElementById('sensor-details-modal').classList.add('hidden');
                
                // Reload data
                loadSensorsData();
                loadConfigData();
                
                // Show success message
                alert('Sensor-Konfiguration erfolgreich gespeichert');
            } else {
                alert(`Fehler: ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Error saving sensor config:', error);
            alert('Fehler beim Speichern der Konfiguration');
        });
}

// Save group configuration
function saveGroupConfig() {
    if (!currentGroup) return;
    
    const updates = {
        default_polling_interval: parseInt(document.getElementById('group-modal-polling').value),
        enabled: document.getElementById('group-modal-enabled').checked
    };
    
    fetch(`${API_BASE_URL}/config/group/${currentGroup}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Close modal
                document.getElementById('group-edit-modal').classList.add('hidden');
                
                // Reload data
                loadConfigData();
                
                // Show success message
                alert('Gruppen-Konfiguration erfolgreich gespeichert');
            } else {
                alert(`Fehler: ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Error saving group config:', error);
            alert('Fehler beim Speichern der Konfiguration');
        });
}

// Load MQTT data
function loadMqttData() {
    fetch(`${API_BASE_URL}/mqtt/stats`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentMqttData = data.data;
                updateMqttStats(data.data);
                updateMqttErrors(data.data.recent_errors);
            }
        })
        .catch(error => console.error('Error loading MQTT data:', error));
}

// Load MQTT history for a specific sensor
function loadMqttHistory() {
    const sensorName = document.getElementById('mqtt-sensor-filter').value;
    
    if (!sensorName) {
        alert('Bitte wählen Sie einen Sensor aus');
        return;
    }
    
    fetch(`${API_BASE_URL}/mqtt/history/${sensorName}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateMqttHistoryTable(data.data);
            }
        })
        .catch(error => console.error('Error loading MQTT history:', error));
}

// Update MQTT history table
function updateMqttHistoryTable(data) {
    const tableBody = document.getElementById('mqtt-history-table');
    tableBody.innerHTML = '';
    
    if (!data.communication_flows || data.communication_flows.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                Keine MQTT-Kommunikation in den letzten ${data.time_period_hours} Stunden
            </td>
        `;
        tableBody.appendChild(row);
        return;
    }
    
    // Sort by timestamp (newest first)
    data.communication_flows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Create table rows
    data.communication_flows.forEach(flow => {
        const row = document.createElement('tr');
        
        const timestamp = new Date(flow.timestamp).toLocaleString();
        
        // Create status badge
        const statusBadge = document.createElement('span');
        statusBadge.className = `px-2 py-1 rounded-full text-xs font-semibold ${flow.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`;
        statusBadge.textContent = flow.success ? 'Erfolgreich' : 'Fehler';
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${timestamp}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${flow.initiated_by === 'home_assistant' ? 'SET-Kommando' : 'STATE-Update'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${flow.initiated_by === 'home_assistant' ? 'Home Assistant' : 'EHS-Sentinel'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">
                ${flow.set_value !== null ? flow.set_value : 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">
                ${flow.state_value !== null ? flow.state_value : 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${flow.response_time_ms ? `${flow.response_time_ms.toFixed(2)} ms` : 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${statusBadge.outerHTML}
                ${flow.error_message ? `<p class="text-xs text-red-600 mt-1">${flow.error_message}</p>` : ''}
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Load logs data
function loadLogsData() {
    // Load log stats
    fetch(`${API_BASE_URL}/logs/stats`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateLogStats(data.data);
            }
        })
        .catch(error => console.error('Error loading log stats:', error));
    
    // Load log entries with default filters
    applyLogFilters();
}

// Apply log filters
function applyLogFilters() {
    const filters = {};
    
    const level = document.getElementById('log-filter-level').value;
    if (level) filters.level = level;
    
    const category = document.getElementById('log-filter-category').value;
    if (category) filters.category = category;
    
    const sensor = document.getElementById('log-filter-sensor').value;
    if (sensor) filters.sensor_name = sensor;
    
    const startTime = document.getElementById('log-filter-start').value;
    if (startTime) filters.start_time = new Date(startTime).toISOString();
    
    const endTime = document.getElementById('log-filter-end').value;
    if (endTime) filters.end_time = new Date(endTime).toISOString();
    
    const errorsOnly = document.getElementById('log-filter-errors').checked;
    if (errorsOnly) filters.errors_only = true;
    
    // Build query string
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
        queryParams.append(key, value);
    }
    
    // Set limit
    queryParams.append('limit', 100);
    
    // Fetch logs
    fetch(`${API_BASE_URL}/logs?${queryParams.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentLogData = data.data;
                updateLogEntriesTable(data.data.logs);
            }
        })
        .catch(error => console.error('Error loading logs:', error));
}

// Update log entries table
function updateLogEntriesTable(logs) {
    const tableBody = document.getElementById('log-entries-table');
    tableBody.innerHTML = '';
    
    if (!logs || logs.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                Keine Log-Einträge gefunden
            </td>
        `;
        tableBody.appendChild(row);
        return;
    }
    
    // Create table rows
    logs.forEach(log => {
        const row = document.createElement('tr');
        
        const timestamp = new Date(log.timestamp).toLocaleString();
        
        // Create level badge
        const levelBadge = document.createElement('span');
        let levelClass = 'bg-gray-100 text-gray-800';
        if (log.level === 'ERROR') levelClass = 'bg-red-100 text-red-800';
        if (log.level === 'WARNING') levelClass = 'bg-yellow-100 text-yellow-800';
        if (log.level === 'INFO') levelClass = 'bg-blue-100 text-blue-800';
        
        levelBadge.className = `px-2 py-1 rounded-full text-xs font-semibold ${levelClass}`;
        levelBadge.textContent = log.level;
        
        // Format details
        let detailsText = '';
        if (log.details) {
            try {
                if (typeof log.details === 'string') {
                    detailsText = log.details;
                } else {
                    // Format first 3 key-value pairs
                    const entries = Object.entries(log.details).slice(0, 3);
                    detailsText = entries.map(([key, value]) => `${key}: ${value}`).join(', ');
                    
                    // Add ellipsis if there are more
                    if (Object.keys(log.details).length > 3) {
                        detailsText += ', ...';
                    }
                }
            } catch (e) {
                detailsText = 'Fehler beim Formatieren der Details';
            }
        }
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${timestamp}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${levelBadge.outerHTML}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatCategory(log.category)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${log.sensor_name || 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${log.message}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${detailsText}
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Load more logs
function loadMoreLogs() {
    // Get current filters
    const filters = {};
    
    const level = document.getElementById('log-filter-level').value;
    if (level) filters.level = level;
    
    const category = document.getElementById('log-filter-category').value;
    if (category) filters.category = category;
    
    const sensor = document.getElementById('log-filter-sensor').value;
    if (sensor) filters.sensor_name = sensor;
    
    const startTime = document.getElementById('log-filter-start').value;
    if (startTime) filters.start_time = new Date(startTime).toISOString();
    
    const endTime = document.getElementById('log-filter-end').value;
    if (endTime) filters.end_time = new Date(endTime).toISOString();
    
    const errorsOnly = document.getElementById('log-filter-errors').checked;
    if (errorsOnly) filters.errors_only = true;
    
    // Set limit and offset
    const currentCount = currentLogData?.logs?.length || 0;
    
    // Build query string
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
        queryParams.append(key, value);
    }
    
    queryParams.append('limit', 100);
    queryParams.append('offset', currentCount);
    
    // Fetch more logs
    fetch(`${API_BASE_URL}/logs?${queryParams.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Append new logs to current logs
                currentLogData.logs = [...currentLogData.logs, ...data.data.logs];
                updateLogEntriesTable(currentLogData.logs);
            }
        })
        .catch(error => console.error('Error loading more logs:', error));
}

// Export logs
function exportLogs() {
    // Get current filters
    const filters = {};
    
    const level = document.getElementById('log-filter-level').value;
    if (level) filters.level = level;
    
    const category = document.getElementById('log-filter-category').value;
    if (category) filters.category = category;
    
    const sensor = document.getElementById('log-filter-sensor').value;
    if (sensor) filters.sensor_name = sensor;
    
    const startTime = document.getElementById('log-filter-start').value;
    if (startTime) filters.start_time = new Date(startTime).toISOString();
    
    const endTime = document.getElementById('log-filter-end').value;
    if (endTime) filters.end_time = new Date(endTime).toISOString();
    
    const errorsOnly = document.getElementById('log-filter-errors').checked;
    if (errorsOnly) filters.errors_only = true;
    
    // Build query string
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
        queryParams.append(key, value);
    }
    
    // Set format
    queryParams.append('format', 'csv');
    
    // Open export URL in new tab
    window.open(`${API_BASE_URL}/logs/export?${queryParams.toString()}`);
}

// Load configuration data
function loadConfigData() {
    // Load UI config
    fetch(`${API_BASE_URL}/config/ui`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentConfigData = data.data;
                updateConfigTables(data.data);
            }
        })
        .catch(error => console.error('Error loading UI config:', error));
}

// Update configuration tables
function updateConfigTables(data) {
    // Update group table
    const groupTable = document.getElementById('group-config-table');
    groupTable.innerHTML = '';
    
    for (const [groupName, groupConfig] of Object.entries(data.groups)) {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${groupConfig.display_name}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">${groupConfig.description}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${groupConfig.priority}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${groupConfig.default_polling_interval} Sekunden
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${groupConfig.parameter_count}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 rounded-full text-xs font-semibold ${groupConfig.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${groupConfig.enabled ? 'Aktiviert' : 'Deaktiviert'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button class="text-blue-600 hover:text-blue-900 edit-group" data-group="${groupName}">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        
        groupTable.appendChild(row);
    }
    
    // Add event listeners to edit buttons
    document.querySelectorAll('.edit-group').forEach(button => {
        button.addEventListener('click', () => {
            const groupName = button.getAttribute('data-group');
            showGroupEditModal(groupName);
        });
    });
    
    // Update parameter table
    updateParameterTable(data);
}

// Update parameter table
function updateParameterTable(data) {
    const tableBody = document.getElementById('parameter-config-table');
    tableBody.innerHTML = '';
    
    // Get group filter
    const groupFilter = document.getElementById('config-group-filter').value;
    
    // Filter parameters
    let filteredParameters = Object.entries(data.parameters);
    
    if (groupFilter !== 'all') {
        filteredParameters = filteredParameters.filter(([_, param]) => param.group === groupFilter);
    }
    
    // Sort by group, then by name
    filteredParameters.sort((a, b) => {
        if (a[1].group !== b[1].group) {
            return a[1].group.localeCompare(b[1].group);
        }
        return a[0].localeCompare(b[0]);
    });
    
    // Create table rows
    filteredParameters.forEach(([name, param]) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${name}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">${param.display_name}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${param.type}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${param.group}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${param.polling_interval} Sekunden
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${param.priority}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 rounded-full text-xs font-semibold ${param.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${param.enabled ? 'Ja' : 'Nein'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button class="text-blue-600 hover:text-blue-900 edit-parameter" data-parameter="${name}">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to edit buttons
    document.querySelectorAll('.edit-parameter').forEach(button => {
        button.addEventListener('click', () => {
            const paramName = button.getAttribute('data-parameter');
            showSensorDetails(paramName, true);
        });
    });
}

// Show group edit modal
function showGroupEditModal(groupName) {
    const groupConfig = currentConfigData.groups[groupName];
    
    if (!groupConfig) {
        alert('Gruppe nicht gefunden');
        return;
    }
    
    currentGroup = groupName;
    
    // Set group name
    document.getElementById('group-modal-name').textContent = groupConfig.display_name;
    
    // Set form values
    document.getElementById('group-modal-polling').value = groupConfig.default_polling_interval;
    document.getElementById('group-modal-enabled').checked = groupConfig.enabled;
    
    // Show modal
    document.getElementById('group-edit-modal').classList.remove('hidden');
}

// Load documentation
function loadDocumentation() {
    // Load MQTT documentation
    fetch(`${API_BASE_URL}/documentation/mqtt`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('mqtt-doc-content').innerHTML = marked.parse(data.data.content);
            }
        })
        .catch(error => console.error('Error loading MQTT documentation:', error));
    
    // Load conversion documentation
    fetch(`${API_BASE_URL}/documentation/conversion`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('conversion-doc-content').innerHTML = marked.parse(data.data.content);
            }
        })
        .catch(error => console.error('Error loading conversion documentation:', error));
    
    // Load troubleshooting documentation
    fetch(`${API_BASE_URL}/documentation/troubleshooting`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('troubleshooting-doc-content').innerHTML = marked.parse(data.data.content);
            }
        })
        .catch(error => console.error('Error loading troubleshooting documentation:', error));
}

// Generate documentation
function generateDocumentation() {
    fetch(`${API_BASE_URL}/documentation/generate`, {
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
                alert(`Dokumentation erfolgreich generiert in: ${data.data.files.overview}`);
            } else {
                alert(`Fehler: ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Error generating documentation:', error);
            alert('Fehler bei der Dokumentationsgenerierung');
        });
}

// Filter sensors
function filterSensors() {
    updateSensorsTable(currentSensorData);
}

// Filter parameters
function filterParameters() {
    updateParameterTable(currentConfigData);
}

// Helper functions
function getPriorityLabel(priority) {
    switch (priority) {
        case 1: return 'Kritisch';
        case 2: return 'Wichtig';
        case 3: return 'Standard';
        case 4: return 'Niedrig';
        case 5: return 'Sehr niedrig';
        default: return 'Unbekannt';
    }
}

function formatCategory(category) {
    switch (category) {
        case 'sensor_communication': return 'Sensor-Kommunikation';
        case 'mqtt_communication': return 'MQTT-Kommunikation';
        case 'data_conversion': return 'Datenkonvertierung';
        case 'error_handling': return 'Fehlerbehandlung';
        case 'system_status': return 'System-Status';
        case 'performance': return 'Performance';
        default: return category;
    }
}

// Auto-refresh dashboard every 60 seconds
setInterval(loadDashboardData, 60000);