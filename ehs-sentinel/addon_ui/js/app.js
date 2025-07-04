// EHS-Sentinel UI JavaScript
// Handles all UI interactions and API calls

console.log("Initializing EHS-Sentinel UI...");

// Global state
const state = {
    currentTab: 'dashboard',
    sensorData: {},
    mqttData: {},
    logsData: {},
    configData: {},
    docData: {}
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set up tab navigation
    setupTabs();
    
    // Load initial data
    loadDashboardData();
    
    // Set up event listeners
    setupEventListeners();
});

// Set up tab navigation
function setupTabs() {
    const tabs = ['dashboard', 'sensors', 'mqtt', 'logs', 'config', 'docs'];
    
    tabs.forEach(tab => {
        const tabButton = document.getElementById(`tab-${tab}`);
        if (tabButton) {
            tabButton.addEventListener('click', () => {
                switchTab(tab);
            });
        }
    });
    
    // Set up doc tabs
    const docTabs = ['mqtt', 'conversion', 'troubleshooting'];
    docTabs.forEach(docTab => {
        const docTabButton = document.getElementById(`doc-tab-${docTab}`);
        if (docTabButton) {
            docTabButton.addEventListener('click', () => {
                switchDocTab(docTab);
            });
        }
    });
}

// Switch between main tabs
function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(`view-${tabName}`);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
    }
    
    // Update tab buttons
    document.querySelectorAll('[id^="tab-"]').forEach(button => {
        button.classList.remove('tab-active');
        button.classList.add('tab-inactive');
    });
    
    const activeButton = document.getElementById(`tab-${tabName}`);
    if (activeButton) {
        activeButton.classList.remove('tab-inactive');
        activeButton.classList.add('tab-active');
    }
    
    // Update current tab in state
    state.currentTab = tabName;
    
    // Load data for the tab if needed
    if (tabName === 'sensors' && Object.keys(state.sensorData).length === 0) {
        loadSensorsData();
    } else if (tabName === 'mqtt' && Object.keys(state.mqttData).length === 0) {
        loadMQTTData();
    } else if (tabName === 'logs' && Object.keys(state.logsData).length === 0) {
        loadLogsData();
    } else if (tabName === 'config' && Object.keys(state.configData).length === 0) {
        loadConfigData();
    } else if (tabName === 'docs' && Object.keys(state.docData).length === 0) {
        loadDocumentation();
    }
}

// Switch between documentation tabs
function switchDocTab(docTabName) {
    // Hide all doc contents
    document.querySelectorAll('.doc-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Show selected doc content
    const selectedDocTab = document.getElementById(`doc-view-${docTabName}`);
    if (selectedDocTab) {
        selectedDocTab.classList.remove('hidden');
    }
    
    // Update doc tab buttons
    document.querySelectorAll('[id^="doc-tab-"]').forEach(button => {
        button.classList.remove('tab-active');
        button.classList.add('tab-inactive');
    });
    
    const activeDocButton = document.getElementById(`doc-tab-${docTabName}`);
    if (activeDocButton) {
        activeDocButton.classList.remove('tab-inactive');
        activeDocButton.classList.add('tab-active');
    }
    
    // Load documentation if needed
    if (!(docTabName in state.docData)) {
        loadSpecificDocumentation(docTabName);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Sensor filter
    const groupFilter = document.getElementById('group-filter');
    const statusFilter = document.getElementById('status-filter');
    const refreshSensors = document.getElementById('refresh-sensors');
    
    if (groupFilter) {
        groupFilter.addEventListener('change', filterSensors);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterSensors);
    }
    
    if (refreshSensors) {
        refreshSensors.addEventListener('click', loadSensorsData);
    }
    
    // MQTT filter
    const mqttSensorFilter = document.getElementById('mqtt-sensor-filter');
    const mqttLoadHistory = document.getElementById('mqtt-load-history');
    const refreshMQTT = document.getElementById('refresh-mqtt');
    
    if (mqttLoadHistory) {
        mqttLoadHistory.addEventListener('click', () => {
            const sensorName = mqttSensorFilter.value;
            if (sensorName) {
                loadMQTTHistory(sensorName);
            }
        });
    }
    
    if (refreshMQTT) {
        refreshMQTT.addEventListener('click', loadMQTTData);
    }
    
    // Logs filter
    const applyLogFilters = document.getElementById('apply-log-filters');
    const refreshLogs = document.getElementById('refresh-logs');
    const exportLogs = document.getElementById('export-logs');
    const loadMoreLogs = document.getElementById('load-more-logs');
    
    if (applyLogFilters) {
        applyLogFilters.addEventListener('click', applyLogFilterSettings);
    }
    
    if (refreshLogs) {
        refreshLogs.addEventListener('click', loadLogsData);
    }
    
    if (exportLogs) {
        exportLogs.addEventListener('click', exportLogData);
    }
    
    if (loadMoreLogs) {
        loadMoreLogs.addEventListener('click', loadMoreLogEntries);
    }
    
    // Config
    const refreshConfig = document.getElementById('refresh-config');
    
    if (refreshConfig) {
        refreshConfig.addEventListener('click', loadConfigData);
    }
    
    // Documentation
    const generateDocs = document.getElementById('generate-docs');
    
    if (generateDocs) {
        generateDocs.addEventListener('click', generateDocumentation);
    }
    
    // Modal close buttons
    const closeModal = document.getElementById('close-modal');
    const closeGroupModal = document.getElementById('close-group-modal');
    
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            document.getElementById('sensor-details-modal').classList.add('hidden');
        });
    }
    
    if (closeGroupModal) {
        closeGroupModal.addEventListener('click', () => {
            document.getElementById('group-edit-modal').classList.add('hidden');
        });
    }
    
    // Save buttons
    const modalSaveConfig = document.getElementById('modal-save-config');
    const groupModalSave = document.getElementById('group-modal-save');
    
    if (modalSaveConfig) {
        modalSaveConfig.addEventListener('click', saveSensorConfig);
    }
    
    if (groupModalSave) {
        groupModalSave.addEventListener('click', saveGroupConfig);
    }
}

