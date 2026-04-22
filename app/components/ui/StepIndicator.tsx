/**
 * StepIndicator — Fuel-gauge style progress bar
 */
"use client";

export function StepIndicator({
  percent,
}: {
  percent: number;
}) {
  return (
    <div className="oracle-fuel-gauge">
      <div
        className="oracle-fuel-gauge-fill"
        style={{ width: `${percent}%` }}
      />
      <div
        className="oracle-fuel-gauge-marker"
        style={{ left: `${percent}%` }}
      />
    </div>
  );
}
