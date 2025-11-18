'use client';

interface Violation {
  type: 'cycle' | 'boundary';
  message: string;
  packages: string[];
  rule?: string;
}

interface ViolationsListProps {
  violations: Violation[];
}

export default function ViolationsList({ violations }: ViolationsListProps) {
  if (violations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold mb-2 text-green-600">
          ✓ No Violations
        </h2>
        <p className="text-sm text-gray-600">
          Your monorepo has no circular dependencies or boundary violations!
        </p>
      </div>
    );
  }

  const cycles = violations.filter((v) => v.type === 'cycle');
  const boundaries = violations.filter((v) => v.type === 'boundary');

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-2 text-red-600">
        ⚠️ Violations ({violations.length})
      </h2>

      {cycles.length > 0 && (
        <div className="mb-4">
          <h3 className="text-md font-medium text-gray-900 mb-2">
            Circular Dependencies ({cycles.length})
          </h3>
          <div className="space-y-2">
            {cycles.map((violation, index) => (
              <div
                key={index}
                className="bg-red-50 border border-red-200 rounded p-3 text-sm"
              >
                <div className="font-medium text-red-800 mb-1">
                  {violation.message}
                </div>
                <div className="text-gray-700 text-xs">
                  {violation.packages.join(' → ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {boundaries.length > 0 && (
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-2">
            Boundary Violations ({boundaries.length})
          </h3>
          <div className="space-y-2">
            {boundaries.map((violation, index) => (
              <div
                key={index}
                className="bg-orange-50 border border-orange-200 rounded p-3 text-sm"
              >
                <div className="font-medium text-orange-800 mb-1">
                  {violation.rule}
                </div>
                <div className="text-gray-700 text-xs mb-1">
                  {violation.message}
                </div>
                <div className="text-gray-600 text-xs">
                  {violation.packages.join(' → ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