// Load dashboard data
function loadDashboardData() {
    console.log("Loading dashboard data...");
    
    // Load health data
    fetch('/api/health')
        .then(response => response.json())
        .then(data => {
            updateDashboardHealth(data);
        })
        .catch(error => {
            console.error("Error loading health data:", error);
        });
    
    // Load sensor overview
    fetch('/api/sensors/status')
        .then(response => response.json())
        .then(data => {
            updateDashboardSensors(data);
        })
        .catch(error => {
            console.error("Error loading sensor stats:", error);
        });
    
    // Load MQTT stats
    fetch('/api/mqtt/stats')
        .then(response => response.json())
        .then(data => {
            updateDashboardMQTT(data);
        })
        .catch(error => {
            console.error("Error loading MQTT stats:", error);
        });
    
    // Load log stats
    fetch('/api/logs/stats')
        .then(response => response.json())
        .then(data => {
            updateDashboardLogs(data);
        })
        .catch(error => {
            console.error("Error loading log stats:", error);
        });
}

// Update dashboard health section
function updateDashboardHealth(data) {
    if (!data.success) {
        console.error("Error in health data:", data.error);
        return;
    }
    
    const healthData = data.data;
    
    // Update system health indicator
    const systemHealth = document.getElementById('system-health');
    if (systemHealth) {
        systemHealth.textContent = healthData.overall_status.toUpperCase();
        systemHealth.className = `px-3 py-1 rounded-full text-sm font-semibold ${
            healthData.overall_status === 'healthy' ? 'bg-green-100 text-green-800' :
            healthData.overall_status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
        }`;
    }
    
    // Update last update time
    const lastUpdate = document.getElementById('last-update');
    if (lastUpdate) {
        const timestamp = new Date(healthData.components.timestamp);
        lastUpdate.textContent = `Aktualisiert: ${timestamp.toLocaleTimeString()}`;
    }
    
    // Update overall health
    const overallHealth = document.getElementById('overall-health');
    if (overallHealth) {
        overallHealth.textContent = healthData.overall_status.toUpperCase();
        overallHealth.className = `font-semibold ${
            healthData.overall_status === 'healthy' ? 'text-green-600' :
            healthData.overall_status === 'degraded' ? 'text-yellow-600' :
            'text-red-600'
        }`;
    }
    
    // Update component status
    for (const [component, status] of Object.entries(healthData.components)) {
        if (component === 'timestamp') continue;
        
        const componentElement = document.getElementById(`${component}-status`);
        if (componentElement) {
            componentElement.textContent = status.toUpperCase();
            componentElement.className = `font-semibold ${
                status === 'healthy' ? 'text-green-600' :
                status === 'degraded' ? 'text-yellow-600' :
                'text-red-600'
            }`;
        }
    }
}

// Update dashboard sensors section
function updateDashboardSensors(data) {
    if (!data.success) {
        console.error("Error in sensor data:", data.error);
        return;
    }
    
    const sensorData = data.data;
    state.sensorData = sensorData;
    
    // Update sensor counts
    const activeSensors = document.getElementById('active-sensors');
    const errorSensors = document.getElementById('error-sensors');
    const unknownSensors = document.getElementById('unknown-sensors');
    
    if (activeSensors) activeSensors.textContent = sensorData.active_sensors;
    if (errorSensors) errorSensors.textContent = sensorData.error_sensors;
    if (unknownSensors) unknownSensors.textContent = sensorData.unknown_sensors;
    
    // Update critical sensors table
    updateCriticalSensorsTable(sensorData);
}

// Update critical sensors table
function updateCriticalSensorsTable(sensorData) {
    const criticalSensorsTable = document.getElementById('critical-sensors-table');
    if (!criticalSensorsTable) return;
    
    // Clear existing rows
    criticalSensorsTable.innerHTML = '';
    
    // Get critical sensors (priority 1 and 2)
    const criticalSensors = [];
    
    for (const groupName in sensorData.groups) {
        const group = sensorData.groups[groupName];
        for (const sensor of group.sensors) {
            if (sensor.priority <= 2) {
                criticalSensors.push(sensor);
            }
        }
    }
    
    // Sort by status (error first, then unknown, then active)
    criticalSensors.sort((a, b) => {
        const statusOrder = { 'error': 0, 'crc_error': 1, 'timeout': 2, 'unknown': 3, 'active': 4 };
        return statusOrder[a.status] - statusOrder[b.status];
    });
    
    // Add rows for critical sensors
    for (const sensor of criticalSensors.slice(0, 10)) { // Show top 10
        const row = document.createElement('tr');
        
        // Sensor name
        const nameCell = document.createElement('td');
        nameCell.className = 'px-6 py-4 whitespace-nowrap';
        nameCell.innerHTML = `<div class="font-medium text-gray-900">${sensor.name}</div>
                             <div class="text-sm text-gray-500">${sensor.description}</div>`;
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
        valueCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        valueCell.textContent = sensor.last_reading ? sensor.last_reading.value : 'N/A';
        row.appendChild(valueCell);
        
        // Timestamp
        const timestampCell = document.createElement('td');
        timestampCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        if (sensor.last_reading && sensor.last_reading.timestamp) {
            const timestamp = new Date(sensor.last_reading.timestamp);
            timestampCell.textContent = timestamp.toLocaleString();
        } else {
            timestampCell.textContent = 'N/A';
        }
        row.appendChild(timestampCell);
        
        // Response time
        const responseTimeCell = document.createElement('td');
        responseTimeCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        responseTimeCell.textContent = sensor.last_reading && sensor.last_reading.response_time_ms ? 
            `${sensor.last_reading.response_time_ms.toFixed(2)} ms` : 'N/A';
        row.appendChild(responseTimeCell);
        
        criticalSensorsTable.appendChild(row);
    }
    
    // If no critical sensors, add a message
    if (criticalSensors.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 5;
        cell.className = 'px-6 py-4 text-center text-gray-500';
        cell.textContent = 'Keine kritischen Sensoren gefunden.';
        row.appendChild(cell);
        criticalSensorsTable.appendChild(row);
    }
}

