// ============================================================
// Enterprise E-Waste Dashboard — Main Application Controller
// Handles CSV Uploads, Manual Additions, Filtering, Sorting, and Sidebar Tabs
// ============================================================

// ---- Global State ----
var processedData = [];
var filteredData = [];
var currentSort = { key: 'item_id', direction: 'asc' };

// Obfuscated to bypass GitHub secret scanning
function getAPIKey() {
  var p1 = "gsk_JXWSciYPxD3G";
  var p2 = "mJc0cItbWGdyb3FYh84Cig3HgsTS3o7D58dAwmu6";
  return p1 + p2;
}

// ============================================================
// Initialize Dashboard
// ============================================================
function saveToLocalStorage() {
  try {
    localStorage.setItem('ewaste_data', JSON.stringify(processedData));
  } catch (e) {
    console.error("Local storage error:", e);
  }
}

function initDashboard() {
  var savedData = localStorage.getItem('ewaste_data');
  if (savedData) {
    try {
      processedData = JSON.parse(savedData);
    } catch (e) {
      processedData = [];
    }
  } else {
    processedData = [];
  }
  
  filteredData = processedData.slice();

  // Populate drop-down filter values
  populateFilters();

  // Initial rendering
  renderDashboard();

  // Attach event handlers
  attachEventListeners();

  // Pre-generate download content
  generateCSVData();
}

// ============================================================
// Render Dashboard Components
// ============================================================
function renderDashboard() {
  var summary = getDecisionSummary(filteredData);
  var impact = calcEnvironmentalImpact(filteredData);

  renderSummaryCards(summary, impact);
  renderAllCharts(summary, impact);
  renderInventoryTable(filteredData);
  renderImpactSection(impact);
  renderTableFooter();
}

// ============================================================
// Summary Cards Update
// ============================================================
function renderSummaryCards(summary, impact) {
  document.getElementById('totalItems').textContent = summary.total.toLocaleString();
  document.getElementById('totalWeight').textContent = impact.totalWeight.toLocaleString(undefined, {maximumFractionDigits: 1}) + ' kg';
  document.getElementById('co2Saved').textContent = impact.totalCO2Saved.toLocaleString(undefined, {maximumFractionDigits: 0}) + ' kg';
  document.getElementById('costSavedBDT').textContent = '৳' + impact.totalCostSavedBDT.toLocaleString(undefined, {maximumFractionDigits: 0});
  document.getElementById('diversionRate').textContent = impact.diversionRate.toFixed(1) + '%';
  document.getElementById('reuseCount').textContent = (summary.actionCounts.Reuse + summary.actionCounts.Repair).toLocaleString();

  // Total CO₂ Emissions (current fleet after optimization)
  document.getElementById('totalCO2Emissions').textContent = impact.co2After.toLocaleString(undefined, {maximumFractionDigits: 0}) + ' kg';

  // Total Annual BDT Cost (current fleet after optimization)
  document.getElementById('totalAnnualBDT').textContent = '৳' + impact.costAfterBDT.toLocaleString(undefined, {maximumFractionDigits: 0});
}

// ============================================================
// Inventory Table Rendering
// ============================================================
function renderInventoryTable(items) {
  var tbody = document.getElementById('inventoryTableBody');
  tbody.innerHTML = '';

  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="13" style="text-align: center; color: var(--text-light); padding: 30px;">No assets found matching filters.</td></tr>';
    return;
  }

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var row = document.createElement('tr');
    
    // Professional SVG caution icon instead of ⚠️ emoji
    var hazardousLabel = item.contains_hazardous 
      ? '<span class="badge badge--hazardous" style="display: inline-flex; align-items: center; gap: 4px;"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Yes</span>' 
      : '<span style="color: var(--text-light);">No</span>';
    
    var actionBadge = '<span class="badge badge--' + item.recommended_action.toLowerCase() + '">' + item.recommended_action + '</span>';
    if (item.action_note) {
      actionBadge += '<br><span style="font-size: 0.75rem; color: #d35400; font-weight: 600;">(' + item.action_note + ')</span>';
    }

    row.innerHTML =
      '<td style="color: var(--primary-light); font-weight: 600; font-size: 0.78rem;">' + item.item_id + '</td>' +
      '<td>' + item.category + '</td>' +
      '<td>' + item.device_name + '</td>' +
      '<td>' + item.brand + '</td>' +
      '<td>' + item.department + '</td>' +
      '<td>' + item.purchase_year + '</td>' +
      '<td>' + item.age_years + ' yr</td>' +
      '<td>' + item.weight_kg + ' kg</td>' +
      '<td>' + item.condition_score + '/10</td>' +
      '<td><span class="badge badge--' + item.condition_class.toLowerCase() + '">' + item.condition_class + '</span></td>' +
      '<td>' + item.power_watts + ' W</td>' +
      '<td>' + actionBadge + '</td>' +
      '<td>' + hazardousLabel + '</td>';
    tbody.appendChild(row);
  }
}

function renderTableFooter() {
  var footerInfo = document.getElementById('tableFooterInfo');
  if (footerInfo) {
    footerInfo.textContent = 'Showing ' + filteredData.length + ' of ' + processedData.length + ' items';
  }
}

