// EHS-Sentinel Monitoring UI
console.log("Initializing EHS-Sentinel UI...");

// API Base URL - automatically detects the correct URL based on the environment
const API_BASE_URL = window.location.protocol + '//' + window.location.host;

// Tab Navigation
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
    Object.keys(tabs).forEach(tabId => {
        const tab = document.getElementById(tabId);
        if (tab) {
            tab.addEventListener('click', () => {
                // Hide all tab contents
                Object.values(tabs).forEach(viewId => {
                    const view = document.getElementById(viewId);
                    if (view) view.classList.add('hidden');
                });
                
                // Show selected tab content
                const view = document.getElementById(tabs[tabId]);
                if (view) view.classList.remove('hidden');
                
                // Update tab styles
                Object.keys(tabs).forEach(id => {
                    const t = document.getElementById(id);
                    if (t) {
                        t.classList.remove('tab-active');
                        t.classList.add('tab-inactive');
                    }
                });
                
                tab.classList.remove('tab-inactive');
                tab.classList.add('tab-active');
                
                // Load data for the selected tab
                if (tabId === 'tab-sensors') {
                    loadSensorsData();
                } else if (tabId === 'tab-mqtt') {
                    loadMQTTData();
                } else if (tabId === 'tab-logs') {
                    loadLogsData();
                } else if (tabId === 'tab-config') {
                    loadConfigurationData();
                } else if (tabId === 'tab-docs') {
                    loadDocumentation();
                }
            });
        }
    });
    
    // Initialize documentation tabs
    const docTabs = {
        'doc-tab-mqtt': 'doc-view-mqtt',
        'doc-tab-conversion': 'doc-view-conversion',
        'doc-tab-troubleshooting': 'doc-view-troubleshooting'
    };
    
    Object.keys(docTabs).forEach(tabId => {
        const tab = document.getElementById(tabId);
        if (tab) {
            tab.addEventListener('click', () => {
                // Hide all doc contents
                Object.values(docTabs).forEach(viewId => {
                    const view = document.getElementById(viewId);
                    if (view) view.classList.add('hidden');
                });
                
                // Show selected doc content
                const view = document.getElementById(docTabs[tabId]);
                if (view) view.classList.remove('hidden');
                
                // Update tab styles
                Object.keys(docTabs).forEach(id => {
                    const t = document.getElementById(id);
                    if (t) {
                        t.classList.remove('tab-active');
                        t.classList.add('tab-inactive');
                    }
                });
                
                tab.classList.remove('tab-inactive');
                tab.classList.add('tab-active');
                
                // Load documentation content if needed
                if (tabId === 'doc-tab-mqtt') {
                    loadMQTTDocumentation();
                } else if (tabId === 'doc-tab-conversion') {
                    loadConversionDocumentation();
                } else if (tabId === 'doc-tab-troubleshooting') {
                    loadTroubleshootingDocumentation();
                }
            });
        }
    });
    
    // Load initial dashboard data
    loadDashboardData();
    
    // Set up refresh buttons
    const refreshButtons = {
        'refresh-sensors': loadSensorsData,
        'refresh-mqtt': loadMQTTData,
        'refresh-logs': loadLogsData,
        'refresh-config': loadConfigurationData
    };
    
    Object.keys(refreshButtons).forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', refreshButtons[buttonId]);
        }
    });
    
    // Set up modal close buttons
    const closeButtons = ['close-modal', 'close-group-modal'];
    closeButtons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', () => {
                const modalId = buttonId === 'close-modal' ? 'sensor-details-modal' : 'group-edit-modal';
                const modal = document.getElementById(modalId);
                if (modal) modal.classList.add('hidden');
            });
        }
    });
    
    // Set up save buttons
    const saveButtons = {
        'modal-save-config': saveSensorConfig,
        'group-modal-save': saveGroupConfig
    };
    
    Object.keys(saveButtons).forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', saveButtons[buttonId]);
        }
    });
    
    // Set up documentation generation
    const generateDocsButton = document.getElementById('generate-docs');
    if (generateDocsButton) {
        generateDocsButton.addEventListener('click', generateDocumentation);
    }
    
    // Set up MQTT history loading
    const mqttLoadHistoryButton = document.getElementById('mqtt-load-history');
    if (mqttLoadHistoryButton) {
        mqttLoadHistoryButton.addEventListener('click', loadMQTTHistory);
    }
    
    // Set up log filters
    const applyLogFiltersButton = document.getElementById('apply-log-filters');
    if (applyLogFiltersButton) {
        applyLogFiltersButton.addEventListener('click', applyLogFilters);
    }
    
    // Set up log export
    const exportLogsButton = document.getElementById('export-logs');
    if (exportLogsButton) {
        exportLogsButton.addEventListener('click', exportLogs);
    }
    
    // Set up load more logs
    const loadMoreLogsButton = document.getElementById('load-more-logs');
    if (loadMoreLogsButton) {
        loadMoreLogsButton.addEventListener('click', loadMoreLogs);
    }
});

// Dashboard Data Loading
function loadDashboardData() {
    console.log("Loading dashboard data...");
    
    // Load health data
    fetch(`${API_BASE_URL}/api/health`)
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
    fetch(`${API_BASE_URL}/api/sensors/status`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateSensorStats(data.data);
                updateCriticalSensors(data.data);
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
                updateMQTTStats(data.data);
                updateRecentErrors(data.data.recent_errors);
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
                updateLogStats(data.data);
            }
        })
        .catch(error => {
            console.error("Error loading log stats:", error);
        });
    
    // Update last update time
    const lastUpdate = document.getElementById('last-update');
    if (lastUpdate) {
        lastUpdate.textContent = `Letzte Aktualisierung: ${new Date().toLocaleTimeString()}`;
    }
}

// Update System Health
function updateSystemHealth(data) {
    const systemHealth = document.getElementById('system-health');
    if (!systemHealth) return;
    
    const status = data.overall_status;
    
    if (status === 'healthy') {
        systemHealth.textContent = '✅ System gesund';
        systemHealth.classList.add('bg-green-100', 'text-green-800');
    } else if (status === 'degraded') {
        systemHealth.textContent = '⚠️ System beeinträchtigt';
        systemHealth.classList.add('bg-yellow-100', 'text-yellow-800');
    } else {
        systemHealth.textContent = '❌ System fehlerhaft';
        systemHealth.classList.add('bg-red-100', 'text-red-800');
    }
}