// Update dashboard MQTT section
function updateDashboardMQTT(data) {
    if (!data.success) {
        console.error("Error in MQTT data:", data.error);
        return;
    }
    
    const mqttData = data.data;
    state.mqttData = mqttData;
    
    // Update MQTT stats
    const mqttTotalMessages = document.getElementById('mqtt-total-messages');
    const mqttRecentMessages = document.getElementById('mqtt-recent-messages');
    const mqttSuccessRate = document.getElementById('mqtt-success-rate');
    const mqttResponseTime = document.getElementById('mqtt-response-time');
    
    if (mqttTotalMessages) mqttTotalMessages.textContent = mqttData.message_stats.total_messages;
    if (mqttRecentMessages) mqttRecentMessages.textContent = mqttData.message_stats.messages_last_hour;
    if (mqttSuccessRate) mqttSuccessRate.textContent = `${mqttData.flow_stats.success_rate.toFixed(2)}%`;
    if (mqttResponseTime) mqttResponseTime.textContent = `${mqttData.flow_stats.avg_response_time_ms.toFixed(2)} ms`;
    
    // Update recent errors
    updateRecentErrors(mqttData.recent_errors);
}

// Update recent errors section
function updateRecentErrors(errors) {
    const recentErrors = document.getElementById('recent-errors');
    if (!recentErrors) return;
    
    // Clear existing errors
    recentErrors.innerHTML = '';
    
    if (errors.length === 0) {
        const noErrors = document.createElement('div');
        noErrors.className = 'p-4 bg-green-50 rounded-lg';
        noErrors.innerHTML = '<p class="text-green-700">Keine Fehler in der letzten Stunde! 🎉</p>';
        recentErrors.appendChild(noErrors);
        return;
    }
    
    // Add errors
    for (const error of errors) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'p-4 bg-red-50 rounded-lg';
        
        const timestamp = new Date(error.timestamp);
        
        errorDiv.innerHTML = `
            <div class="flex justify-between">
                <h3 class="text-red-800 font-medium">${error.type}</h3>
                <span class="text-sm text-gray-500">${timestamp.toLocaleString()}</span>
            </div>
            <p class="text-red-700 mt-1">${error.message}</p>
            <p class="text-sm text-gray-600 mt-2">${error.sensor ? `Sensor: ${error.sensor}` : ''}</p>
            <p class="text-xs text-gray-500 mt-1">${error.details}</p>
        `;
        
        recentErrors.appendChild(errorDiv);
    }
}

// Update dashboard logs section
function updateDashboardLogs(data) {
    if (!data.success) {
        console.error("Error in log data:", data.error);
        return;
    }
    
    const logData = data.data;
    state.logsData = logData;
    
    // Update log stats
    const logTotalEntries = document.getElementById('log-total-entries');
    const logErrorCount = document.getElementById('log-error-count');
    const logErrorRate = document.getElementById('log-error-rate');
    const logAvgDuration = document.getElementById('log-avg-duration');
    
    if (logTotalEntries) logTotalEntries.textContent = logData.total_entries;
    if (logErrorCount) logErrorCount.textContent = logData.level_breakdown.ERROR || 0;
    if (logErrorRate) logErrorRate.textContent = `${logData.error_rate.toFixed(2)}%`;
    if (logAvgDuration) logAvgDuration.textContent = `${logData.performance.avg_duration_ms.toFixed(2)} ms`;
    
    // Update log stats breakdowns
    updateLogStatsBreakdown('level', logData.level_breakdown);
    updateLogStatsBreakdown('category', logData.category_breakdown);
    updateSensorErrorBreakdown(logData.sensor_breakdown);
}

// Update log stats breakdown
function updateLogStatsBreakdown(type, breakdown) {
    const container = document.getElementById(`log-stats-${type}`);
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Add breakdown items
    for (const [key, value] of Object.entries(breakdown)) {
        const item = document.createElement('div');
        item.className = 'flex justify-between';
        
        const label = document.createElement('span');
        label.className = 'text-gray-600';
        label.textContent = key;
        
        const count = document.createElement('span');
        count.className = 'font-semibold';
        count.textContent = value;
        
        item.appendChild(label);
        item.appendChild(count);
        container.appendChild(item);
    }
    
    // If no items, add a message
    if (Object.keys(breakdown).length === 0) {
        const noData = document.createElement('div');
        noData.className = 'text-gray-500 text-center';
        noData.textContent = 'Keine Daten verfügbar';
        container.appendChild(noData);
    }
}

// Update sensor error breakdown
function updateSensorErrorBreakdown(sensorBreakdown) {
    const container = document.getElementById('log-stats-sensors');
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Get sensors with errors and sort by error count
    const sensorsWithErrors = Object.entries(sensorBreakdown)
        .filter(([_, data]) => data.errors > 0)
        .sort((a, b) => b[1].errors - a[1].errors)
        .slice(0, 5); // Top 5
    
    // Add breakdown items
    for (const [sensorName, data] of sensorsWithErrors) {
        const item = document.createElement('div');
        item.className = 'flex justify-between mb-1';
        
        const label = document.createElement('span');
        label.className = 'text-gray-600';
        label.textContent = sensorName;
        
        const stats = document.createElement('span');
        stats.className = 'font-semibold';
        stats.textContent = `${data.errors} Fehler (${((data.errors / data.total) * 100).toFixed(1)}%)`;
        
        item.appendChild(label);
        item.appendChild(stats);
        container.appendChild(item);
    }
    
    // If no items, add a message
    if (sensorsWithErrors.length === 0) {
        const noData = document.createElement('div');
        noData.className = 'text-gray-500 text-center';
        noData.textContent = 'Keine Sensor-Fehler gefunden';
        container.appendChild(noData);
    }
}

// Load sensors data
function loadSensorsData() {
    console.log("Loading sensors data...");
    
    fetch('/api/sensors/status')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                state.sensorData = data.data;
                updateSensorsView(data.data);
                populateGroupFilter(data.data);
            } else {
                console.error("Error loading sensors:", data.error);
            }
        })
        .catch(error => {
            console.error("Error loading sensors data:", error);
        });
}