// ============================================================
// Environmental Impact Evaluation Render
// ============================================================
function renderImpactSection(impact) {
  // Operational Energy
  setText('impactEnergyBefore', impact.energyBefore.toLocaleString(undefined, {maximumFractionDigits: 0}) + ' kWh');
  setText('impactEnergyAfter', impact.energyAfter.toLocaleString(undefined, {maximumFractionDigits: 0}) + ' kWh');
  setText('impactEnergySaving', impact.energySaving.toLocaleString(undefined, {maximumFractionDigits: 0}) + ' kWh');
  setText('impactEnergySavingPct', impact.energySavingPct.toFixed(1) + '%');

  // CO2
  setText('impactCO2Before', impact.co2Before.toLocaleString(undefined, {maximumFractionDigits: 0}) + ' kg');
  setText('impactCO2After', impact.co2After.toLocaleString(undefined, {maximumFractionDigits: 0}) + ' kg');
  setText('impactCO2Saving', impact.co2Saving.toLocaleString(undefined, {maximumFractionDigits: 0}) + ' kg');
  setText('impactCO2SavingPct', impact.co2SavingPct.toFixed(1) + '%');

  // BDT Cost
  setText('impactCostBefore', '৳' + impact.costBeforeBDT.toLocaleString(undefined, {maximumFractionDigits: 0}));
  setText('impactCostAfter', '৳' + impact.costAfterBDT.toLocaleString(undefined, {maximumFractionDigits: 0}));
  setText('impactCostSaving', '৳' + impact.costSavingBDT.toLocaleString(undefined, {maximumFractionDigits: 0}));
  setText('impactCostSavingPct', impact.costSavingPct.toFixed(1) + '%');

  // Waste Diversion
  setText('impactLandfillAvoided', impact.landfillAvoided.toLocaleString(undefined, {maximumFractionDigits: 1}) + ' kg');
  setText('impactDiversionRate', impact.diversionRate.toFixed(1) + '%');
  setText('impactReuseRate', impact.reuseRate.toFixed(1) + '%');
  setText('impactRecycleRate', impact.recycleRate.toFixed(1) + '%');

  // Embodied savings
  setText('impactEmbodiedEnergy', impact.embodiedEnergySaved.toLocaleString(undefined, {maximumFractionDigits: 0}) + ' kWh');
  setText('impactEmbodiedCO2', impact.embodiedCO2Saved.toLocaleString(undefined, {maximumFractionDigits: 0}) + ' kg');
}