// Update Sensor Stats
function updateSensorStats(data) {
    const overallHealth = document.getElementById('overall-health');
    const activeSensors = document.getElementById('active-sensors');
    const errorSensors = document.getElementById('error-sensors');
    const unknownSensors = document.getElementById('unknown-sensors');
    
    if (overallHealth) {
        const healthPercent = data.overall_health || 0;
        let healthClass = 'text-green-600';
        
        if (healthPercent < 50) {
            healthClass = 'text-red-600';
        } else if (healthPercent < 80) {
            healthClass = 'text-yellow-600';
        }
        
        overallHealth.textContent = `${healthPercent}%`;
        overallHealth.className = `font-semibold ${healthClass}`;
    }
    
    if (activeSensors) {
        activeSensors.textContent = `${data.active_sensors || 0} / ${data.total_sensors || 0}`;
    }
    
    if (errorSensors) {
        errorSensors.textContent = data.error_sensors || 0;
    }
    
    if (unknownSensors) {
        unknownSensors.textContent = data.unknown_sensors || 0;
    }
}

// Update Critical Sensors
function updateCriticalSensors(data) {
    const table = document.getElementById('critical-sensors-table');
    if (!table) return;
    
    // Clear existing rows
    table.innerHTML = '';
    
    // Get critical sensors (priority 1 and 2)
    const criticalSensors = [];
    
    Object.values(data.groups || {}).forEach(group => {
        group.sensors.forEach(sensor => {
            if (sensor.priority <= 2) {
                criticalSensors.push(sensor);
            }
        });
    });
    
    // Sort by status (error first, then timeout, then unknown, then active)
    criticalSensors.sort((a, b) => {
        const statusOrder = { 'error': 0, 'crc_error': 1, 'timeout': 2, 'unknown': 3, 'active': 4 };
        return statusOrder[a.status] - statusOrder[b.status];
    });
    
    // Add rows for each critical sensor
    criticalSensors.forEach(sensor => {
        const row = document.createElement('tr');
        
        // Status class
        let statusClass = 'status-unknown';
        if (sensor.status === 'active') {
            statusClass = 'status-active';
        } else if (sensor.status === 'error' || sensor.status === 'crc_error') {
            statusClass = 'status-error';
        } else if (sensor.status === 'timeout') {
            statusClass = 'status-timeout';
        }
        
        // Format last reading
        let lastValue = 'N/A';
        let timestamp = 'N/A';
        let responseTime = 'N/A';
        
        if (sensor.last_reading) {
            lastValue = sensor.last_reading.value !== null ? sensor.last_reading.value : 'N/A';
            timestamp = new Date(sensor.last_reading.timestamp).toLocaleString();
            responseTime = sensor.last_reading.response_time_ms !== null ? 
                `${sensor.last_reading.response_time_ms.toFixed(2)} ms` : 'N/A';
        }
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${sensor.name}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                    ${sensor.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${lastValue}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${timestamp}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${responseTime}</td>
        `;
        
        table.appendChild(row);
    });
    
    // If no critical sensors, add a message
    if (criticalSensors.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">
                Keine kritischen Sensoren gefunden.
            </td>
        `;
        table.appendChild(row);
    }
}

// Update MQTT Stats
function updateMQTTStats(data) {
    // Message stats
    const totalMessages = document.getElementById('mqtt-total-messages');
    const recentMessages = document.getElementById('mqtt-recent-messages');
    
    if (totalMessages && data.message_stats) {
        totalMessages.textContent = data.message_stats.total_messages || 0;
    }
    
    if (recentMessages && data.message_stats) {
        recentMessages.textContent = data.message_stats.messages_last_hour || 0;
    }
    
    // Flow stats
    const successRate = document.getElementById('mqtt-success-rate');
    const responseTime = document.getElementById('mqtt-response-time');
    
    if (successRate && data.flow_stats) {
        const rate = data.flow_stats.success_rate || 0;
        successRate.textContent = `${rate.toFixed(2)}%`;
        
        if (rate < 50) {
            successRate.classList.add('text-red-600');
        } else if (rate < 80) {
            successRate.classList.add('text-yellow-600');
        } else {
            successRate.classList.add('text-green-600');
        }
    }
    
    if (responseTime && data.flow_stats) {
        responseTime.textContent = `${data.flow_stats.avg_response_time || 0} ms`;
    }
    
    // MQTT Stats view
    const statsTotal = document.getElementById('mqtt-stats-total');
    const statsHour = document.getElementById('mqtt-stats-hour');
    const statsPending = document.getElementById('mqtt-stats-pending');
    
    if (statsTotal && data.message_stats) {
        statsTotal.textContent = data.message_stats.total_messages || 0;
    }
    
    if (statsHour && data.message_stats) {
        statsHour.textContent = data.message_stats.messages_last_hour || 0;
    }
    
    if (statsPending && data.message_stats) {
        statsPending.textContent = data.message_stats.pending_commands || 0;
    }
    
    // Conversion stats
    const convSuccess = document.getElementById('mqtt-stats-conv-success');
    const convFailed = document.getElementById('mqtt-stats-conv-failed');
    const convRate = document.getElementById('mqtt-stats-conv-rate');
    
    if (data.conversion_stats) {
        if (convSuccess) {
            convSuccess.textContent = data.conversion_stats.successful_conversions || 0;
        }
        
        if (convFailed) {
            convFailed.textContent = data.conversion_stats.failed_conversions || 0;
        }
        
        if (convRate) {
            const rate = data.conversion_stats.conversion_success_rate || 0;
            convRate.textContent = `${rate.toFixed(2)}%`;
            
            if (rate < 50) {
                convRate.classList.add('text-red-600');
            } else if (rate < 80) {
                convRate.classList.add('text-yellow-600');
            } else {
                convRate.classList.add('text-green-600');
            }
        }
    }
    
    // Flow stats
    const flowTotal = document.getElementById('mqtt-stats-flow-total');
    const flowSuccess = document.getElementById('mqtt-stats-flow-success');
    const flowRate = document.getElementById('mqtt-stats-flow-rate');
    const flowTime = document.getElementById('mqtt-stats-flow-time');
    
    if (data.flow_stats) {
        if (flowTotal) {
            flowTotal.textContent = data.flow_stats.total_flows || 0;
        }
        
        if (flowSuccess) {
            flowSuccess.textContent = data.flow_stats.successful_flows || 0;
        }
        
        if (flowRate) {
            const rate = data.flow_stats.success_rate || 0;
            flowRate.textContent = `${rate.toFixed(2)}%`;
            
            if (rate < 50) {
                flowRate.classList.add('text-red-600');
            } else if (rate < 80) {
                flowRate.classList.add('text-yellow-600');
            } else {
                flowRate.classList.add('text-green-600');
            }
        }
        
        if (flowTime) {
            flowTime.textContent = `${data.flow_stats.avg_response_time || 0} ms`;
        }
    }
    
    // Recent errors
    updateMQTTRecentErrors(data.recent_errors || []);
}

// Update MQTT Recent Errors
function updateMQTTRecentErrors(errors) {
    const container = document.getElementById('mqtt-recent-errors');
    if (!container) return;
    
    // Clear existing errors
    container.innerHTML = '';
    
    // Add errors
    if (errors.length === 0) {
        container.innerHTML = `
            <div class="bg-green-50 p-4 rounded-lg">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-green-800">
                            Keine Fehler in der letzten Stunde.
                        </p>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    errors.forEach(error => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-50 p-4 rounded-lg';
        
        errorDiv.innerHTML = `
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">${error.type} - ${error.sensor || 'Unbekannter Sensor'}</h3>
                    <div class="mt-2 text-sm text-red-700">
                        <p>${error.message}</p>
                        <p class="mt-1 text-xs text-red-600">${error.details}</p>
                        <p class="mt-1 text-xs text-gray-500">${new Date(error.timestamp).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(errorDiv);
    });
}

// Update Log Stats
function updateLogStats(data) {
    const totalEntries = document.getElementById('log-total-entries');
    const errorCount = document.getElementById('log-error-count');
    const errorRate = document.getElementById('log-error-rate');
    const avgDuration = document.getElementById('log-avg-duration');
    
    if (totalEntries) {
        totalEntries.textContent = data.total_entries || 0;
    }
    
    if (errorCount && data.level_breakdown) {
        const errors = data.level_breakdown.ERROR || 0;
        errorCount.textContent = errors;
    }
    
    if (errorRate) {
        const rate = data.error_rate || 0;
        errorRate.textContent = `${rate.toFixed(2)}%`;
        
        if (rate > 10) {
            errorRate.classList.add('text-red-600');
        } else if (rate > 5) {
            errorRate.classList.add('text-yellow-600');
        } else {
            errorRate.classList.add('text-green-600');
        }
    }
    
    if (avgDuration && data.performance) {
        avgDuration.textContent = `${data.performance.avg_duration_ms || 0} ms`;
    }
    
    // Update log stats view
    updateLogStatsView(data);
}

// Update Recent Errors
function updateRecentErrors(errors) {
    const container = document.getElementById('recent-errors');
    if (!container) return;
    
    // Clear existing errors
    container.innerHTML = '';
    
    // Add errors
    if (!errors || errors.length === 0) {
        container.innerHTML = `
            <div class="bg-green-50 p-4 rounded-lg">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-green-800">
                            Keine Fehler in der letzten Stunde.
                        </p>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    errors.forEach(error => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-50 p-4 rounded-lg';
        
        errorDiv.innerHTML = `
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">${error.type} - ${error.sensor || 'Unbekannter Sensor'}</h3>
                    <div class="mt-2 text-sm text-red-700">
                        <p>${error.message}</p>
                        <p class="mt-1 text-xs text-red-600">${error.details}</p>
                        <p class="mt-1 text-xs text-gray-500">${new Date(error.timestamp).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(errorDiv);
    });
}

// Sensors Data Loading
function loadSensorsData() {
    console.log("Loading sensors data...");
    
    fetch(`${API_BASE_URL}/api/sensors/status`)
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

// Update Sensors Table
function updateSensorsTable(data, groupFilter = 'all', statusFilter = 'all') {
    const table = document.getElementById('sensors-table');
    if (!table) return;
    
    // Clear existing rows
    table.innerHTML = '';
    
    // Collect all sensors from all groups
    const allSensors = [];
    
    Object.values(data.groups || {}).forEach(group => {
        group.sensors.forEach(sensor => {
            // Add group name to sensor
            sensor.group_name = group.group;
            allSensors.push(sensor);
        });
    });
    
    // Apply filters
    let filteredSensors = allSensors;
    
    if (groupFilter !== 'all') {
        filteredSensors = filteredSensors.filter(sensor => sensor.group_name === groupFilter);
    }
    
    if (statusFilter !== 'all') {
        filteredSensors = filteredSensors.filter(sensor => sensor.status === statusFilter);
    }
    
    // Sort by status (error first, then timeout, then unknown, then active)
    filteredSensors.sort((a, b) => {
        const statusOrder = { 'error': 0, 'crc_error': 1, 'timeout': 2, 'unknown': 3, 'active': 4 };
        return statusOrder[a.status] - statusOrder[b.status];
    });
    
    // Add rows for each sensor
    filteredSensors.forEach(sensor => {
        const row = document.createElement('tr');
        
        // Status class
        let statusClass = 'status-unknown';
        if (sensor.status === 'active') {
            statusClass = 'status-active';
        } else if (sensor.status === 'error' || sensor.status === 'crc_error') {
            statusClass = 'status-error';
        } else if (sensor.status === 'timeout') {
            statusClass = 'status-timeout';
        }
        
        // Priority class
        const priorityClass = `priority-${sensor.priority}`;
        
        // Format last reading
        let lastValue = 'N/A';
        let timestamp = 'N/A';
        
        if (sensor.last_reading) {
            lastValue = sensor.last_reading.value !== null ? sensor.last_reading.value : 'N/A';
            timestamp = new Date(sensor.last_reading.timestamp).toLocaleString();
        }
        
        row.className = priorityClass;
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${sensor.name}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">${sensor.description || 'N/A'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">${sensor.group_name}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                    ${sensor.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${lastValue}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${timestamp}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="text-indigo-600 hover:text-indigo-900 view-sensor-details" data-sensor="${sensor.name}">
                    Details
                </button>
            </td>
        `;
        
        table.appendChild(row);
    });
    
    // If no sensors, add a message
    if (filteredSensors.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">
                Keine Sensoren gefunden.
            </td>
        `;
        table.appendChild(row);
    }
    
    // Add event listeners for sensor details
    const detailButtons = document.querySelectorAll('.view-sensor-details');
    detailButtons.forEach(button => {
        button.addEventListener('click', () => {
            const sensorName = button.getAttribute('data-sensor');
            showSensorDetails(sensorName);
        });
    });
}

// Update Group Filter
function updateGroupFilter(data) {
    const groupFilter = document.getElementById('group-filter');
    if (!groupFilter) return;
    
    // Clear existing options (except 'all')
    while (groupFilter.options.length > 1) {
        groupFilter.remove(1);
    }
    
    // Add options for each group
    const groups = Object.keys(data.groups || {}).sort();
    
    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        groupFilter.appendChild(option);
    });
    
    // Add event listener
    groupFilter.addEventListener('change', () => {
        const statusFilter = document.getElementById('status-filter');
        updateSensorsTable(data, groupFilter.value, statusFilter ? statusFilter.value : 'all');
    });
    
    // Add event listener for status filter
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            updateSensorsTable(data, groupFilter.value, statusFilter.value);
        });
    }
}