// Update sensors view
function updateSensorsView(data) {
    const sensorsTable = document.getElementById('sensors-table');
    if (!sensorsTable) return;
    
    // Clear existing rows
    sensorsTable.innerHTML = '';
    
    // Flatten sensors from all groups
    const allSensors = [];
    for (const groupName in data.groups) {
        const group = data.groups[groupName];
        for (const sensor of group.sensors) {
            sensor.group = groupName; // Add group name to sensor
            allSensors.push(sensor);
        }
    }
    
    // Sort by status (error first, then unknown, then active)
    allSensors.sort((a, b) => {
        const statusOrder = { 'error': 0, 'crc_error': 1, 'timeout': 2, 'unknown': 3, 'active': 4 };
        return statusOrder[a.status] - statusOrder[b.status];
    });
    
    // Apply filters
    const groupFilter = document.getElementById('group-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    
    const filteredSensors = allSensors.filter(sensor => {
        const groupMatch = groupFilter === 'all' || sensor.group === groupFilter;
        const statusMatch = statusFilter === 'all' || sensor.status === statusFilter;
        return groupMatch && statusMatch;
    });
    
    // Add rows for sensors
    for (const sensor of filteredSensors) {
        const row = document.createElement('tr');
        
        // Sensor name
        const nameCell = document.createElement('td');
        nameCell.className = 'px-6 py-4 whitespace-nowrap';
        nameCell.innerHTML = `<div class="font-medium text-gray-900">${sensor.name}</div>`;
        row.appendChild(nameCell);
        
        // Description
        const descCell = document.createElement('td');
        descCell.className = 'px-6 py-4 whitespace-nowrap';
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
        valueCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        valueCell.textContent = sensor.last_reading ? sensor.last_reading.value : 'N/A';
        row.appendChild(valueCell);
        
        // Timestamp
        const timestampCell = document.createElement('td');
        timestampCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        if (sensor.last_reading && sensor.last_reading.timestamp) {
            const timestamp = new Date(sensor.last_reading.timestamp);
            timestampCell.textContent = timestamp.toLocaleString();
        } else {
            timestampCell.textContent = 'N/A';
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
        
        sensorsTable.appendChild(row);
    }
    
    // If no sensors, add a message
    if (filteredSensors.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 7;
        cell.className = 'px-6 py-4 text-center text-gray-500';
        cell.textContent = 'Keine Sensoren gefunden.';
        row.appendChild(cell);
        sensorsTable.appendChild(row);
    }
}

// Populate group filter dropdown
function populateGroupFilter(data) {
    const groupFilter = document.getElementById('group-filter');
    if (!groupFilter) return;
    
    // Clear existing options except 'all'
    while (groupFilter.options.length > 1) {
        groupFilter.remove(1);
    }
    
    // Add group options
    const groups = Object.keys(data.groups);
    for (const group of groups) {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = data.groups[group].display_name || group;
        groupFilter.appendChild(option);
    }
}

// Filter sensors based on dropdown selections
function filterSensors() {
    if (state.sensorData) {
        updateSensorsView(state.sensorData);
    }
}

// Show sensor details in modal
function showSensorDetails(sensor) {
    const modal = document.getElementById('sensor-details-modal');
    if (!modal) return;
    
    // Set sensor details in modal
    document.getElementById('modal-sensor-name').textContent = sensor.name;
    document.getElementById('modal-description').textContent = sensor.description;
    document.getElementById('modal-group').textContent = sensor.group;
    document.getElementById('modal-priority').textContent = sensor.priority;
    document.getElementById('modal-polling').textContent = `${sensor.polling_interval} s`;
    document.getElementById('modal-enabled').textContent = sensor.enabled ? 'Ja' : 'Nein';
    document.getElementById('modal-writable').textContent = sensor.writable ? 'Ja' : 'Nein';
    document.getElementById('modal-address').textContent = sensor.nasa_address || 'N/A';
    document.getElementById('modal-entity-id').textContent = sensor.hass_entity_id || 'N/A';
    
    document.getElementById('modal-status').textContent = sensor.status.toUpperCase();
    document.getElementById('modal-status').className = `font-semibold status-${sensor.status}`;
    
    document.getElementById('modal-last-value').textContent = sensor.last_reading ? sensor.last_reading.value : 'N/A';
    
    if (sensor.last_reading && sensor.last_reading.timestamp) {
        const timestamp = new Date(sensor.last_reading.timestamp);
        document.getElementById('modal-timestamp').textContent = timestamp.toLocaleString();
    } else {
        document.getElementById('modal-timestamp').textContent = 'N/A';
    }
    
    document.getElementById('modal-response-time').textContent = sensor.last_reading && sensor.last_reading.response_time_ms ? 
        `${sensor.last_reading.response_time_ms.toFixed(2)} ms` : 'N/A';
    
    document.getElementById('modal-success-rate').textContent = `${sensor.statistics.success_rate.toFixed(2)}%`;
    document.getElementById('modal-error-count').textContent = sensor.statistics.error_count;
    
    // Set form values
    document.getElementById('modal-input-polling').value = sensor.polling_interval;
    document.getElementById('modal-input-priority').value = sensor.priority;
    document.getElementById('modal-input-enabled').checked = sensor.enabled;
    
    // Load MQTT history
    loadSensorMQTTHistory(sensor.name);
    
    // Show modal
    modal.classList.remove('hidden');
}

// Load MQTT history for a sensor
function loadSensorMQTTHistory(sensorName) {
    const historyContainer = document.getElementById('modal-mqtt-history');
    if (!historyContainer) return;
    
    // Show loading
    historyContainer.innerHTML = '<p class="text-center text-gray-500">Lade MQTT-Historie...</p>';
    
    fetch(`/api/mqtt/history/${sensorName}?hours=24`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateSensorMQTTHistory(data.data);
            } else {
                historyContainer.innerHTML = `<p class="text-center text-red-500">Fehler: ${data.error}</p>`;
            }
        })
        .catch(error => {
            historyContainer.innerHTML = `<p class="text-center text-red-500">Fehler beim Laden der MQTT-Historie: ${error}</p>`;
        });
}