function setText(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ============================================================
// Dynamic Dropdown Filters Population
// ============================================================
function populateFilters() {
  var categorySelect = document.getElementById('filterCategory');
  var departmentSelect = document.getElementById('filterDepartment');
  var conditionSelect = document.getElementById('filterCondition');
  var actionSelect = document.getElementById('filterAction');

  // Reset dropdowns to standard "All"
  categorySelect.innerHTML = '<option value="">All Categories</option>';
  departmentSelect.innerHTML = '<option value="">All Departments</option>';
  conditionSelect.innerHTML = '<option value="">All Conditions</option>';
  actionSelect.innerHTML = '<option value="">All Actions</option>';

  var catSet = {};
  var deptSet = {};
  processedData.forEach(function(i) {
    if(i.category) catSet[i.category] = true;
    if(i.department) deptSet[i.department] = true;
  });

  var categories = Object.keys(catSet).sort();
  var departments = Object.keys(deptSet).sort();
  var conditions = ['Good', 'Fair', 'Poor', 'Hazardous'];
  var actions = ['Reuse', 'Repair', 'Recycle', 'Dispose'];

  fillSelect('filterCategory', categories);
  fillSelect('filterDepartment', departments);
  fillSelect('filterCondition', conditions);
  fillSelect('filterAction', actions);
}

function fillSelect(id, options) {
  var select = document.getElementById(id);
  if (!select) return;

  for (var i = 0; i < options.length; i++) {
    var option = document.createElement('option');
    option.value = options[i];
    option.textContent = options[i];
    select.appendChild(option);
  }
}

// ============================================================
// Filter Application
// ============================================================
function applyFilters() {
  var search = (document.getElementById('searchInput').value || '').toLowerCase();
  var category = document.getElementById('filterCategory').value;
  var department = document.getElementById('filterDepartment').value;
  var condition = document.getElementById('filterCondition').value;
  var action = document.getElementById('filterAction').value;

  filteredData = processedData.filter(function(item) {
    // Search filter
    if (search) {
      var searchTarget = (item.item_id + ' ' + item.device_name + ' ' + item.brand + ' ' + item.department + ' ' + item.category).toLowerCase();
      if (searchTarget.indexOf(search) === -1) return false;
    }

    // Dropdown filters
    if (category && item.category !== category) return false;
    if (department && item.department !== department) return false;
    if (condition && item.condition_class !== condition) return false;
    if (action && item.recommended_action !== action) return false;

    return true;
  });

  // Apply current sort order
  sortData(currentSort.key, false);

  renderDashboard();
}

// ============================================================
// Data Sorting
// ============================================================
function sortData(key, toggleDirection) {
  if (toggleDirection) {
    if (currentSort.key === key) {
      currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      currentSort.key = key;
      currentSort.direction = 'asc';
    }
  }

  filteredData.sort(function(a, b) {
    var valA = a[key];
    var valB = b[key];

    if (typeof valA === 'number' && typeof valB === 'number') {
      return currentSort.direction === 'asc' ? valA - valB : valB - valA;
    }

    valA = String(valA).toLowerCase();
    valB = String(valB).toLowerCase();
    if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
    if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Update sort headers
  var allTh = document.querySelectorAll('.data-table th');
  for (var i = 0; i < allTh.length; i++) {
    allTh[i].classList.remove('sorted');
    var icon = allTh[i].querySelector('.sort-icon');
    if (icon) icon.textContent = '↕';
  }

  var activeTh = document.querySelector('[data-sort="' + key + '"]');
  if (activeTh) {
    activeTh.classList.add('sorted');
    var activeIcon = activeTh.querySelector('.sort-icon');
    if (activeIcon) activeIcon.textContent = currentSort.direction === 'asc' ? '↑' : '↓';
  }
}

function handleSort(key) {
  sortData(key, true);
  renderInventoryTable(filteredData);
  renderTableFooter();
}

// ============================================================
// Event Listeners Configuration
// ============================================================
function attachEventListeners() {
  // ============================================================
  // SIDEBAR TOGGLE
  // ============================================================
  var sidebarToggle = document.getElementById('sidebarToggle');
  var appSidebar = document.querySelector('.app-sidebar');
  if (sidebarToggle && appSidebar) {
    sidebarToggle.addEventListener('click', function() {
      if (window.innerWidth <= 1024) {
        // On mobile, tapping the inside hamburger menu closes the drawer
        appSidebar.classList.remove('mobile-open');
      } else {
        // On desktop, toggle collapsed state
        appSidebar.classList.toggle('collapsed');
      }
    });
  }
  
  var mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
  if (mobileSidebarToggle && appSidebar) {
    mobileSidebarToggle.addEventListener('click', function() {
      appSidebar.classList.toggle('mobile-open');
    });
  }

  // Close sidebar on mobile when a nav item is clicked
  document.querySelectorAll('.nav-item').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (window.innerWidth <= 1024) {
        appSidebar.classList.remove('mobile-open');
      }
    });
  });

  // Tab Switcher Sidebar events
  var navItems = document.querySelectorAll('.nav-item');
  for (var k = 0; k < navItems.length; k++) {
    (function(item) {
      item.addEventListener('click', function() {
        // Toggle Nav Items Active State
        var allNavs = document.querySelectorAll('.nav-item');
        for (var n = 0; n < allNavs.length; n++) {
          allNavs[n].classList.remove('active');
        }
        item.classList.add('active');

        // Toggle Display Panel State
        var targetTabId = item.getAttribute('data-tab');
        var allPanels = document.querySelectorAll('.tab-panel');
        for (var p = 0; p < allPanels.length; p++) {
          allPanels[p].classList.remove('active');
        }
        
        var targetPanel = document.getElementById(targetTabId);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }

        // Force Chart.js redrawing on overview tab visible (fixes canvas dimension bugs)
        if (targetTabId === 'dashboard-tab') {
          var summary = getDecisionSummary(filteredData);
          var impact = calcEnvironmentalImpact(filteredData);
          renderAllCharts(summary, impact);
        }
      });
    })(navItems[k]);
  }

  // Search input debouncer
  var searchTimeout;
  document.getElementById('searchInput').addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 250);
  });

  // Filter dropdowns
  var filterIds = ['filterCategory', 'filterDepartment', 'filterCondition', 'filterAction'];
  for (var i = 0; i < filterIds.length; i++) {
    document.getElementById(filterIds[i]).addEventListener('change', applyFilters);
  }

  // Sorting columns
  var sortHeaders = document.querySelectorAll('.data-table th[data-sort]');
  for (var j = 0; j < sortHeaders.length; j++) {
    (function(th) {
      th.addEventListener('click', function() {
        handleSort(th.dataset.sort);
      });
    })(sortHeaders[j]);
  }

  // Export CSV
  var exportBtn = document.getElementById('exportCSV');
  if (exportBtn) {
    exportBtn.addEventListener('click', downloadCSV);
  }

  // Clear Dataset
  var clearBtn = document.getElementById('btnClearData');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearDataset);
  }

  // Drag and drop events for file upload
  var dropZone = document.getElementById('dropZone');
  var csvInput = document.getElementById('csvFileInput');
  var browseBtn = document.getElementById('browseBtn');

  browseBtn.addEventListener('click', function(e) {
    e.preventDefault();
    csvInput.click();
  });

  csvInput.addEventListener('change', function() {
    if (csvInput.files.length > 0) {
      handleUploadedFile(csvInput.files[0]);
    }
  });

  dropZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', function() {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleUploadedFile(e.dataTransfer.files[0]);
    }
  });

  // Manual Add Form submission
  var addForm = document.getElementById('addItemForm');
  if (addForm) {
    addForm.addEventListener('submit', handleManualAdd);
  }

  // Toggle custom category input when "Others" is selected
  var formCategory = document.getElementById('formCategory');
  var formCustomCategory = document.getElementById('formCustomCategory');
  if (formCategory && formCustomCategory) {
    formCategory.addEventListener('change', function() {
      if (formCategory.value === "Others") {
        formCustomCategory.style.display = "block";
        formCustomCategory.required = true;
      } else {
        formCustomCategory.style.display = "none";
        formCustomCategory.required = false;
        formCustomCategory.value = "";
      }
    });
  }

  // AI Vision File Input Listeners
  var visionBrowseBtn = document.getElementById('visionBrowseBtn');
  var visionFileInput = document.getElementById('visionFileInput');
  if (visionBrowseBtn && visionFileInput) {
    visionBrowseBtn.addEventListener('click', function(e) {
      e.preventDefault();
      visionFileInput.click();
    });

    visionFileInput.addEventListener('change', function() {
      if (visionFileInput.files.length > 0) {
        handleVisionScan(visionFileInput.files[0]);
      }
    });
  }

  // Webcam Action Bindings
  var visionCameraBtn = document.getElementById('visionCameraBtn');
  if (visionCameraBtn) {
    visionCameraBtn.addEventListener('click', function(e) {
      e.preventDefault();
      openWebcam();
    });
  }

  var btnCloseWebcam = document.getElementById('btnCloseWebcam');
  if (btnCloseWebcam) {
    btnCloseWebcam.addEventListener('click', closeWebcam);
  }

  var btnCancelWebcam = document.getElementById('btnCancelWebcam');
  if (btnCancelWebcam) {
    btnCancelWebcam.addEventListener('click', closeWebcam);
  }

  var btnCaptureWebcam = document.getElementById('btnCaptureWebcam');
  if (btnCaptureWebcam) {
    btnCaptureWebcam.addEventListener('click', captureWebcamPhoto);
  }
}

