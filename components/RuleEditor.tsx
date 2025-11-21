import { useState } from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { QARule, buildPromptFromRules } from '@/lib/qa-rules';

interface RuleEditorProps {
  rules: QARule[];
  systemPrompt: string;
  onRulesChange: (rules: QARule[]) => void;
  language: 'french' | 'english';
  qaType: 'text' | 'image';
}

export default function RuleEditor({
  rules,
  systemPrompt,
  onRulesChange,
  language,
  qaType,
}: RuleEditorProps) {
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  const handleToggleRule = (ruleId: string) => {
    const updated = rules.map(r =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    );
    onRulesChange(updated);
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<QARule>) => {
    const updated = rules.map(r =>
      r.id === ruleId ? { ...r, ...updates } : r
    );
    onRulesChange(updated);
  };

  const handleToggleExpand = (ruleId: string) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedRules(newExpanded);
  };

  const maxPoints = language === 'french' ? 4 : 3;

  return (
    <div className="space-y-6">
      {/* System Prompt (Read-Only) */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          System Prompt (Not Editable)
        </label>
        <textarea
          value={systemPrompt}
          readOnly
          className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono text-xs cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 mt-1">
          This defines the role, input/output format, and cannot be changed.
        </p>
      </div>

      {/* Rules List */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-700">
            QA Rules ({rules.filter(r => r.enabled).length}/{rules.length} enabled)
          </label>
          <button
            onClick={() => {
              const allEnabled = rules.every(r => r.enabled);
              const updated = rules.map(r => ({ ...r, enabled: !allEnabled }));
              onRulesChange(updated);
            }}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            {rules.every(r => r.enabled) ? 'Disable All' : 'Enable All'}
          </button>
        </div>

        <div className="space-y-2">
          {rules.map((rule) => {
            const isExpanded = expandedRules.has(rule.id);
            const isEditing = editingRule === rule.id;

            return (
              <div
                key={rule.id}
                className={`border-2 rounded-lg transition-all ${
                  rule.enabled
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                {/* Rule Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggleRule(rule.id)}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={() => handleToggleExpand(rule.id)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                    </button>
                    <div className="flex-1">
                      <div className={`font-semibold ${rule.enabled ? 'text-gray-800' : 'text-gray-400'}`}>
                        {rule.name}
                      </div>
                      <div className={`text-xs mt-0.5 ${rule.enabled ? 'text-gray-600' : 'text-gray-400'}`}>
                        {rule.description.split('\n')[0]}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${rule.enabled ? 'text-red-600' : 'text-gray-400'}`}>
                    -{rule.pointDeduction} pts
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-200 pt-4">
                    {!isEditing ? (
                      <>
                        <div className="bg-white p-3 rounded border border-gray-200 mb-3">
                          <div className="text-xs font-semibold text-gray-600 mb-1">Rule Description:</div>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {rule.description}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-600">
                            Error Type: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{rule.errorType}</span>
                          </div>
                          <button
                            onClick={() => setEditingRule(rule.id)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Edit Rule
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Rule Description
                          </label>
                          <textarea
                            value={rule.description}
                            onChange={(e) =>
                              handleUpdateRule(rule.id, { description: e.target.value })
                            }
                            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Point Deduction
                            </label>
                            <select
                              value={rule.pointDeduction}
                              onChange={(e) =>
                                handleUpdateRule(rule.id, {
                                  pointDeduction: Number(e.target.value),
                                })
                              }
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              {Array.from({ length: maxPoints }, (_, i) => i + 1).map((n) => (
                                <option key={n} value={n}>
                                  {n} point{n > 1 ? 's' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-end gap-2">
                            <button
                              onClick={() => setEditingRule(null)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingRule(null);
                                // Reset would need to restore from defaults
                              }}
                              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Generated Prompt Preview */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-semibold text-gray-700">
            Generated Prompt Preview
          </label>
          <span className="text-xs text-gray-500">
            {rules.filter(r => r.enabled).length} rules will be sent to AI
          </span>
        </div>
        <textarea
          value={systemPrompt + '\n\n' + buildPromptFromRules(rules)}
          readOnly
          className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono text-xs cursor-not-allowed"
        />
      </div>
    </div>
  );
}