// Show Sensor Details
function showSensorDetails(sensorName) {
    // Get modal elements
    const modal = document.getElementById('sensor-details-modal');
    const modalSensorName = document.getElementById('modal-sensor-name');
    const modalDescription = document.getElementById('modal-description');
    const modalGroup = document.getElementById('modal-group');
    const modalPriority = document.getElementById('modal-priority');
    const modalPolling = document.getElementById('modal-polling');
    const modalEnabled = document.getElementById('modal-enabled');
    const modalWritable = document.getElementById('modal-writable');
    const modalAddress = document.getElementById('modal-address');
    const modalEntityId = document.getElementById('modal-entity-id');
    const modalStatus = document.getElementById('modal-status');
    const modalLastValue = document.getElementById('modal-last-value');
    const modalTimestamp = document.getElementById('modal-timestamp');
    const modalResponseTime = document.getElementById('modal-response-time');
    const modalSuccessRate = document.getElementById('modal-success-rate');
    const modalErrorCount = document.getElementById('modal-error-count');
    const modalMqttHistory = document.getElementById('modal-mqtt-history');
    const modalInputPolling = document.getElementById('modal-input-polling');
    const modalInputPriority = document.getElementById('modal-input-priority');
    const modalInputEnabled = document.getElementById('modal-input-enabled');
    
    // Fetch sensor details
    fetch(`${API_BASE_URL}/api/sensors/${sensorName}/status`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const sensor = data.data;
                
                // Set modal title
                if (modalSensorName) modalSensorName.textContent = sensor.name;
                
                // Set sensor info
                if (modalDescription) modalDescription.textContent = sensor.description || 'N/A';
                if (modalGroup) modalGroup.textContent = sensor.group || 'N/A';
                if (modalPriority) modalPriority.textContent = sensor.priority || 'N/A';
                if (modalPolling) modalPolling.textContent = `${sensor.polling_interval || 'N/A'} s`;
                if (modalEnabled) modalEnabled.textContent = sensor.enabled ? 'Ja' : 'Nein';
                if (modalWritable) modalWritable.textContent = sensor.writable ? 'Ja' : 'Nein';
                if (modalAddress) modalAddress.textContent = sensor.nasa_address || 'N/A';
                if (modalEntityId) modalEntityId.textContent = sensor.hass_entity_id || 'N/A';
                
                // Set status info
                if (modalStatus) {
                    let statusClass = 'text-gray-600';
                    if (sensor.status === 'active') {
                        statusClass = 'text-green-600';
                    } else if (sensor.status === 'error' || sensor.status === 'crc_error') {
                        statusClass = 'text-red-600';
                    } else if (sensor.status === 'timeout') {
                        statusClass = 'text-yellow-600';
                    }
                    
                    modalStatus.textContent = sensor.status || 'N/A';
                    modalStatus.className = `font-semibold ${statusClass}`;
                }
                
                // Set last reading
                if (sensor.last_reading) {
                    if (modalLastValue) modalLastValue.textContent = sensor.last_reading.value !== null ? sensor.last_reading.value : 'N/A';
                    if (modalTimestamp) modalTimestamp.textContent = sensor.last_reading.timestamp ? new Date(sensor.last_reading.timestamp).toLocaleString() : 'N/A';
                    if (modalResponseTime) modalResponseTime.textContent = sensor.last_reading.response_time_ms !== null ? `${sensor.last_reading.response_time_ms.toFixed(2)} ms` : 'N/A';
                } else {
                    if (modalLastValue) modalLastValue.textContent = 'N/A';
                    if (modalTimestamp) modalTimestamp.textContent = 'N/A';
                    if (modalResponseTime) modalResponseTime.textContent = 'N/A';
                }
                
                // Set statistics
                if (sensor.statistics) {
                    if (modalSuccessRate) modalSuccessRate.textContent = `${sensor.statistics.success_rate || 0}%`;
                    if (modalErrorCount) modalErrorCount.textContent = sensor.statistics.error_count || 0;
                } else {
                    if (modalSuccessRate) modalSuccessRate.textContent = 'N/A';
                    if (modalErrorCount) modalErrorCount.textContent = 'N/A';
                }
                
                // Set form inputs
                if (modalInputPolling) modalInputPolling.value = sensor.polling_interval || 60;
                if (modalInputPriority) modalInputPriority.value = sensor.priority || 3;
                if (modalInputEnabled) modalInputEnabled.checked = sensor.enabled !== false;
                
                // Set data attribute for save button
                const saveButton = document.getElementById('modal-save-config');
                if (saveButton) {
                    saveButton.setAttribute('data-sensor', sensor.name);
                }
                
                // Show modal
                if (modal) modal.classList.remove('hidden');
                
                // Load MQTT history
                loadSensorMQTTHistory(sensor.name);
            }
        })
        .catch(error => {
            console.error("Error loading sensor details:", error);
        });
}

