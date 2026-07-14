// ============================================================
// E-Waste Environmental Calculations
// Based on Green IS Project Formulas
// Configured for Bangladesh (East West University context)
// ============================================================

// Bangladesh-specific variables (loaded from localStorage or defaults)
let EMISSION_FACTOR = 0.59;            // kg CO2 per kWh (Bangladesh power grid, 2024)
let ELECTRICITY_RATE_BDT = 8.19;       // BDT per kWh (BPDB industrial rate 2025)
let ELECTRICITY_RATE_USD = 0.075;      // USD per kWh (approximate conversion)
let AVG_DAILY_HOURS = 8;               // Average operating hours per day at EWU
let WORKING_DAYS_PER_YEAR = 280;       // ~280 working days (Bangladeshi academic calendar)
let ANNUAL_HOURS = AVG_DAILY_HOURS * WORKING_DAYS_PER_YEAR; // 2240 hours/year

function initConstants() {
  var savedEmission = localStorage.getItem('ewaste_emission_factor');
  var savedRate = localStorage.getItem('ewaste_electricity_rate');
  var savedHours = localStorage.getItem('ewaste_daily_hours');

  if (savedEmission !== null) EMISSION_FACTOR = parseFloat(savedEmission);
  if (savedRate !== null) ELECTRICITY_RATE_BDT = parseFloat(savedRate);
  if (savedHours !== null) {
    AVG_DAILY_HOURS = parseFloat(savedHours);
    ANNUAL_HOURS = AVG_DAILY_HOURS * WORKING_DAYS_PER_YEAR;
  }
}

function updateConstants(newRate, newEmission, newHours) {
  ELECTRICITY_RATE_BDT = parseFloat(newRate);
  EMISSION_FACTOR = parseFloat(newEmission);
  AVG_DAILY_HOURS = parseFloat(newHours);
  ANNUAL_HOURS = AVG_DAILY_HOURS * WORKING_DAYS_PER_YEAR;

  localStorage.setItem('ewaste_electricity_rate', ELECTRICITY_RATE_BDT);
  localStorage.setItem('ewaste_emission_factor', EMISSION_FACTOR);
  localStorage.setItem('ewaste_daily_hours', AVG_DAILY_HOURS);
}

// Initialize constants immediately when script loads
initConstants();

/**
 * Formula 1: Energy Consumption
 * E = (N × P × T) / 1000
 *
 * @param {number} N - Number of devices
 * @param {number} P - Power per device in watts
 * @param {number} T - Operating time in hours
 * @returns {number} - Energy in kWh
 */
function calcEnergy(N, P, T) {
  return (N * P * T) / 1000;
}

/**
 * Formula 2: Electricity Cost
 * Cost = E × R
 *
 * @param {number} E - Energy in kWh
 * @param {number} R - Rate per kWh (default: 8.19 BDT)
 * @returns {number} - Cost in BDT
 */
function calcCostBDT(E, R) {
  R = R || ELECTRICITY_RATE_BDT;
  return E * R;
}

/**
 * Formula 2 (USD version): Electricity Cost
 * Cost = E × R
 *
 * @param {number} E - Energy in kWh
 * @param {number} R - Rate per kWh (default: 0.075 USD)
 * @returns {number} - Cost in USD
 */
function calcCost(E, R) {
  R = R || ELECTRICITY_RATE_USD;
  return E * R;
}

/**
 * Formula 3: Carbon Emission
 * CO2 = E × EF
 *
 * @param {number} E - Energy in kWh
 * @param {number} EF - Emission factor (default: 0.59 kg CO2/kWh for Bangladesh)
 * @returns {number} - CO2 in kg
 */
function calcCO2(E, EF) {
  EF = EF || EMISSION_FACTOR;
  return E * EF;
}

/**
 * Formula 4: Saving Percentage
 * Saving(%) = ((Before - After) / Before) × 100
 *
 * @param {number} before - Value before solution
 * @param {number} after - Value after solution
 * @returns {number} - Saving percentage
 */
function calcSaving(before, after) {
  if (before === 0) return 0;
  return ((before - after) / before) * 100;
}

/**
 * Calculate embodied energy saved by reusing/repairing items
 * instead of manufacturing new ones
 *
 * @param {Array} items - Processed e-waste items
 * @returns {number} - Total embodied energy saved in kWh
 */
function calcEmbodiedEnergySaved(items) {
  return items
    .filter(function(item) { return item.recommended_action === "Reuse" || item.recommended_action === "Repair"; })
    .reduce(function(total, item) { return total + (item.embodied_energy_kwh || 0); }, 0);
}

/**
 * Calculate total weight diverted from landfill
 * (items that are reused, repaired, or recycled)
 *
 * @param {Array} items - Processed e-waste items
 * @returns {number} - Total weight in kg
 */
function calcLandfillAvoided(items) {
  return items
    .filter(function(item) { return ["Reuse", "Repair", "Recycle"].indexOf(item.recommended_action) !== -1; })
    .reduce(function(total, item) { return total + item.weight_kg; }, 0);
}

/**
 * Calculate operational energy consumption of old devices
 * (the "Before" scenario: all old devices are still running)
 *
 * @param {Array} items - E-waste items
 * @returns {number} - Annual energy in kWh
 */