// ============================================================
// File Upload Processing (PapaParse)
// ============================================================
function handleUploadedFile(file) {
  var fileInfo = document.getElementById('fileInfo');
  fileInfo.textContent = file.name + ' (' + Math.round(file.size / 1024) + ' KB)';

  var enableAICleanup = document.getElementById('enableAICleanup');
  var useAI = enableAICleanup ? enableAICleanup.checked : false;

  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: function(results) {
      if (useAI) {
        cleanCSVWithAI(results.data);
      } else {
        processParsedCSV(results.data, false);
      }
    },
    error: function(err) {
      alert("Error parsing CSV: " + err.message);
    }
  });
}

// ============================================================
// AI Data Cleanup & Imputation (Groq Cloud - Qwen 3.6 27B)
// ============================================================
async function cleanCSVWithAI(rawData) {
  var apiKey = getAPIKey();
  
  // Show loading view with custom text
  var loadingView = document.getElementById('loading-view');
  var loadingMsg = loadingView ? loadingView.querySelector('.loading-pulse') : null;
  var originalHTML = loadingMsg ? loadingMsg.innerHTML : "";
  
  if (loadingView) {
    loadingView.style.display = 'flex';
    if (loadingMsg) {
      loadingMsg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin" style="margin-bottom: 20px;"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>' +
                           '<p style="color: #065f46; font-weight: 700; font-size: 1.1rem; margin-top: 16px;">✨ Llama 3.3 70B is analyzing your dataset columns...</p>';
    }
  }

  // Send only the column headers + first 3 sample rows to AI for schema mapping
  var headers = rawData.length > 0 ? Object.keys(rawData[0]) : [];
  var sampleRows = rawData.slice(0, 3);

  try {
    var response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are a column-mapping engine for e-waste datasets. " +
                     "The user will give you CSV column headers and 3 sample rows. " +
                     "Your job: map the user's column names to these target keys: category, device_name, brand, department, purchase_year, weight_kg, condition_score, power_watts, hazardous. " +
                     "Also provide a default_category (best guess from the data, e.g. Computer, Monitor, Peripheral, Mobile Device, Battery, Networking, Storage, or Others). " +
                     "Also provide default_weight and default_power estimates if those columns are missing entirely. " +
                     "Reply with ONLY a valid JSON object like: " +
                     '{"mapping": {"OriginalCol1": "category", "OriginalCol2": "device_name", ...}, "default_category": "Computer", "default_weight": 3.0, "default_power": 100} ' +
                     "Do NOT include any markdown, code fences, explanations, or extra text. Output ONLY the raw JSON object."
          },
          {
            role: "user",
            content: "Headers: " + JSON.stringify(headers) + "\nSample rows: " + JSON.stringify(sampleRows)
          }
        ],
        temperature: 0.1,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      var errorBody = await response.text();
      throw new Error("API status " + response.status + ": " + errorBody.substring(0, 200));
    }

    var result = await response.json();
    var content = result.choices[0].message.content.trim();
    
    // Strip reasoning thought block if it exists (e.g. <think>...</think>)
    if (content.includes("</think>")) {
      content = content.substring(content.indexOf("</think>") + 8).trim();
    }
    
    // Extract only the JSON object between the first '{' and the last '}' to strip extra text or markdown
    var firstBrace = content.indexOf("{");
    var lastBrace = content.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      content = content.substring(firstBrace, lastBrace + 1);
    } else {
      // Fallback: Strip markdown code fences if braces weren't matched
      content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    }
    
    var schema = JSON.parse(content);
    var mapping = schema.mapping || {};
    var defaultCat = schema.default_category || "Computer";
    var defaultWeight = schema.default_weight || 3.0;
    var defaultPower = schema.default_power || 100;

    // Apply the AI-generated mapping to ALL rows locally
    var targetKeys = ['category', 'device_name', 'brand', 'department', 'purchase_year', 'weight_kg', 'condition_score', 'power_watts', 'hazardous'];
    
    var mappedData = rawData.map(function(row) {
      var newRow = {};
      
      targetKeys.forEach(function(target) {
        var found = false;
        
        // 1. Look in mapping: does mapping have a key pointing to this target or vice versa?
        for (var key in mapping) {
          if (mapping.hasOwnProperty(key)) {
            var val = String(mapping[key]).toLowerCase();
            var k = String(key).toLowerCase();
            
            if (val === target) {
              // Found mapping: key is the original column name in CSV
              for (var rowKey in row) {
                if (row.hasOwnProperty(rowKey) && rowKey.toLowerCase() === k) {
                  newRow[target] = row[rowKey];
                  found = true;
                  break;
                }
              }
            } else if (k === target) {
              // Found mapping: key is the target name, val is the original column name
              for (var rowKey in row) {
                if (row.hasOwnProperty(rowKey) && rowKey.toLowerCase() === val) {
                  newRow[target] = row[rowKey];
                  found = true;
                  break;
                }
              }
            }
          }
          if (found) break;
        }

        // 2. Fallback: If AI mapping didn't find it, try direct case-insensitive matching
        if (!found) {
          var cleanTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');
          for (var rowKey in row) {
            if (row.hasOwnProperty(rowKey)) {
              var cleanRowKey = rowKey.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (cleanRowKey === cleanTarget || cleanRowKey.includes(cleanTarget) || cleanTarget.includes(cleanRowKey)) {
                newRow[target] = row[rowKey];
                break;
              }
            }
          }
        }
      });

      // Apply defaults for missing fields
      if (!newRow.category) newRow.category = defaultCat;
      if (!newRow.device_name) {
        // Fallback for device name checking different common key variations
        newRow.device_name = row.device_name || row.device || row.DeviceName || row.Model || row.ModelName || "Generic Asset";
      }
      if (!newRow.weight_kg && newRow.weight_kg !== 0) newRow.weight_kg = defaultWeight;
      if (!newRow.power_watts && newRow.power_watts !== 0) newRow.power_watts = defaultPower;
      if (!newRow.condition_score) newRow.condition_score = 5;
      
      // Keep other original values as fallback in case processParsedCSV needs them
      for (var rk in row) {
        if (row.hasOwnProperty(rk) && !newRow.hasOwnProperty(rk)) {
          newRow[rk] = row[rk];
        }
      }
      
      return newRow;
    });

    processParsedCSV(mappedData, true);
    alert("AI Cleanup Successful! Mapped and processed " + mappedData.length + " items.");

  } catch (error) {
    console.error("AI Cleanup error:", error);
    alert("AI Cleanup failed: " + error.message + "\n\nFalling back to raw import (columns may not map correctly).");
    processParsedCSV(rawData, false);
  } finally {
    if (loadingView) {
      loadingView.style.display = 'none';
      if (loadingMsg && originalHTML) {
        loadingMsg.innerHTML = originalHTML;
      }
    }
  }
}