// Load Sensor MQTT History
function loadSensorMQTTHistory(sensorName) {
    const historyContainer = document.getElementById('modal-mqtt-history');
    if (!historyContainer) return;
    
    // Show loading
    historyContainer.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin mr-2"></i>Lade Daten...</div>';
    
    // Fetch MQTT history
    fetch(`${API_BASE_URL}/api/mqtt/history/${sensorName}?hours=24`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateSensorMQTTHistory(data.data);
            } else {
                historyContainer.innerHTML = `<div class="text-center py-4 text-red-600">Fehler: ${data.error}</div>`;
            }
        })
        .catch(error => {
            console.error("Error loading MQTT history:", error);
            historyContainer.innerHTML = '<div class="text-center py-4 text-red-600">Fehler beim Laden der MQTT-Historie.</div>';
        });
}

// Update Sensor MQTT History
function updateSensorMQTTHistory(data) {
    const historyContainer = document.getElementById('modal-mqtt-history');
    if (!historyContainer) return;
    
    // Clear container
    historyContainer.innerHTML = '';
    
    // Check if there's any data
    if (!data.communication_flows || data.communication_flows.length === 0) {
        historyContainer.innerHTML = '<div class="text-center py-4 text-gray-500">Keine MQTT-Kommunikation in den letzten 24 Stunden.</div>';
        return;
    }
    
    // Create table
    const table = document.createElement('table');
    table.className = 'min-w-full divide-y divide-gray-200';
    
    // Create header
    const thead = document.createElement('thead');
    thead.className = 'bg-gray-50';
    thead.innerHTML = `
        <tr>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zeit</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Initiiert von</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SET-Wert</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATE-Wert</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Antwortzeit</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Create body
    const tbody = document.createElement('tbody');
    tbody.className = 'bg-white divide-y divide-gray-200';
    
    // Add rows
    data.communication_flows.forEach(flow => {
        const row = document.createElement('tr');
        
        // Format timestamp
        const timestamp = new Date(flow.timestamp).toLocaleTimeString();
        
        // Format values
        const setValue = flow.set_value !== null ? flow.set_value : 'N/A';
        const stateValue = flow.state_value !== null ? flow.state_value : 'N/A';
        
        // Format response time
        const responseTime = flow.response_time_ms !== null ? `${flow.response_time_ms.toFixed(2)} ms` : 'N/A';
        
        // Status class
        let statusClass = 'text-gray-600';
        if (flow.success) {
            statusClass = 'text-green-600';
        } else if (flow.error_message) {
            statusClass = 'text-red-600';
        }
        
        row.innerHTML = `
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">${timestamp}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">${flow.initiated_by === 'home_assistant' ? 'Home Assistant' : 'EHS-Sentinel'}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">${setValue}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">${stateValue}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">${responseTime}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm ${statusClass}">
                ${flow.success ? '✅ Erfolgreich' : (flow.error_message || 'Unbekannt')}
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    historyContainer.appendChild(table);
}