// Update MQTT history in modal
function updateSensorMQTTHistory(data) {
    const historyContainer = document.getElementById('modal-mqtt-history');
    if (!historyContainer) return;
    
    // Clear container
    historyContainer.innerHTML = '';
    
    if (data.messages.length === 0 && data.communication_flows.length === 0) {
        historyContainer.innerHTML = '<p class="text-center text-gray-500">Keine MQTT-Historie verfügbar.</p>';
        return;
    }
    
    // Create table for communication flows
    const table = document.createElement('table');
    table.className = 'min-w-full divide-y divide-gray-200';
    
    // Table header
    const thead = document.createElement('thead');
    thead.className = 'bg-gray-50';
    thead.innerHTML = `
        <tr>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zeit</th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wert</th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Table body
    const tbody = document.createElement('tbody');
    tbody.className = 'bg-white divide-y divide-gray-200';
    
    // Add rows for communication flows
    for (const flow of data.communication_flows) {
        const row = document.createElement('tr');
        
        // Timestamp
        const timestampCell = document.createElement('td');
        timestampCell.className = 'px-3 py-2 whitespace-nowrap text-sm text-gray-500';
        const timestamp = new Date(flow.timestamp);
        timestampCell.textContent = timestamp.toLocaleTimeString();
        row.appendChild(timestampCell);
        
        // Type
        const typeCell = document.createElement('td');
        typeCell.className = 'px-3 py-2 whitespace-nowrap text-sm';
        const typeBadge = document.createElement('span');
        typeBadge.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            flow.initiated_by === 'home_assistant' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
        }`;
        typeBadge.textContent = flow.initiated_by === 'home_assistant' ? 'SET' : 'STATE';
        typeCell.appendChild(typeBadge);
        row.appendChild(typeCell);
        
        // Value
        const valueCell = document.createElement('td');
        valueCell.className = 'px-3 py-2 whitespace-nowrap text-sm text-gray-500';
        if (flow.initiated_by === 'home_assistant') {
            valueCell.textContent = flow.set_value || 'N/A';
        } else {
            valueCell.textContent = flow.state_value || 'N/A';
        }
        row.appendChild(valueCell);
        
        // Status
        const statusCell = document.createElement('td');
        statusCell.className = 'px-3 py-2 whitespace-nowrap text-sm';
        const statusBadge = document.createElement('span');
        statusBadge.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            flow.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`;
        statusBadge.textContent = flow.success ? 'OK' : 'FEHLER';
        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);
        
        tbody.appendChild(row);
    }
    
    table.appendChild(tbody);
    historyContainer.appendChild(table);
}

// Save sensor configuration
function saveSensorConfig() {
    const sensorName = document.getElementById('modal-sensor-name').textContent;
    
    const updates = {
        polling_interval: parseInt(document.getElementById('modal-input-polling').value),
        priority: parseInt(document.getElementById('modal-input-priority').value),
        enabled: document.getElementById('modal-input-enabled').checked
    };
    
    fetch(`/api/config/parameter/${sensorName}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Sensor-Konfiguration erfolgreich gespeichert!');
                document.getElementById('sensor-details-modal').classList.add('hidden');
                loadSensorsData(); // Reload sensors data
            } else {
                alert(`Fehler: ${data.error}`);
            }
        })
        .catch(error => {
            alert(`Fehler beim Speichern der Konfiguration: ${error}`);
        });
}

// Save group configuration
function saveGroupConfig() {
    const groupName = document.getElementById('group-modal-name').textContent;
    
    const updates = {
        default_polling_interval: parseInt(document.getElementById('group-modal-polling').value),
        enabled: document.getElementById('group-modal-enabled').checked
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
                alert('Gruppen-Konfiguration erfolgreich gespeichert!');
                document.getElementById('group-edit-modal').classList.add('hidden');
                loadConfigData(); // Reload config data
            } else {
                alert(`Fehler: ${data.error}`);
            }
        })
        .catch(error => {
            alert(`Fehler beim Speichern der Konfiguration: ${error}`);
        });
}

// Load MQTT data
function loadMQTTData() {
    console.log("Loading MQTT data...");
    
    fetch('/api/mqtt/stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                state.mqttData = data.data;
                updateMQTTView(data.data);
            } else {
                console.error("Error loading MQTT data:", data.error);
            }
        })
        .catch(error => {
            console.error("Error loading MQTT data:", error);
        });
    
    // Load sensors for filter
    fetch('/api/sensors/status')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateMQTTSensorFilter(data.data);
            } else {
                console.error("Error loading sensors for MQTT filter:", data.error);
            }
        })
        .catch(error => {
            console.error("Error loading sensors for MQTT filter:", error);
        });
}

// Update MQTT view
function updateMQTTView(data) {
    // Update MQTT stats
    updateMQTTStats(data);
    
    // Update recent errors
    updateMQTTRecentErrors(data.recent_errors);
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
    document.getElementById('mqtt-stats-conv-rate').textContent = `${data.conversion_stats.conversion_success_rate.toFixed(2)}%`;
    
    // Flow stats
    document.getElementById('mqtt-stats-flow-total').textContent = data.flow_stats.total_flows;
    document.getElementById('mqtt-stats-flow-success').textContent = data.flow_stats.successful_flows;
    document.getElementById('mqtt-stats-flow-rate').textContent = `${data.flow_stats.success_rate.toFixed(2)}%`;
    document.getElementById('mqtt-stats-flow-time').textContent = `${data.flow_stats.avg_response_time_ms.toFixed(2)} ms`;
}

// Update MQTT recent errors
function updateMQTTRecentErrors(errors) {
    const container = document.getElementById('mqtt-recent-errors');
    if (!container) return;
    
    // Clear existing errors
    container.innerHTML = '';
    
    if (errors.length === 0) {
        const noErrors = document.createElement('div');
        noErrors.className = 'p-4 bg-green-50 rounded-lg';
        noErrors.innerHTML = '<p class="text-green-700">Keine Fehler in der letzten Stunde! 🎉</p>';
        container.appendChild(noErrors);
        return;
    }
    
    // Add errors
    for (const error of errors) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'p-4 bg-red-50 rounded-lg mb-4';
        
        const timestamp = new Date(error.timestamp);
        
        errorDiv.innerHTML = `
            <div class="flex justify-between">
                <h3 class="text-red-800 font-medium">${error.type}</h3>
                <span class="text-sm text-gray-500">${timestamp.toLocaleString()}</span>
            </div>
            <p class="text-red-700 mt-1">${error.message}</p>
            <p class="text-sm text-gray-600 mt-2">${error.sensor ? `Sensor: ${error.sensor}` : ''}</p>
            <p class="text-xs text-gray-500 mt-1">${error.details}</p>
        `;
        
        container.appendChild(errorDiv);
    }
}