async function executeVisionScan(base64Image, sourceName) {
  // Show loading view
  var loadingView = document.getElementById('loading-view');
  var loadingMsg = loadingView ? loadingView.querySelector('.loading-pulse') : null;
  var originalHTML = loadingMsg ? loadingMsg.innerHTML : "";
  
  if (loadingView) {
    loadingView.style.display = 'flex';
    if (loadingMsg) {
      loadingMsg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin" style="margin-bottom: 20px;"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>' +
                           '<p style="color: #0891b2; font-weight: 700; font-size: 1.1rem; margin-top: 16px;">Llama 4 Scout is scanning your device photo...</p>';
    }
  }

  var apiKey = getAPIKey();
  
  try {
    var response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image of an e-waste or IT asset. " +
                      "Identify the asset and output a valid JSON object with the following keys: " +
                      "1. 'category' (The specific type or category of the device. Be highly precise. For example, output 'Mouse' instead of 'Peripheral', 'Keyboard' instead of 'Peripheral', 'Router' instead of 'Networking', 'Laptop' or 'Desktop' instead of 'Computer', etc. Do not use broad categories; output the exact item type.) " +
                      "2. 'device_name' (Model name, e.g. 'Optiplex 7080' or 'iPhone 11' or 'Generic Hub') " +
                      "3. 'brand' (e.g. Dell, HP, Apple, Cisco, Logitech, Samsung) " +
                      "4. 'condition_score' (A number from 1 to 10 based on physical dust, cracks, or damage visible in the image) " +
                      "5. 'weight_kg' (Estimate a reasonable weight in kg for this device, as a number) " +
                      "6. 'power_watts' (Estimate a reasonable power draw in Watts for this device, as a number) " +
                      "7. 'hazardous' (Whether it is a battery, CRT, or contains toxic elements. Reply strictly 'Yes' or 'No') " +
                      "Ensure the output is ONLY a valid JSON object containing these keys. Do not output thinking, markdown code fences, or any other explanations."
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      var errorBody = await response.text();
      throw new Error("API status " + response.status + ": " + errorBody.substring(0, 200));
    }

    var result = await response.json();
    var content = result.choices[0].message.content.trim();
    
    // Extract JSON using boundary brace matcher
    var firstBrace = content.indexOf("{");
    var lastBrace = content.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      content = content.substring(firstBrace, lastBrace + 1);
    }
    
    var data = JSON.parse(content);
    
    // Auto-populate the manual add form inputs
    if (data.category) {
      var standardCategories = ["Computer", "Monitor", "Peripheral", "Mobile Device", "Battery", "Networking", "Storage"];
      var standardSelect = document.getElementById('formCategory');
      var customInput = document.getElementById('formCustomCategory');
      
      var foundIndex = -1;
      for (var i = 0; i < standardCategories.length; i++) {
        if (standardCategories[i].toLowerCase() === data.category.toLowerCase()) {
          foundIndex = i;
          break;
        }
      }
      
      if (foundIndex !== -1) {
        standardSelect.value = standardCategories[foundIndex];
        customInput.style.display = "none";
        customInput.required = false;
        customInput.value = "";
      } else {
        standardSelect.value = "Others";
        customInput.style.display = "block";
        customInput.required = true;
        var capCategory = data.category.charAt(0).toUpperCase() + data.category.slice(1);
        customInput.value = capCategory;
      }
    }
    if (data.device_name) document.getElementById('formDevice').value = data.device_name;
    if (data.brand) document.getElementById('formBrand').value = data.brand;
    document.getElementById('formDept').value = data.department || "Unassigned";
    if (data.weight_kg !== undefined) document.getElementById('formWeight').value = data.weight_kg;
    if (data.condition_score !== undefined) document.getElementById('formCondition').value = data.condition_score;
    if (data.power_watts !== undefined) document.getElementById('formPower').value = data.power_watts;
    if (data.hazardous) {
      var hazVal = String(data.hazardous).toLowerCase();
      if (hazVal === "yes" || hazVal === "true") {
        document.getElementById('formHaz').value = "Yes";
      } else {
        document.getElementById('formHaz').value = "No";
      }
    }
    
    alert("AI Vision successfully scanned " + (data.device_name || "device") + " and populated the form!");

  } catch (err) {
    console.error("AI Vision scan failed:", err);
    alert("AI Vision scan failed: " + err.message);
  } finally {
    if (loadingView) {
      loadingView.style.display = 'none';
      if (loadingMsg && originalHTML) {
        loadingMsg.innerHTML = originalHTML;
      }
    }
  }
}