// Save Sensor Config
function saveSensorConfig() {
    const saveButton = document.getElementById('modal-save-config');
    if (!saveButton) return;
    
    const sensorName = saveButton.getAttribute('data-sensor');
    if (!sensorName) return;
    
    const pollingInput = document.getElementById('modal-input-polling');
    const priorityInput = document.getElementById('modal-input-priority');
    const enabledInput = document.getElementById('modal-input-enabled');
    
    if (!pollingInput || !priorityInput || !enabledInput) return;
    
    const updates = {
        polling_interval: parseInt(pollingInput.value, 10),
        priority: parseInt(priorityInput.value, 10),
        enabled: enabledInput.checked
    };
    
    // Validate inputs
    if (isNaN(updates.polling_interval) || updates.polling_interval < 1) {
        alert('Polling-Intervall muss mindestens 1 Sekunde sein.');
        return;
    }
    
    if (isNaN(updates.priority) || updates.priority < 1 || updates.priority > 5) {
        alert('Priorität muss zwischen 1 und 5 liegen.');
        return;
    }
    
    // Send update
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
                alert('Sensor-Konfiguration erfolgreich gespeichert.');
                
                // Close modal
                const modal = document.getElementById('sensor-details-modal');
                if (modal) modal.classList.add('hidden');
                
                // Reload sensors data
                loadSensorsData();
            } else {
                alert(`Fehler: ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Error saving sensor config:", error);
            alert('Fehler beim Speichern der Sensor-Konfiguration.');
        });
}

// MQTT Data Loading
function loadMQTTData() {
    console.log("Loading MQTT data...");
    
    // Load MQTT stats
    fetch(`${API_BASE_URL}/api/mqtt/stats`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateMQTTStats(data.data);
                updateMQTTRecentErrors(data.data.recent_errors || []);
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

// Update MQTT Sensor Filter
function updateMQTTSensorFilter(data) {
    const sensorFilter = document.getElementById('mqtt-sensor-filter');
    if (!sensorFilter) return;
    
    // Clear existing options (except empty)
    while (sensorFilter.options.length > 1) {
        sensorFilter.remove(1);
    }
    
    // Collect all sensors from all groups
    const allSensors = [];
    
    Object.values(data.groups || {}).forEach(group => {
        group.sensors.forEach(sensor => {
            allSensors.push(sensor);
        });
    });
    
    // Sort by name
    allSensors.sort((a, b) => a.name.localeCompare(b.name));
    
    // Add options for each sensor
    allSensors.forEach(sensor => {
        const option = document.createElement('option');
        option.value = sensor.name;
        option.textContent = sensor.name;
        sensorFilter.appendChild(option);
    });
}

// Load MQTT History
function loadMQTTHistory() {
    const sensorFilter = document.getElementById('mqtt-sensor-filter');
    if (!sensorFilter || !sensorFilter.value) {
        alert('Bitte wählen Sie einen Sensor aus.');
        return;
    }
    
    const sensorName = sensorFilter.value;
    const historyContainer = document.getElementById('mqtt-history-container');
    const historyTable = document.getElementById('mqtt-history-table');
    
    if (!historyContainer || !historyTable) return;
    
    // Show loading
    historyTable.innerHTML = `
        <tr>
            <td colspan="7" class="px-6 py-4 text-center">
                <i class="fas fa-spinner fa-spin mr-2"></i>Lade Daten...
            </td>
        </tr>
    `;
    
    // Fetch MQTT history
    fetch(`${API_BASE_URL}/api/mqtt/history/${sensorName}?hours=24`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateMQTTHistoryTable(data.data);
            } else {
                historyTable.innerHTML = `
                    <tr>
                        <td colspan="7" class="px-6 py-4 text-center text-red-600">
                            Fehler: ${data.error}
                        </td>
                    </tr>
                `;
            }
        })
        .catch(error => {
            console.error("Error loading MQTT history:", error);
            historyTable.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-red-600">
                        Fehler beim Laden der MQTT-Historie.
                    </td>
                </tr>
            `;
        });
}