function calcOperationalEnergyBefore(items) {
  return items
    .reduce(function(total, item) {
      return total + calcEnergy(1, item.power_watts || 0, ANNUAL_HOURS);
    }, 0);
}

/**
 * Calculate operational energy savings after solution
 * Assumptions:
 *   Reused items → consume 100% power (still operational)
 *   Repaired items → consume 90% power (serviced, slight gain)
 *   Recycled/Disposed items → replaced with 40% more efficient new devices
 *
 * @param {Array} items - Processed e-waste items
 * @returns {number} - Annual energy after optimization in kWh
 */
function calcOperationalEnergyAfter(items) {
  return items
    .reduce(function(total, item) {
      var factor;
      switch (item.recommended_action) {
        case "Reuse":
          factor = 1.0;
          break;
        case "Repair":
          factor = 0.9;
          break;
        case "Recycle":
        case "Dispose":
          factor = 0.6;
          break;
        default:
          factor = 1.0;
      }
      return total + calcEnergy(1, (item.power_watts || 0) * factor, ANNUAL_HOURS);
    }, 0);
}

/**
 * Calculate full environmental impact summary
 * All monetary values in both BDT and USD
 *
 * @param {Array} items - Processed e-waste items
 * @returns {Object} - Complete environmental metrics
 */
function calcEnvironmentalImpact(items) {
  var totalItems = items.length;
  var totalWeight = items.reduce(function(sum, item) { return sum + item.weight_kg; }, 0);

  // Embodied energy savings (from avoiding new manufacturing)
  var embodiedEnergySaved = calcEmbodiedEnergySaved(items);
  var embodiedCO2Saved = calcCO2(embodiedEnergySaved);
  var embodiedCostBDT = calcCostBDT(embodiedEnergySaved);
  var embodiedCostUSD = calcCost(embodiedEnergySaved);

  // Operational energy (before vs after)
  var energyBefore = calcOperationalEnergyBefore(items);
  var energyAfter = calcOperationalEnergyAfter(items);
  var energySaving = energyBefore - energyAfter;

  // CO2 and cost from operational savings
  var co2Before = calcCO2(energyBefore);
  var co2After = calcCO2(energyAfter);
  var costBeforeBDT = calcCostBDT(energyBefore);
  var costAfterBDT = calcCostBDT(energyAfter);
  var costBeforeUSD = calcCost(energyBefore);
  var costAfterUSD = calcCost(energyAfter);

  // Landfill diversion
  var landfillAvoided = calcLandfillAvoided(items);
  var landfillRate = totalWeight > 0 ? (landfillAvoided / totalWeight * 100) : 0;

  // Reuse & recycle rates
  var reuseCount = items.filter(function(i) { return i.recommended_action === "Reuse" || i.recommended_action === "Repair"; }).length;
  var recycleCount = items.filter(function(i) { return i.recommended_action === "Recycle"; }).length;
  var reuseRate = (reuseCount / totalItems * 100);
  var recycleRate = (recycleCount / totalItems * 100);
  var diversionRate = ((reuseCount + recycleCount) / totalItems * 100);

  // Total combined savings
  var totalEnergySaved = embodiedEnergySaved + energySaving;
  var totalCO2Saved = embodiedCO2Saved + (co2Before - co2After);
  var totalCostSavedBDT = embodiedCostBDT + (costBeforeBDT - costAfterBDT);
  var totalCostSavedUSD = embodiedCostUSD + (costBeforeUSD - costAfterUSD);

  return {
    totalItems: totalItems,
    totalWeight: round2(totalWeight),

    // Embodied (manufacturing) savings
    embodiedEnergySaved: round2(embodiedEnergySaved),
    embodiedCO2Saved: round2(embodiedCO2Saved),
    embodiedCostBDT: round2(embodiedCostBDT),
    embodiedCostUSD: round2(embodiedCostUSD),

    // Operational savings
    energyBefore: round2(energyBefore),
    energyAfter: round2(energyAfter),
    energySaving: round2(energySaving),
    energySavingPct: round2(calcSaving(energyBefore, energyAfter)),

    co2Before: round2(co2Before),
    co2After: round2(co2After),
    co2Saving: round2(co2Before - co2After),
    co2SavingPct: round2(calcSaving(co2Before, co2After)),

    costBeforeBDT: round2(costBeforeBDT),
    costAfterBDT: round2(costAfterBDT),
    costSavingBDT: round2(costBeforeBDT - costAfterBDT),
    costBeforeUSD: round2(costBeforeUSD),
    costAfterUSD: round2(costAfterUSD),
    costSavingUSD: round2(costBeforeUSD - costAfterUSD),
    costSavingPct: round2(calcSaving(costBeforeUSD, costAfterUSD)),

    // Waste diversion
    landfillAvoided: round2(landfillAvoided),
    landfillRate: round2(landfillRate),
    reuseRate: round2(reuseRate),
    recycleRate: round2(recycleRate),
    diversionRate: round2(diversionRate),

    // Combined totals
    totalEnergySaved: round2(totalEnergySaved),
    totalCO2Saved: round2(totalCO2Saved),
    totalCostSavedBDT: round2(totalCostSavedBDT),
    totalCostSavedUSD: round2(totalCostSavedUSD)
  };
}

/**
 * Utility: round to 2 decimal places
 */
function round2(num) {
  return Math.round(num * 100) / 100;
}
