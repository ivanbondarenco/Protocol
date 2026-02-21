import assert from 'node:assert/strict';
import { buildSmartSuggestions, computeRiskLevel, parseRepeatDays } from '../habits/habit.engine';

const run = () => {
  const parsed = parseRepeatDays('1, 3,5, 9,foo');
  assert.deepEqual(parsed, [1, 3, 5], 'parseRepeatDays should keep valid week days only');

  assert.equal(computeRiskLevel(90, 10), 'LOW', 'high completion should be low risk');
  assert.equal(computeRiskLevel(20, 10), 'HIGH', 'low morning completion should be high risk');
  assert.equal(computeRiskLevel(55, 18), 'MEDIUM', 'mid completion should be medium risk');

  const suggestionLate = buildSmartSuggestions(30, 21);
  assert.ok(suggestionLate[0].toLowerCase().includes('prioriza'), 'late suggestion should prioritize one critical habit');

  const suggestionPerfect = buildSmartSuggestions(100, 9);
  assert.ok(suggestionPerfect[0].toLowerCase().includes('cerraste'), 'perfect day should return maintenance suggestion');

  console.log('All backend habit intelligence tests passed.');
};

run();