// Update MQTT History Table
function updateMQTTHistoryTable(data) {
    const historyTable = document.getElementById('mqtt-history-table');
    if (!historyTable) return;
    
    // Clear table
    historyTable.innerHTML = '';
    
    // Check if there's any data
    if (!data.communication_flows || data.communication_flows.length === 0) {
        historyTable.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    Keine MQTT-Kommunikation in den letzten 24 Stunden.
                </td>
            </tr>
        `;
        return;
    }
    
    // Add rows
    data.communication_flows.forEach(flow => {
        const row = document.createElement('tr');
        
        // Format timestamp
        const timestamp = new Date(flow.timestamp).toLocaleString();
        
        // Format values
        const setValue = flow.set_value !== null ? flow.set_value : 'N/A';
        const stateValue = flow.state_value !== null ? flow.state_value : 'N/A';
        
        // Format response time
        const responseTime = flow.response_time_ms !== null ? `${flow.response_time_ms.toFixed(2)} ms` : 'N/A';
        
        // Status class
        let statusClass = 'text-gray-600';
        if (flow.success) {
            statusClass = 'text-green-600';
        } else if (flow.error_message) {
            statusClass = 'text-red-600';
        }
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${timestamp}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${flow.initiated_by === 'home_assistant' ? 'SET' : 'STATE'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${flow.initiated_by === 'home_assistant' ? 'Home Assistant' : 'EHS-Sentinel'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${setValue}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${stateValue}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${responseTime}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm ${statusClass}">
                ${flow.success ? '✅ Erfolgreich' : (flow.error_message || 'Unbekannt')}
            </td>
        `;
        
        historyTable.appendChild(row);
    });
}

// Logs Data Loading
function loadLogsData() {
    console.log("Loading logs data...");
    
    // Load log stats
    fetch(`${API_BASE_URL}/api/logs/stats`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateLogStatsView(data.data);
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
    
    // Load logs (default: last 50)
    fetch(`${API_BASE_URL}/api/logs?limit=50`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateLogEntriesTable(data.data.logs);
            }
        })
        .catch(error => {
            console.error("Error loading logs:", error);
        });
}

// Update Log Stats View
function updateLogStatsView(data) {
    // Level breakdown
    const levelStats = document.getElementById('log-stats-level');
    if (levelStats && data.level_breakdown) {
        // Clear existing stats
        levelStats.innerHTML = '';
        
        // Add stats for each level
        const levels = Object.keys(data.level_breakdown).sort();
        
        levels.forEach(level => {
            const count = data.level_breakdown[level];
            
            // Level color
            let levelColor = 'text-gray-600';
            if (level === 'ERROR') {
                levelColor = 'text-red-600';
            } else if (level === 'WARNING') {
                levelColor = 'text-yellow-600';
            } else if (level === 'INFO') {
                levelColor = 'text-blue-600';
            } else if (level === 'DEBUG') {
                levelColor = 'text-gray-500';
            }
            
            const div = document.createElement('div');
            div.className = 'flex justify-between';
            div.innerHTML = `
                <span class="text-gray-600">${level}:</span>
                <span class="font-semibold ${levelColor}">${count}</span>
            `;
            
            levelStats.appendChild(div);
        });
    }
    
    // Category breakdown
    const categoryStats = document.getElementById('log-stats-category');
    if (categoryStats && data.category_breakdown) {
        // Clear existing stats
        categoryStats.innerHTML = '';
        
        // Add stats for each category
        const categories = Object.keys(data.category_breakdown).sort();
        
        categories.forEach(category => {
            const count = data.category_breakdown[category];
            
            const div = document.createElement('div');
            div.className = 'flex justify-between';
            div.innerHTML = `
                <span class="text-gray-600">${category}:</span>
                <span class="font-semibold">${count}</span>
            `;
            
            categoryStats.appendChild(div);
        });
    }
    
    // Sensor breakdown
    const sensorStats = document.getElementById('log-stats-sensors');
    if (sensorStats && data.sensor_breakdown) {
        // Clear existing stats
        sensorStats.innerHTML = '';
        
        // Get sensors with errors
        const sensorsWithErrors = Object.entries(data.sensor_breakdown)
            .filter(([_, stats]) => stats.errors > 0)
            .sort((a, b) => b[1].errors - a[1].errors)
            .slice(0, 5);
        
        if (sensorsWithErrors.length === 0) {
            sensorStats.innerHTML = '<div class="text-center text-gray-500">Keine Sensoren mit Fehlern.</div>';
            return;
        }
        
        // Add stats for each sensor
        sensorsWithErrors.forEach(([sensor, stats]) => {
            const errorRate = stats.errors / stats.total * 100;
            
            // Error rate color
            let errorColor = 'text-green-600';
            if (errorRate > 50) {
                errorColor = 'text-red-600';
            } else if (errorRate > 20) {
                errorColor = 'text-yellow-600';
            } else if (errorRate > 5) {
                errorColor = 'text-orange-600';
            }
            
            const div = document.createElement('div');
            div.className = 'flex justify-between';
            div.innerHTML = `
                <span class="text-gray-600">${sensor}:</span>
                <span class="font-semibold ${errorColor}">${stats.errors} / ${stats.total} (${errorRate.toFixed(1)}%)</span>
            `;
            
            sensorStats.appendChild(div);
        });
    }
}

// Update Log Sensor Filter
function updateLogSensorFilter(data) {
    const sensorFilter = document.getElementById('log-filter-sensor');
    if (!sensorFilter) return;
    
    // Clear existing options (except empty)
    while (sensorFilter.options.length > 1) {
        sensorFilter.remove(1);
    }
    
    // Collect all sensors from all groups
    const allSensors = [];
    
    Object.values(data.groups || {}).forEach(group => {
        group.sensors.forEach(sensor => {
            allSensors.push(sensor);
        });
    });
    
    // Sort by name
    allSensors.sort((a, b) => a.name.localeCompare(b.name));
    
    // Add options for each sensor
    allSensors.forEach(sensor => {
        const option = document.createElement('option');
        option.value = sensor.name;
        option.textContent = sensor.name;
        sensorFilter.appendChild(option);
    });
}