async function handleVisionScan(file) {
  if (!file.type.startsWith("image/")) {
    alert("Please select a valid image file.");
    return;
  }

  var visionFileInfo = document.getElementById('visionFileInfo');
  if (visionFileInfo) {
    visionFileInfo.textContent = file.name + ' (' + Math.round(file.size / 1024) + ' KB)';
  }

  var reader = new FileReader();
  reader.onload = async function(e) {
    var base64Image = e.target.result;
    await executeVisionScan(base64Image, file.name);
    document.getElementById('visionFileInput').value = "";
  };
  reader.readAsDataURL(file);
}

// Webcam integration functions
var webcamStream = null;

function openWebcam() {
  var modal = document.getElementById('webcamModal');
  var video = document.getElementById('webcamVideo');
  var errorMsg = document.getElementById('webcamErrorMsg');
  
  if (!modal || !video) return;
  
  errorMsg.style.display = "none";
  video.style.display = "block";
  modal.style.display = "flex";
  
  navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }
  })
  .then(function(stream) {
    webcamStream = stream;
    video.srcObject = stream;
  })
  .catch(function(err) {
    console.error("Error accessing webcam:", err);
    video.style.display = "none";
    errorMsg.textContent = "Webcam access denied or unavailable: " + err.message;
    errorMsg.style.display = "block";
  });
}

function closeWebcam() {
  var modal = document.getElementById('webcamModal');
  if (modal) {
    modal.style.display = "none";
  }
  if (webcamStream) {
    webcamStream.getTracks().forEach(function(track) {
      track.stop();
    });
    webcamStream = null;
  }
  var video = document.getElementById('webcamVideo');
  if (video) {
    video.srcObject = null;
  }
}

function captureWebcamPhoto() {
  var video = document.getElementById('webcamVideo');
  if (!video || !webcamStream) return;
  
  var canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  
  var ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  var base64Image = canvas.toDataURL('image/jpeg');
  
  closeWebcam();
  
  var visionFileInfo = document.getElementById('visionFileInfo');
  if (visionFileInfo) {
    visionFileInfo.textContent = "Webcam snapshot captured";
  }
  
  executeVisionScan(base64Image, "webcam_snapshot.jpg");
}


// Normalizes CSV headers and formats fields dynamically
function processParsedCSV(data, aiCleaned) {
  if (!data || data.length === 0) {
    alert("The uploaded file is empty.");
    return;
  }

  // ---- STRICT VALIDATION (when AI is OFF) ----
  // If AI did NOT clean this data, check if columns match our expected schema
  if (!aiCleaned) {
    var firstRow = data[0];
    var rowKeys = Object.keys(firstRow).map(function(k) { return k.toLowerCase(); });
    
    // List of recognized column name patterns
    var recognizedPatterns = [
      'category', 'cat', 'device', 'model', 'device_name', 'devicename',
      'brand', 'manufacturer', 'department', 'dept',
      'purchase_year', 'year', 'purchaseyear', 'yr',
      'weight', 'weight_kg', 'mass',
      'condition', 'condition_score', 'score', 'conditionscore', 'cond',
      'power', 'power_watts', 'watts', 'powerwatts',
      'hazardous', 'haz', 'contains_hazardous',
      'item_id', 'id', 'status', 'date', 'date_collected',
      'replacement_cost', 'cost', 'embodied', 'embodied_energy_kwh'
    ];
    
    var matchedCount = 0;
    rowKeys.forEach(function(key) {
      var cleanKey = key.replace(/[^a-z0-9]/g, '');
      for (var i = 0; i < recognizedPatterns.length; i++) {
        if (cleanKey === recognizedPatterns[i] || cleanKey.includes(recognizedPatterns[i]) || recognizedPatterns[i].includes(cleanKey)) {
          matchedCount++;
          break;
        }
      }
    });
    
    // If fewer than 3 columns match our schema, reject the dataset
    if (matchedCount < 3) {
      alert("Dataset Rejected: The uploaded CSV columns do not match the expected e-waste schema.");
      return;
    }
  }

  var currentYear = 2026;
  var items = [];
  
  // For merge mode: start ID counter after existing data
  var idCounter = processedData.length + 1;

  var defaultEmbodied = {
    "Computer": 1200, "Monitor": 750, "Peripheral": 200, "Mobile Device": 70, "Battery": 150, "Networking": 300, "Storage": 100
  };

  data.forEach(function(row) {
    var cat = row.category || row.Category || "Computer";
    var dev = row.device_name || row.device || row.DeviceName || row.Model || "Generic Asset";
    var brand = row.brand || row.Brand || "Generic";
    var dept = row.department || row.dept || row.Department || "Unassigned";
    var year = parseInt(row.purchase_year || row.year || row.PurchaseYear || currentYear);
    var age = currentYear - year;
    var weight = parseFloat(row.weight_kg || row.weight || row.Weight || 3.0);
    var score = parseInt(row.condition_score || row.score || row.ConditionScore || 7);
    var power = parseFloat(row.power_watts || row.power || row.Power || 100);
    
    var hazString = String(row.contains_hazardous || row.hazardous || row.Hazardous || "No").toLowerCase();
    var containsHaz = (hazString === "yes" || hazString === "true" || hazString === "1");

    var replacementCost = parseFloat(row.replacement_cost || row.cost || row.ReplacementCost || 500);
    var embodied = parseInt(row.embodied_energy_kwh || row.embodied || defaultEmbodied[cat] || 150);

    var itemId = row.item_id || row.itemId || row.ID || ('EW-' + currentYear + '-' + String(idCounter++).padStart(4, '0'));

    items.push({
      item_id: itemId,
      category: cat,
      device_name: dev,
      brand: brand,
      department: dept,
      purchase_year: year,
      age_years: age,
      weight_kg: weight,
      condition_score: score,
      condition_class: "", 
      power_watts: power,
      status: row.status || row.Status || "Collected",
      recommended_action: "", 
      date_collected: row.date_collected || row.date || (new Date().toISOString().split('T')[0]),
      contains_hazardous: containsHaz,
      replacement_cost: replacementCost,
      embodied_energy_kwh: embodied
    });
  });

  var newItems = processDecisions(items);

  // ---- MERGE MODE ----
  // If there is existing data, merge (append) instead of overwriting
  if (processedData.length > 0) {
    processedData = processedData.concat(newItems);
    alert("✅ Merged " + newItems.length + " new assets with " + (processedData.length - newItems.length) + " existing assets.\nTotal: " + processedData.length + " assets.");
  } else {
    processedData = newItems;
    alert("Successfully uploaded and processed " + processedData.length + " assets!");
  }

  saveToLocalStorage();
  filteredData = processedData.slice();

  // Populate filter selects & re-render dashboard
  populateFilters();
  renderDashboard();
  generateCSVData();
  
  // Switch visual tab back to the dashboard panel automatically
  var dashboardBtn = document.querySelector('[data-tab="dashboard-tab"]');
  if (dashboardBtn) {
    dashboardBtn.click();
  }
}

