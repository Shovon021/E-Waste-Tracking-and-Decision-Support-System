// ============================================================
// E-Waste Dashboard — Chart.js Visualizations
// Configured for a Clean Corporate Light Theme & Live Refreshes
// ============================================================

// Light theme color palette
const COLORS = {
  textPrimary: '#0f172a',      // Slate 900
  textSecondary: '#475569',    // Slate 600
  gridColor: 'rgba(0, 0, 0, 0.06)',

  // Action colors
  reuse: '#10b981',    // Emerald
  repair: '#3b82f6',   // Blue
  recycle: '#f59e0b',  // Amber
  dispose: '#ef4444',  // Red

  // Condition colors
  good: '#10b981',
  fair: '#3b82f6',
  poor: '#f59e0b',
  hazardous: '#ef4444',

  // Category palette (7 colors)
  categoryPalette: [
    '#1e3a8a', '#3b82f6', '#10b981', '#f59e0b',
    '#ef4444', '#06b6d4', '#8b5cf6'
  ]
};

// Apply global Chart.js defaults
Chart.defaults.color = COLORS.textSecondary;
Chart.defaults.font.family = "'Inter', system-ui, -apple-system, sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.padding = 12;

// Keep track of charts for garbage collection / destroy on update
var chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

// ============================================================
// Category Bar Chart
// ============================================================
function renderCategoryChart(summary) {
  destroyChart('categoryChart');
  var ctx = document.getElementById('categoryChart').getContext('2d');

  var categories = Object.keys(summary.categoryCounts);
  var counts = Object.values(summary.categoryCounts);

  chartInstances['categoryChart'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [{
        label: 'Asset Count',
        data: counts,
        backgroundColor: COLORS.categoryPalette.slice(0, categories.length),
        borderRadius: 4,
        maxBarThickness: 32
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'IT Assets by Category',
          color: COLORS.textPrimary,
          font: { size: 13, weight: '700' }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: COLORS.gridColor },
          ticks: { precision: 0 }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

// ============================================================
// Recommended Action Donut Chart
// ============================================================
function renderActionChart(summary) {
  destroyChart('actionChart');
  var ctx = document.getElementById('actionChart').getContext('2d');

  // Align keys with action count colors
  var actionLabels = ['Reuse', 'Repair', 'Recycle', 'Dispose'];
  var counts = actionLabels.map(function(act) { return summary.actionCounts[act] || 0; });
  var bgColors = [COLORS.reuse, COLORS.repair, COLORS.recycle, COLORS.dispose];

  chartInstances['actionChart'] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: actionLabels,
      datasets: [{
        data: counts,
        backgroundColor: bgColors,
        borderWidth: 1,
        borderColor: '#ffffff',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 12 }
        },
        title: {
          display: true,
          text: 'Recommended Disposal Pathways',
          color: COLORS.textPrimary,
          font: { size: 13, weight: '700' }
        }
      }
    }
  });
}

// ============================================================
// Condition Distribution Pie Chart
// ============================================================
function renderConditionChart(summary) {
  destroyChart('conditionChart');
  var ctx = document.getElementById('conditionChart').getContext('2d');

  var conditionLabels = ['Good', 'Fair', 'Poor', 'Hazardous'];
  var counts = conditionLabels.map(function(cond) { return summary.conditionCounts[cond] || 0; });
  var bgColors = [COLORS.good, COLORS.fair, COLORS.poor, COLORS.hazardous];

  chartInstances['conditionChart'] = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: conditionLabels,
      datasets: [{
        data: counts,
        backgroundColor: bgColors,
        borderWidth: 1,
        borderColor: '#ffffff',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 12 }
        },
        title: {
          display: true,
          text: 'IT Assets Physical Condition',
          color: COLORS.textPrimary,
          font: { size: 13, weight: '700' }
        }
      }
    }
  });
}

// ============================================================
// Department Breakdown Horizontal Bar Chart
// ============================================================
function renderDepartmentChart(summary) {
  destroyChart('departmentChart');
  var ctx = document.getElementById('departmentChart').getContext('2d');

  var departments = Object.keys(summary.departmentCounts);
  var counts = Object.values(summary.departmentCounts);

  chartInstances['departmentChart'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: departments,
      datasets: [{
        data: counts,
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        maxBarThickness: 16
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Assets in Registry by Department',
          color: COLORS.textPrimary,
          font: { size: 13, weight: '700' }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: COLORS.gridColor },
          ticks: { precision: 0 }
        },
        y: {
          grid: { display: false }
        }
      }
    }
  });
}

// ============================================================
// Before vs After Operational Impact
// ============================================================
function renderComparisonChart(impact) {
  destroyChart('comparisonChart');
  var ctx = document.getElementById('comparisonChart').getContext('2d');

  chartInstances['comparisonChart'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Operational Energy (kWh)', 'Cost (USD equiv. * 10)', 'Carbon Footprint (kg CO₂ * 10)'],
      datasets: [
        {
          label: 'Baseline (Unoptimized Hardware Lifecycle)',
          data: [
            impact.energyBefore, 
            impact.costBeforeUSD * 10, 
            impact.co2Before * 10
          ],
          backgroundColor: '#ef4444',
          borderRadius: 4
        },
        {
          label: 'Optimized (Extension & Active Recycling)',
          data: [
            impact.energyAfter, 
            impact.costAfterUSD * 10, 
            impact.co2After * 10
          ],
          backgroundColor: '#10b981',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { padding: 12 }
        },
        title: {
          display: true,
          text: 'Annual Baseline Comparison vs. Proposed Optimization Strategy',
          color: COLORS.textPrimary,
          font: { size: 13, weight: '700' }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: COLORS.gridColor }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

// ============================================================
// Trigger Rendering for All Visuals
// ============================================================
function renderAllCharts(summary, impact) {
  renderCategoryChart(summary);
  renderActionChart(summary);
  renderConditionChart(summary);
  renderDepartmentChart(summary);
  renderComparisonChart(impact);
}