// Populate MQTT sensor filter
function populateMQTTSensorFilter(data) {
    const sensorFilter = document.getElementById('mqtt-sensor-filter');
    if (!sensorFilter) return;
    
    // Clear existing options except the first one
    while (sensorFilter.options.length > 1) {
        sensorFilter.remove(1);
    }
    
    // Collect all sensors
    const allSensors = [];
    for (const groupName in data.groups) {
        const group = data.groups[groupName];
        for (const sensor of group.sensors) {
            allSensors.push(sensor);
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
}

// Load MQTT history for a specific sensor
function loadMQTTHistory(sensorName) {
    const historyContainer = document.getElementById('mqtt-history-container');
    const historyTable = document.getElementById('mqtt-history-table');
    
    if (!historyContainer || !historyTable) return;
    
    // Show loading
    historyTable.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center">Lade MQTT-Historie...</td></tr>';
    
    fetch(`/api/mqtt/history/${sensorName}?hours=24`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateMQTTHistoryTable(data.data);
            } else {
                historyTable.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center text-red-500">Fehler: ${data.error}</td></tr>`;
            }
        })
        .catch(error => {
            historyTable.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center text-red-500">Fehler beim Laden der MQTT-Historie: ${error}</td></tr>`;
        });
}

// Update MQTT history table
function updateMQTTHistoryTable(data) {
    const historyTable = document.getElementById('mqtt-history-table');
    if (!historyTable) return;
    
    // Clear table
    historyTable.innerHTML = '';
    
    // Combine messages and flows for chronological display
    const allEvents = [];
    
    // Add messages
    for (const message of data.messages) {
        allEvents.push({
            type: 'message',
            timestamp: message.timestamp,
            data: message
        });
    }
    
    // Add flows
    for (const flow of data.communication_flows) {
        allEvents.push({
            type: 'flow',
            timestamp: flow.timestamp,
            data: flow
        });
    }
    
    // Sort by timestamp (newest first)
    allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Add rows
    for (const event of allEvents) {
        const row = document.createElement('tr');
        
        if (event.type === 'message') {
            const message = event.data;
            
            // Timestamp
            const timestampCell = document.createElement('td');
            timestampCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
            const timestamp = new Date(message.timestamp);
            timestampCell.textContent = timestamp.toLocaleString();
            row.appendChild(timestampCell);
            
            // Type
            const typeCell = document.createElement('td');
            typeCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
            const typeBadge = document.createElement('span');
            typeBadge.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                message.type === 'set_command' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
            }`;
            typeBadge.textContent = message.type.toUpperCase();
            typeCell.appendChild(typeBadge);
            row.appendChild(typeCell);
            
            // Initiated by
            const initiatedCell = document.createElement('td');
            initiatedCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
            initiatedCell.textContent = message.type === 'set_command' ? 'Home Assistant' : 'EHS-Sentinel';
            row.appendChild(initiatedCell);
            
            // SET value
            const setCell = document.createElement('td');
            setCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
            setCell.textContent = message.type === 'set_command' ? message.payload : '-';
            row.appendChild(setCell);
            
            // STATE value
            const stateCell = document.createElement('td');
            stateCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
            stateCell.textContent = message.type === 'state_update' ? message.payload : '-';
            row.appendChild(stateCell);
            
            // Response time
            const responseCell = document.createElement('td');
            responseCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
            responseCell.textContent = '-';
            row.appendChild(responseCell);
            
            // Status
            const statusCell = document.createElement('td');
            statusCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
            statusCell.textContent = '-';
            row.appendChild(statusCell);
            
        } else if (event.type === 'flow') {
            const flow = event.data;
            
            // Timestamp
            const timestampCell = document.createElement('td');
            timestampCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
            const timestamp = new Date(flow.timestamp);
            timestampCell.textContent = timestamp.toLocaleString();
            row.appendChild(timestampCell);
            
            // Type
            const typeCell = document.createElement('td');
            typeCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
            const typeBadge = document.createElement('span');
            typeBadge.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800';
            typeBadge.textContent = 'FLOW';
            typeCell.appendChild(typeBadge);
            row.appendChild(typeCell);
            
            // Initiated by
            const initiatedCell = document.createElement('td');
            initiatedCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
            initiatedCell.textContent = flow.initiated_by === 'home_assistant' ? 'Home Assistant' : 'EHS-Sentinel';
            row.appendChild(initiatedCell);
            
            // SET value
            const setCell = document.createElement('td');
            setCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
            setCell.textContent = flow.set_value || '-';
            row.appendChild(setCell);
            
            // STATE value
            const stateCell = document.createElement('td');
            stateCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
            stateCell.textContent = flow.state_value || '-';
            row.appendChild(stateCell);
            
            // Response time
            const responseCell = document.createElement('td');
            responseCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
            responseCell.textContent = flow.response_time_ms ? `${flow.response_time_ms.toFixed(2)} ms` : '-';
            row.appendChild(responseCell);
            
            // Status
            const statusCell = document.createElement('td');
            statusCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
            const statusBadge = document.createElement('span');
            statusBadge.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                flow.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`;
            statusBadge.textContent = flow.success ? 'OK' : 'FEHLER';
            statusCell.appendChild(statusBadge);
            row.appendChild(statusCell);
        }
        
        historyTable.appendChild(row);
    }
    
    // If no events, add a message
    if (allEvents.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 7;
        cell.className = 'px-6 py-4 text-center text-gray-500';
        cell.textContent = 'Keine MQTT-Historie verfügbar.';
        row.appendChild(cell);
        historyTable.appendChild(row);
    }
}

// Load logs data
function loadLogsData() {
    console.log("Loading logs data...");
    
    // Load log stats
    fetch('/api/logs/stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateLogStats(data.data);
            } else {
                console.error("Error loading log stats:", data.error);
            }
        })
        .catch(error => {
            console.error("Error loading log stats:", error);
        });
    
    // Load sensors for filter
    fetch('/api/sensors/status')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateLogSensorFilter(data.data);
            } else {
                console.error("Error loading sensors for log filter:", data.error);
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
    // Update level breakdown
    updateLogStatsBreakdown('level', data.level_breakdown);
    
    // Update category breakdown
    updateLogStatsBreakdown('category', data.category_breakdown);
    
    // Update sensor breakdown
    updateSensorErrorBreakdown(data.sensor_breakdown);
}