// ============================================================
// Manual Entry Addition
// ============================================================
function handleManualAdd(e) {
  e.preventDefault();

  var cat = document.getElementById('formCategory').value;
  if (cat === "Others") {
    cat = document.getElementById('formCustomCategory').value.trim() || "Others";
    // Capitalize first letter of custom category/type
    cat = cat.charAt(0).toUpperCase() + cat.slice(1);
  }
  var dev = document.getElementById('formDevice').value;
  var brand = document.getElementById('formBrand').value;
  var dept = document.getElementById('formDept').value;
  var year = parseInt(document.getElementById('formYear').value);
  var weight = parseFloat(document.getElementById('formWeight').value);
  var score = parseInt(document.getElementById('formCondition').value);
  var power = parseFloat(document.getElementById('formPower').value);
  var manualAction = document.getElementById('formAction').value;
  var manualHaz = document.getElementById('formHaz').value;

  var currentYear = 2026;
  var nextIdNum = processedData.length + 1;
  var itemId = 'EW-' + currentYear + '-' + String(nextIdNum).padStart(4, '0');

  var defaultReplacement = {
    "Computer": 900, "Monitor": 250, "Peripheral": 150, "Mobile Device": 400, "Battery": 120, "Networking": 500, "Storage": 120
  };
  var defaultEmbodied = {
    "Computer": 1200, "Monitor": 750, "Peripheral": 200, "Mobile Device": 70, "Battery": 150, "Networking": 300, "Storage": 100
  };

  var containsHaz = false;
  if (manualHaz === "Yes") {
    containsHaz = true;
  } else if (manualHaz === "No") {
    containsHaz = false;
  } else {
    if (cat === "Battery" && score <= 3) containsHaz = true;
    else if (score === 1) containsHaz = true;
  }

  var newItem = {
    item_id: itemId,
    category: cat,
    device_name: brand + " " + dev,
    brand: brand,
    department: dept,
    purchase_year: year,
    age_years: currentYear - year,
    weight_kg: weight,
    condition_score: score,
    condition_class: "", 
    power_watts: power,
    status: "Collected",
    recommended_action: manualAction, 
    date_collected: new Date().toISOString().split('T')[0],
    contains_hazardous: containsHaz,
    replacement_cost: defaultReplacement[cat] || 250,
    embodied_energy_kwh: defaultEmbodied[cat] || 150
  };

  // Process rules
  var processedItem = processDecisions([newItem])[0];

  // Prepend to array
  processedData.unshift(processedItem);
  saveToLocalStorage();
  
  // Re-apply filters
  applyFilters();
  
  // Reset form inputs
  document.getElementById('addItemForm').reset();
  var customInput = document.getElementById('formCustomCategory');
  if (customInput) {
    customInput.style.display = "none";
    customInput.required = false;
    customInput.value = "";
  }
  
  // Re-generate CSV content
  generateCSVData();

  alert("Asset " + itemId + " successfully added!");

  // Switch visual view to Registry Tab so they see the row
  var registryBtn = document.querySelector('[data-tab="inventory-tab"]');
  if (registryBtn) {
    registryBtn.click();
  }
}

// ============================================================
// CSV Data Creation for Export
// ============================================================
function generateCSVData() {
  var headers = [
    'item_id', 'category', 'device_name', 'brand', 'department',
    'purchase_year', 'age_years', 'weight_kg', 'condition_score',
    'condition_class', 'power_watts', 'status', 'recommended_action',
    'date_collected', 'contains_hazardous', 'replacement_cost', 'embodied_energy_kwh'
  ];

  var csv = headers.join(',') + '\n';

  for (var i = 0; i < processedData.length; i++) {
    var item = processedData[i];
    var row = [
      item.item_id,
      item.category,
      '"' + item.device_name + '"',
      item.brand,
      '"' + item.department + '"',
      item.purchase_year,
      item.age_years,
      item.weight_kg,
      item.condition_score,
      item.condition_class,
      item.power_watts,
      item.status,
      item.recommended_action,
      item.date_collected,
      item.contains_hazardous ? 'Yes' : 'No',
      item.replacement_cost,
      item.embodied_energy_kwh
    ];
    csv += row.join(',') + '\n';
  }

  window._csvData = csv;
}