// Update Log Entries Table
function updateLogEntriesTable(logs) {
    const table = document.getElementById('log-entries-table');
    if (!table) return;
    
    // Clear existing rows
    table.innerHTML = '';
    
    // Check if there are any logs
    if (!logs || logs.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    Keine Log-Einträge gefunden.
                </td>
            </tr>
        `;
        return;
    }
    
    // Add rows for each log entry
    logs.forEach(log => {
        const row = document.createElement('tr');
        
        // Level class
        let levelClass = 'text-gray-600';
        if (log.level === 'ERROR') {
            levelClass = 'text-red-600';
        } else if (log.level === 'WARNING') {
            levelClass = 'text-yellow-600';
        } else if (log.level === 'INFO') {
            levelClass = 'text-blue-600';
        } else if (log.level === 'DEBUG') {
            levelClass = 'text-gray-500';
        }
        
        // Format timestamp
        const timestamp = new Date(log.timestamp).toLocaleString();
        
        // Format details
        let details = 'N/A';
        if (log.details && Object.keys(log.details).length > 0) {
            details = JSON.stringify(log.details, null, 2);
        }
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${timestamp}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${levelClass}">
                    ${log.level}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${log.category}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${log.sensor_name || 'N/A'}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${log.message}</td>
            <td class="px-6 py-4 text-sm text-gray-500">
                <details>
                    <summary class="cursor-pointer">Details anzeigen</summary>
                    <pre class="mt-2 text-xs bg-gray-100 p-2 rounded">${details}</pre>
                </details>
            </td>
        `;
        
        table.appendChild(row);
    });
}

// Apply Log Filters
function applyLogFilters() {
    // Get filter values
    const level = document.getElementById('log-filter-level').value;
    const category = document.getElementById('log-filter-category').value;
    const sensor = document.getElementById('log-filter-sensor').value;
    const start = document.getElementById('log-filter-start').value;
    const end = document.getElementById('log-filter-end').value;
    const errorsOnly = document.getElementById('log-filter-errors').checked;
    
    // Build query string
    let queryString = '?limit=50';
    
    if (level) queryString += `&level=${level}`;
    if (category) queryString += `&category=${category}`;
    if (sensor) queryString += `&sensor_name=${sensor}`;
    if (start) queryString += `&start_time=${start}`;
    if (end) queryString += `&end_time=${end}`;
    if (errorsOnly) queryString += '&errors_only=true';
    
    // Fetch filtered logs
    fetch(`${API_BASE_URL}/api/logs${queryString}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateLogEntriesTable(data.data.logs);
            }
        })
        .catch(error => {
            console.error("Error applying log filters:", error);
        });
}

// Export Logs
function exportLogs() {
    // Get filter values
    const level = document.getElementById('log-filter-level').value;
    const category = document.getElementById('log-filter-category').value;
    const sensor = document.getElementById('log-filter-sensor').value;
    const start = document.getElementById('log-filter-start').value;
    const end = document.getElementById('log-filter-end').value;
    const errorsOnly = document.getElementById('log-filter-errors').checked;
    
    // Build query string
    let queryString = '?format=json';
    
    if (level) queryString += `&level=${level}`;
    if (category) queryString += `&category=${category}`;
    if (sensor) queryString += `&sensor_name=${sensor}`;
    if (start) queryString += `&start_time=${start}`;
    if (end) queryString += `&end_time=${end}`;
    if (errorsOnly) queryString += '&errors_only=true';
    
    // Open export URL in new tab
    window.open(`${API_BASE_URL}/api/logs/export${queryString}`, '_blank');
}

// Load More Logs
function loadMoreLogs() {
    // Get current number of logs
    const table = document.getElementById('log-entries-table');
    if (!table) return;
    
    const currentCount = table.querySelectorAll('tr').length;
    
    // Get filter values
    const level = document.getElementById('log-filter-level').value;
    const category = document.getElementById('log-filter-category').value;
    const sensor = document.getElementById('log-filter-sensor').value;
    const start = document.getElementById('log-filter-start').value;
    const end = document.getElementById('log-filter-end').value;
    const errorsOnly = document.getElementById('log-filter-errors').checked;
    
    // Build query string
    let queryString = `?limit=${currentCount + 50}`;
    
    if (level) queryString += `&level=${level}`;
    if (category) queryString += `&category=${category}`;
    if (sensor) queryString += `&sensor_name=${sensor}`;
    if (start) queryString += `&start_time=${start}`;
    if (end) queryString += `&end_time=${end}`;
    if (errorsOnly) queryString += '&errors_only=true';
    
    // Fetch more logs
    fetch(`${API_BASE_URL}/api/logs${queryString}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateLogEntriesTable(data.data.logs);
            }
        })
        .catch(error => {
            console.error("Error loading more logs:", error);
        });
}

// Configuration Data Loading
function loadConfigurationData() {
    console.log("Loading configuration data...");
    
    // Load UI configuration
    fetch(`${API_BASE_URL}/api/config/ui`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateConfigurationView(data.data);
            }
        })
        .catch(error => {
            console.error("Error loading configuration:", error);
        });
}

// Update Configuration View
function updateConfigurationView(data) {
    // Update group configuration table
    updateGroupConfigTable(data.groups);
    
    // Update parameter configuration table
    updateParameterConfigTable(data.parameters);
    
    // Update group filter
    updateConfigGroupFilter(data.groups);
}

// Update Group Config Table
function updateGroupConfigTable(groups) {
    const table = document.getElementById('group-config-table');
    if (!table) return;
    
    // Clear existing rows
    table.innerHTML = '';
    
    // Check if there are any groups
    if (!groups || Object.keys(groups).length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    Keine Gruppen gefunden.
                </td>
            </tr>
        `;
        return;
    }
    
    // Add rows for each group
    Object.entries(groups).forEach(([name, group]) => {
        const row = document.createElement('tr');
        
        // Status class
        let statusClass = 'text-gray-600';
        if (group.enabled) {
            statusClass = 'text-green-600';
        } else {
            statusClass = 'text-red-600';
        }
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${name}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${group.description || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${group.priority || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${group.default_polling_interval || 'N/A'} s</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${group.parameter_count || 0}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                    ${group.enabled ? 'Aktiviert' : 'Deaktiviert'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="text-indigo-600 hover:text-indigo-900 edit-group" data-group="${name}">
                    Bearbeiten
                </button>
            </td>
        `;
        
        table.appendChild(row);
    });
    
    // Add event listeners for edit buttons
    const editButtons = document.querySelectorAll('.edit-group');
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const groupName = button.getAttribute('data-group');
            showGroupEditModal(groupName, groups[groupName]);
        });
    });
}

