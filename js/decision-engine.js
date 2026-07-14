// ============================================================
// E-Waste Decision Engine
// Classification and Recommendation Logic
// ============================================================

/**
 * Classify item condition based on condition_score (1-10)
 * @param {number} score - Condition score (1-10)
 * @returns {string} - "Good", "Fair", "Poor", or "Hazardous"
 */
function classifyCondition(score) {
  if (score >= 7) return "Good";
  if (score >= 4) return "Fair";
  if (score >= 2) return "Poor";
  return "Hazardous";
}

/**
 * Estimate repair cost based on category and condition
 * Repair cost is roughly proportional to how damaged the item is
 * @param {Object} item - E-waste item object
 * @returns {number} - Estimated repair cost in USD
 */
function estimateRepairCost(item) {
  const baseCosts = {
    "Computer": 120,
    "Monitor": 80,
    "Peripheral": 25,
    "Mobile Device": 60,
    "Battery": 40,
    "Networking": 50,
    "Storage": 30
  };

  const base = baseCosts[item.category] || 50;
  // Higher damage (lower score) = higher repair cost
  const damageFactor = (10 - item.condition_score) / 10;
  return Math.round(base * (0.5 + damageFactor));
}

/**
 * Recommend action for an e-waste item
 * Decision Rules:
 *   - Good condition + age <= 5 → REUSE
 *   - Good condition + age > 5 → REUSE (with note)
 *   - Fair condition + repair cost < 40% replacement → REPAIR
 *   - Fair condition + repair cost >= 40% replacement → RECYCLE
 *   - Poor condition → RECYCLE
 *   - Hazardous or contains_hazardous → DISPOSE
 *
 * @param {Object} item - E-waste item object
 * @returns {string} - "Reuse", "Repair", "Recycle", or "Dispose"
 */
function recommendAction(item) {
  const conditionClass = classifyCondition(item.condition_score);

  // Hazardous materials always require safe disposal
  if (conditionClass === "Hazardous" || item.contains_hazardous) {
    return "Dispose";
  }

  if (conditionClass === "Good") {
    return "Reuse";
  }

  if (conditionClass === "Fair") {
    const repairCost = estimateRepairCost(item);
    const replacementCost = item.replacement_cost;
    if (repairCost < 0.4 * replacementCost) {
      return "Repair";
    } else {
      return "Recycle";
    }
  }

  // Poor condition
  return "Recycle";
}

/**
 * Process the entire dataset: assign condition_class and recommended_action
 * @param {Array} items - Array of e-waste item objects
 * @returns {Array} - Processed items with classification and recommendations
 */
function processDecisions(items) {
  return items.map(item => {
    const processed = { ...item };
    processed.condition_class = classifyCondition(processed.condition_score);
    if (!processed.recommended_action || processed.recommended_action === "Auto" || processed.recommended_action === "") {
      processed.recommended_action = recommendAction(processed);
    }
    // Add energy warning for older reused items as per rules
    if (processed.recommended_action === "Reuse" && processed.age_years > 5) {
      processed.action_note = "Energy warning";
    }
    return processed;
  });
}

/**
 * Get decision summary statistics
 * @param {Array} items - Processed items
 * @returns {Object} - Summary counts and percentages
 */
function getDecisionSummary(items) {
  const actionCounts = { Reuse: 0, Repair: 0, Recycle: 0, Dispose: 0 };
  const conditionCounts = { Good: 0, Fair: 0, Poor: 0, Hazardous: 0 };
  const categoryCounts = {};
  const departmentCounts = {};

  items.forEach(item => {
    actionCounts[item.recommended_action]++;
    conditionCounts[item.condition_class]++;

    if (!categoryCounts[item.category]) categoryCounts[item.category] = 0;
    categoryCounts[item.category]++;

    if (!departmentCounts[item.department]) departmentCounts[item.department] = 0;
    departmentCounts[item.department]++;
  });

  const total = items.length;

  return {
    total,
    actionCounts,
    actionPercentages: {
      Reuse: ((actionCounts.Reuse / total) * 100).toFixed(1),
      Repair: ((actionCounts.Repair / total) * 100).toFixed(1),
      Recycle: ((actionCounts.Recycle / total) * 100).toFixed(1),
      Dispose: ((actionCounts.Dispose / total) * 100).toFixed(1),
    },
    conditionCounts,
    categoryCounts,
    departmentCounts
  };
}