// Populate log sensor filter
function populateLogSensorFilter(data) {
    const sensorFilter = document.getElementById('log-filter-sensor');
    if (!sensorFilter) return;
    
    // Clear existing options except the first one
    while (sensorFilter.options.length > 1) {
        sensorFilter.remove(1);
    }
    
    // Collect all sensors
    const allSensors = [];
    for (const groupName in data.groups) {
        const group = data.groups[groupName];
        for (const sensor of group.sensors) {
            allSensors.push(sensor);
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
}

// Load log entries
function loadLogEntries(limit = 50, offset = 0) {
    const entriesTable = document.getElementById('log-entries-table');
    if (!entriesTable) return;
    
    // Show loading
    if (offset === 0) {
        entriesTable.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center">Lade Log-Einträge...</td></tr>';
    }
    
    // Get filter values
    const level = document.getElementById('log-filter-level').value;
    const category = document.getElementById('log-filter-category').value;
    const sensor = document.getElementById('log-filter-sensor').value;
    const startTime = document.getElementById('log-filter-start').value;
    const endTime = document.getElementById('log-filter-end').value;
    const errorsOnly = document.getElementById('log-filter-errors').checked;
    
    // Build query string
    let queryString = `limit=${limit}&offset=${offset}`;
    if (level) queryString += `&level=${level}`;
    if (category) queryString += `&category=${category}`;
    if (sensor) queryString += `&sensor_name=${sensor}`;
    if (startTime) queryString += `&start_time=${startTime}`;
    if (endTime) queryString += `&end_time=${endTime}`;
    if (errorsOnly) queryString += `&errors_only=true`;
    
    fetch(`/api/logs?${queryString}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateLogEntriesTable(data.data.logs, offset === 0);
            } else {
                entriesTable.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Fehler: ${data.error}</td></tr>`;
            }
        })
        .catch(error => {
            entriesTable.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Fehler beim Laden der Logs: ${error}</td></tr>`;
        });
}

// Update log entries table
function updateLogEntriesTable(logs, clearTable = true) {
    const entriesTable = document.getElementById('log-entries-table');
    if (!entriesTable) return;
    
    // Clear table if needed
    if (clearTable) {
        entriesTable.innerHTML = '';
    }
    
    // If no logs, add a message
    if (logs.length === 0) {
        if (clearTable) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 6;
            cell.className = 'px-6 py-4 text-center text-gray-500';
            cell.textContent = 'Keine Log-Einträge gefunden.';
            row.appendChild(cell);
            entriesTable.appendChild(row);
        }
        return;
    }
    
    // Add rows for logs
    for (const log of logs) {
        const row = document.createElement('tr');
        
        // Timestamp
        const timestampCell = document.createElement('td');
        timestampCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        const timestamp = new Date(log.timestamp);
        timestampCell.textContent = timestamp.toLocaleString();
        row.appendChild(timestampCell);
        
        // Level
        const levelCell = document.createElement('td');
        levelCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
        const levelBadge = document.createElement('span');
        levelBadge.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            log.level === 'ERROR' ? 'bg-red-100 text-red-800' :
            log.level === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
            log.level === 'INFO' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
        }`;
        levelBadge.textContent = log.level;
        levelCell.appendChild(levelBadge);
        row.appendChild(levelCell);
        
        // Category
        const categoryCell = document.createElement('td');
        categoryCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        categoryCell.textContent = log.category;
        row.appendChild(categoryCell);
        
        // Sensor
        const sensorCell = document.createElement('td');
        sensorCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        sensorCell.textContent = log.sensor_name || '-';
        row.appendChild(sensorCell);
        
        // Message
        const messageCell = document.createElement('td');
        messageCell.className = 'px-6 py-4 text-sm text-gray-500';
        messageCell.textContent = log.message;
        row.appendChild(messageCell);
        
        // Details
        const detailsCell = document.createElement('td');
        detailsCell.className = 'px-6 py-4 text-sm text-gray-500';
        
        // Create details button if there are details
        if (log.details && Object.keys(log.details).length > 0) {
            const detailsButton = document.createElement('button');
            detailsButton.className = 'text-indigo-600 hover:text-indigo-900';
            detailsButton.textContent = 'Details anzeigen';
            detailsButton.addEventListener('click', () => {
                alert(JSON.stringify(log.details, null, 2));
            });
            detailsCell.appendChild(detailsButton);
        } else {
            detailsCell.textContent = '-';
        }
        
        row.appendChild(detailsCell);
        
        entriesTable.appendChild(row);
    }
}

// Apply log filter settings
function applyLogFilterSettings() {
    loadLogEntries();
}

// Load more log entries
function loadMoreLogEntries() {
    const entriesTable = document.getElementById('log-entries-table');
    if (!entriesTable) return;
    
    const currentEntries = entriesTable.querySelectorAll('tr').length;
    loadLogEntries(50, currentEntries);
}

// Export log data
function exportLogData() {
    // Get filter values
    const level = document.getElementById('log-filter-level').value;
    const category = document.getElementById('log-filter-category').value;
    const sensor = document.getElementById('log-filter-sensor').value;
    const startTime = document.getElementById('log-filter-start').value;
    const endTime = document.getElementById('log-filter-end').value;
    const errorsOnly = document.getElementById('log-filter-errors').checked;
    const format = 'json'; // or 'csv'
    
    // Build query string
    let queryString = `format=${format}`;
    if (level) queryString += `&level=${level}`;
    if (category) queryString += `&category=${category}`;
    if (sensor) queryString += `&sensor_name=${sensor}`;
    if (startTime) queryString += `&start_time=${startTime}`;
    if (endTime) queryString += `&end_time=${endTime}`;
    if (errorsOnly) queryString += `&errors_only=true`;
    
    // Open export URL in new tab
    window.open(`/api/logs/export?${queryString}`, '_blank');
}

// Load configuration data
function loadConfigData() {
    console.log("Loading configuration data...");
    
    fetch('/api/config/ui')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                state.configData = data.data;
                updateConfigView(data.data);
            } else {
                console.error("Error loading configuration:", data.error);
            }
        })
        .catch(error => {
            console.error("Error loading configuration:", error);
        });
}

// Update configuration view
function updateConfigView(data) {
    // Update group configuration table
    updateGroupConfigTable(data.groups);
    
    // Update parameter configuration table
    updateParameterConfigTable(data.parameters);
    
    // Populate config group filter
    populateConfigGroupFilter(data.groups);
}