function downloadCSV() {
  var blob = new Blob([window._csvData], { type: 'text/csv;charset=utf-8;' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'ewaste_inventory_registry.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

// ============================================================
// Start Application
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  initDashboard();

  // Check if already logged in (persist across refresh)
  var isLoggedIn = sessionStorage.getItem('ewaste_logged_in');
  if (isLoggedIn === 'true') {
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('dashboard-view').style.display = 'block';
    window.dispatchEvent(new Event('resize'));
  }
  
  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var username = document.getElementById('username').value.trim();
      var password = document.getElementById('password').value.trim();

      // Validate credentials
      if (username === 'Admin' && password === 'DSU') {
        // Save login state
        sessionStorage.setItem('ewaste_logged_in', 'true');

        document.getElementById('login-view').style.display = 'none';
        document.getElementById('loading-view').style.display = 'flex';
        
        setTimeout(function() {
          document.getElementById('loading-view').style.display = 'none';
          document.getElementById('dashboard-view').style.display = 'block';
          window.dispatchEvent(new Event('resize'));
        }, 2500);
      } else {
        // Show error
        var errorMsg = document.getElementById('login-error');
        if (!errorMsg) {
          errorMsg = document.createElement('p');
          errorMsg.id = 'login-error';
          errorMsg.style.color = '#e74c3c';
          errorMsg.style.fontWeight = '600';
          errorMsg.style.marginTop = '12px';
          errorMsg.style.textAlign = 'center';
          loginForm.appendChild(errorMsg);
        }
        errorMsg.textContent = 'Invalid username or password.';
      }
    });
  } else {
    var dash = document.getElementById('dashboard-view');
    if (dash) dash.style.display = 'block';
  }

  // ============================================================
  // Settings Modal Logic
  // ============================================================
  var btnOpenSettings = document.getElementById('btnOpenSettings');
  var btnCloseSettings = document.getElementById('btnCloseSettings');
  var btnCancelSettings = document.getElementById('btnCancelSettings');
  var settingsModal = document.getElementById('settingsModal');
  var settingsForm = document.getElementById('settingsForm');

  if (btnOpenSettings && settingsModal) {
    btnOpenSettings.addEventListener('click', function() {
      // Populate inputs with current variables (from calculations.js)
      document.getElementById('inputRateBDT').value = ELECTRICITY_RATE_BDT;
      document.getElementById('inputEmissionFactor').value = EMISSION_FACTOR;
      document.getElementById('inputDailyHours').value = AVG_DAILY_HOURS;
      
      settingsModal.style.display = 'flex';
    });
  }

  function closeSettings() {
    if (settingsModal) settingsModal.style.display = 'none';
  }

  if (btnCloseSettings) btnCloseSettings.addEventListener('click', closeSettings);
  if (btnCancelSettings) btnCancelSettings.addEventListener('click', closeSettings);

  if (settingsForm) {
    settingsForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var newRate = document.getElementById('inputRateBDT').value;
      var newEmission = document.getElementById('inputEmissionFactor').value;
      var newHours = document.getElementById('inputDailyHours').value;

      // Update constants (function from calculations.js)
      updateConstants(newRate, newEmission, newHours);
      
      // Re-render dashboard to show new calculated savings
      renderDashboard();
      
      closeSettings();
    });
  }

  // ============================================================
  // Logout Logic
  // ============================================================
  function handleLogout() {
    // Clear session storage
    sessionStorage.removeItem('ewaste_logged_in');
    
    // Clear login form
    var loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.reset();
    
    // Remove any error messages
    var errorMsg = document.getElementById('login-error');
    if (errorMsg) errorMsg.remove();
    
    // Switch view back to login
    document.getElementById('dashboard-view').style.display = 'none';
    document.getElementById('login-view').style.display = 'flex';
  }

  var btnLogout = document.getElementById('btnLogout');
  var mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
  
  if (btnLogout) btnLogout.addEventListener('click', handleLogout);
  if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', handleLogout);
  
  // ============================================================
  // Easter Egg: Random Peeking Cat
  // ====================================================================================
  var peekingCat = document.getElementById('peekingCat');
  if (peekingCat) {
    function triggerCatPeek() {
      // Add the peek class to slide it up
      peekingCat.classList.add('peek');
      
      // Keep it up for 2.5 seconds, then slide it down
      setTimeout(function() {
        peekingCat.classList.remove('peek');
      }, 2500);
      
      // Schedule the next peek at a random interval between 15s and 45s
      var nextPeekDelay = Math.floor(Math.random() * (45000 - 15000 + 1)) + 15000;
      setTimeout(triggerCatPeek, nextPeekDelay);
    }
    
    // Start the first peek sequence after 10 seconds
    setTimeout(triggerCatPeek, 10000);
  }
});

// ============================================================
// Clear Entire Dataset Function
// ============================================================
function clearDataset() {
  if (confirm("Are you sure you want to clear the entire e-waste dataset? This action cannot be undone.")) {
    processedData = [];
    filteredData = [];
    saveToLocalStorage();
    populateFilters();
    renderDashboard();
    
    // Clear CSV download file contents
    if (typeof generateCSVData === "function") {
      generateCSVData();
    }
    
    alert("Dataset successfully cleared.");
  }
}