// Show Group Edit Modal
function showGroupEditModal(groupName, group) {
    // Get modal elements
    const modal = document.getElementById('group-edit-modal');
    const modalName = document.getElementById('group-modal-name');
    const modalPolling = document.getElementById('group-modal-polling');
    const modalEnabled = document.getElementById('group-modal-enabled');
    
    if (!modal || !modalName || !modalPolling || !modalEnabled) return;
    
    // Set modal title
    modalName.textContent = `Gruppe: ${groupName}`;
    
    // Set form inputs
    modalPolling.value = group.default_polling_interval || 60;
    modalEnabled.checked = group.enabled !== false;
    
    // Set data attribute for save button
    const saveButton = document.getElementById('group-modal-save');
    if (saveButton) {
        saveButton.setAttribute('data-group', groupName);
    }
    
    // Show modal
    modal.classList.remove('hidden');
}

// Save Group Config
function saveGroupConfig() {
    const saveButton = document.getElementById('group-modal-save');
    if (!saveButton) return;
    
    const groupName = saveButton.getAttribute('data-group');
    if (!groupName) return;
    
    const pollingInput = document.getElementById('group-modal-polling');
    const enabledInput = document.getElementById('group-modal-enabled');
    
    if (!pollingInput || !enabledInput) return;
    
    const updates = {
        default_polling_interval: parseInt(pollingInput.value, 10),
        enabled: enabledInput.checked
    };
    
    // Validate inputs
    if (isNaN(updates.default_polling_interval) || updates.default_polling_interval < 1) {
        alert('Polling-Intervall muss mindestens 1 Sekunde sein.');
        return;
    }
    
    // Send update
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
                alert('Gruppen-Konfiguration erfolgreich gespeichert.');
                
                // Close modal
                const modal = document.getElementById('group-edit-modal');
                if (modal) modal.classList.add('hidden');
                
                // Reload configuration data
                loadConfigurationData();
            } else {
                alert(`Fehler: ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Error saving group config:", error);
            alert('Fehler beim Speichern der Gruppen-Konfiguration.');
        });
}

// Update Parameter Config Table
function updateParameterConfigTable(parameters, groupFilter = 'all') {
    const table = document.getElementById('parameter-config-table');
    if (!table) return;
    
    // Clear existing rows
    table.innerHTML = '';
    
    // Check if there are any parameters
    if (!parameters || Object.keys(parameters).length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                    Keine Parameter gefunden.
                </td>
            </tr>
        `;
        return;
    }
    
    // Filter parameters by group
    let filteredParameters = Object.entries(parameters);
    
    if (groupFilter !== 'all') {
        filteredParameters = filteredParameters.filter(([_, param]) => param.group === groupFilter);
    }
    
    // Sort by name
    filteredParameters.sort((a, b) => a[0].localeCompare(b[0]));
    
    // Add rows for each parameter
    filteredParameters.forEach(([name, param]) => {
        const row = document.createElement('tr');
        
        // Status class
        let statusClass = 'text-gray-600';
        if (param.enabled) {
            statusClass = 'text-green-600';
        } else {
            statusClass = 'text-red-600';
        }
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${name}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${param.display_name || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${param.type || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${param.group || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${param.polling_interval || 'N/A'} s</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${param.priority || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                    ${param.enabled ? 'Ja' : 'Nein'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="text-indigo-600 hover:text-indigo-900 view-sensor-details" data-sensor="${name}">
                    Bearbeiten
                </button>
            </td>
        `;
        
        table.appendChild(row);
    });
    
    // Add event listeners for sensor details
    const detailButtons = document.querySelectorAll('.view-sensor-details');
    detailButtons.forEach(button => {
        button.addEventListener('click', () => {
            const sensorName = button.getAttribute('data-sensor');
            showSensorDetails(sensorName);
        });
    });
}

// Update Config Group Filter
function updateConfigGroupFilter(groups) {
    const groupFilter = document.getElementById('config-group-filter');
    if (!groupFilter) return;
    
    // Clear existing options (except 'all')
    while (groupFilter.options.length > 1) {
        groupFilter.remove(1);
    }
    
    // Add options for each group
    const groupNames = Object.keys(groups).sort();
    
    groupNames.forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        groupFilter.appendChild(option);
    });
    
    // Add event listener
    groupFilter.addEventListener('change', () => {
        // Get parameters from the UI config
        fetch(`${API_BASE_URL}/api/config/ui`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateParameterConfigTable(data.data.parameters, groupFilter.value);
                }
            })
            .catch(error => {
                console.error("Error loading parameters for filter:", error);
            });
    });
}

// Documentation Loading
function loadDocumentation() {
    console.log("Loading documentation...");
    
    // Load MQTT documentation by default
    loadMQTTDocumentation();
}

// Load MQTT Documentation
function loadMQTTDocumentation() {
    fetch(`${API_BASE_URL}/api/documentation/mqtt`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const container = document.getElementById('mqtt-doc-content');
                if (container) {
                    container.innerHTML = marked.parse(data.data.content);
                }
            }
        })
        .catch(error => {
            console.error("Error loading mqtt documentation:", error);
        });
}

// Load Conversion Documentation
function loadConversionDocumentation() {
    fetch(`${API_BASE_URL}/api/documentation/conversion`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const container = document.getElementById('conversion-doc-content');
                if (container) {
                    container.innerHTML = marked.parse(data.data.content);
                }
            }
        })
        .catch(error => {
            console.error("Error loading conversion documentation:", error);
        });
}

// Load Troubleshooting Documentation
function loadTroubleshootingDocumentation() {
    fetch(`${API_BASE_URL}/api/documentation/troubleshooting`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const container = document.getElementById('troubleshooting-doc-content');
                if (container) {
                    container.innerHTML = marked.parse(data.data.content);
                }
            }
        })
        .catch(error => {
            console.error("Error loading troubleshooting documentation:", error);
        });
}

// Generate Documentation
function generateDocumentation() {
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
                alert('Dokumentation erfolgreich generiert.');
            } else {
                alert(`Fehler: ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Error generating documentation:", error);
            alert('Fehler bei der Dokumentationsgenerierung.');
        });
}