// Update group configuration table
function updateGroupConfigTable(groups) {
    const groupTable = document.getElementById('group-config-table');
    if (!groupTable) return;
    
    // Clear existing rows
    groupTable.innerHTML = '';
    
    // Sort groups by priority
    const sortedGroups = Object.entries(groups)
        .sort(([, a], [, b]) => a.priority - b.priority);
    
    // Add rows for groups
    for (const [groupName, group] of sortedGroups) {
        const row = document.createElement('tr');
        
        // Group name
        const nameCell = document.createElement('td');
        nameCell.className = 'px-6 py-4 whitespace-nowrap';
        nameCell.innerHTML = `<div class="font-medium text-gray-900">${groupName}</div>`;
        row.appendChild(nameCell);
        
        // Description
        const descCell = document.createElement('td');
        descCell.className = 'px-6 py-4 whitespace-nowrap';
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
        pollingCell.textContent = `${group.default_polling_interval} s`;
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
        statusBadge.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            group.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`;
        statusBadge.textContent = group.enabled ? 'AKTIV' : 'INAKTIV';
        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);
        
        // Actions
        const actionsCell = document.createElement('td');
        actionsCell.className = 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium';
        
        const editButton = document.createElement('button');
        editButton.className = 'text-indigo-600 hover:text-indigo-900';
        editButton.textContent = 'Bearbeiten';
        editButton.addEventListener('click', () => {
            showGroupEditModal(groupName, group);
        });
        actionsCell.appendChild(editButton);
        
        row.appendChild(actionsCell);
        
        groupTable.appendChild(row);
    }
}

// Show group edit modal
function showGroupEditModal(groupName, group) {
    const modal = document.getElementById('group-edit-modal');
    if (!modal) return;
    
    // Set group details in modal
    document.getElementById('group-modal-name').textContent = groupName;
    document.getElementById('group-modal-polling').value = group.default_polling_interval;
    document.getElementById('group-modal-enabled').checked = group.enabled;
    
    // Show modal
    modal.classList.remove('hidden');
}

// Update parameter configuration table
function updateParameterConfigTable(parameters) {
    const paramTable = document.getElementById('parameter-config-table');
    if (!paramTable) return;
    
    // Clear existing rows
    paramTable.innerHTML = '';
    
    // Get selected group filter
    const groupFilter = document.getElementById('config-group-filter').value;
    
    // Filter and sort parameters
    const filteredParams = Object.entries(parameters)
        .filter(([, param]) => groupFilter === 'all' || param.group === groupFilter)
        .sort(([, a], [, b]) => a.priority - b.priority);
    
    // Add rows for parameters
    for (const [paramName, param] of filteredParams) {
        const row = document.createElement('tr');
        
        // Parameter name
        const nameCell = document.createElement('td');
        nameCell.className = 'px-6 py-4 whitespace-nowrap';
        nameCell.innerHTML = `<div class="font-medium text-gray-900">${paramName}</div>`;
        row.appendChild(nameCell);
        
        // Description
        const descCell = document.createElement('td');
        descCell.className = 'px-6 py-4 whitespace-nowrap';
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
        pollingCell.textContent = `${param.polling_interval} s`;
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
        enabledBadge.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            param.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`;
        enabledBadge.textContent = param.enabled ? 'JA' : 'NEIN';
        enabledCell.appendChild(enabledBadge);
        row.appendChild(enabledCell);
        
        // Actions
        const actionsCell = document.createElement('td');
        actionsCell.className = 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium';
        
        const editButton = document.createElement('button');
        editButton.className = 'text-indigo-600 hover:text-indigo-900';
        editButton.textContent = 'Bearbeiten';
        editButton.addEventListener('click', () => {
            showSensorDetails({
                name: paramName,
                description: param.display_name,
                group: param.group,
                priority: param.priority,
                polling_interval: param.polling_interval,
                enabled: param.enabled,
                writable: param.writable,
                nasa_address: param.nasa_address,
                hass_entity_id: param.hass_entity_id,
                last_reading: null,
                status: 'unknown',
                statistics: {
                    total_readings: 0,
                    error_count: 0,
                    success_rate: 100,
                    error_breakdown: {}
                }
            });
        });
        actionsCell.appendChild(editButton);
        
        row.appendChild(actionsCell);
        
        paramTable.appendChild(row);
    }
    
    // If no parameters, add a message
    if (filteredParams.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 8;
        cell.className = 'px-6 py-4 text-center text-gray-500';
        cell.textContent = 'Keine Parameter gefunden.';
        row.appendChild(cell);
        paramTable.appendChild(row);
    }
}

// Populate config group filter
function populateConfigGroupFilter(groups) {
    const groupFilter = document.getElementById('config-group-filter');
    if (!groupFilter) return;
    
    // Clear existing options except 'all'
    while (groupFilter.options.length > 1) {
        groupFilter.remove(1);
    }
    
    // Add group options
    const groupNames = Object.keys(groups);
    for (const groupName of groupNames) {
        const option = document.createElement('option');
        option.value = groupName;
        option.textContent = groups[groupName].display_name || groupName;
        groupFilter.appendChild(option);
    }
    
    // Add change event listener
    groupFilter.addEventListener('change', () => {
        updateParameterConfigTable(state.configData.parameters);
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
    fetch(`/api/documentation/${docType}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                state.docData[docType] = data.data;
                updateDocumentationView(docType, data.data);
            } else {
                console.error(`Error loading ${docType} documentation:`, data.error);
                document.getElementById(`${docType}-doc-content`).innerHTML = `<div class="p-4 bg-red-50 rounded-lg"><p class="text-red-700">Fehler beim Laden der Dokumentation: ${data.error}</p></div>`;
            }
        })
        .catch(error => {
            console.error(`Error loading ${docType} documentation:`, error);
            document.getElementById(`${docType}-doc-content`).innerHTML = `<div class="p-4 bg-red-50 rounded-lg"><p class="text-red-700">Fehler beim Laden der Dokumentation: ${error}</p></div>`;
        });
}

// Update documentation view
function updateDocumentationView(docType, data) {
    const contentElement = document.getElementById(`${docType}-doc-content`);
    if (!contentElement) return;
    
    if (data.format === 'markdown') {
        // Use marked.js to render markdown
        contentElement.innerHTML = marked.parse(data.content);
    } else {
        contentElement.textContent = data.content;
    }
}

// Generate documentation
function generateDocumentation() {
    const outputDir = '/data/documentation';
    
    fetch('/api/documentation/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ output_dir: outputDir })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`Dokumentation erfolgreich generiert in: ${outputDir}`);
                // Reload documentation
                loadDocumentation();
            } else {
                alert(`Fehler: ${data.error}`);
            }
        })
        .catch(error => {
            alert(`Fehler bei der Dokumentationsgenerierung: ${error}`);
        });
}