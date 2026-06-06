import { useRef } from 'react';

type AxisSliderProps = {
  label: string;
  value: number;
  reference: number;
  current?: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  onStepMove?: (value: number) => void;
  showReference?: boolean;
  showCurrent?: boolean;
};

export function AxisSlider({
  label,
  value,
  reference,
  current,
  min,
  max,
  step,
  onChange,
  onStepMove,
  showReference = true,
  showCurrent = true,
}: AxisSliderProps) {
  const valuePercent = ((value - min) / (max - min)) * 100;
  const referencePercent = ((reference - min) / (max - min)) * 100;
  const currentPercent =
    current !== undefined ? ((current - min) / (max - min)) * 100 : null;

const pathLeft = Math.min(valuePercent, referencePercent);
const pathWidth = Math.abs(valuePercent - referencePercent);


const intervalRef = useRef<number | null>(null);

function clampValue(nextValue: number) {
  return Math.min(max, Math.max(min, nextValue));
}

function startContinuousChange(direction: -1 | 1) {
  let nextValue = value;

  nextValue = clampValue(nextValue + direction * step);
  onChange(nextValue);
  onStepMove?.(nextValue);

  intervalRef.current = window.setInterval(() => {
    nextValue = clampValue(nextValue + direction * step);
    onChange(nextValue);
    onStepMove?.(nextValue);
  }, 160);
}

function stopContinuousChange() {
  if (intervalRef.current !== null) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }
}

function formatValue(number: number) {
  return Math.abs(number) < 0.0005
    ? '0.000'
    : number.toFixed(3);
}

  return (
    <div className="axis-slider">
      <div className="axis-slider-header">
        <strong>{label}</strong>
        <span>
          {/* {showCurrent && current !== undefined && (<>Actual: {current.toFixed(3)} | </>)} */}
          {showReference && <>Referencia: {formatValue(reference)} | </>}
          {showReference && <>Objetivo: {formatValue(value)} | </>}
          Δ: {formatValue(value - reference)}
        </span>
      </div>

      <div className="slider-row">
  <button
    type="button"
    className="slider-step-button"
    onMouseDown={() => startContinuousChange(-1)}
    onMouseUp={stopContinuousChange}
    onMouseLeave={stopContinuousChange}
  >
    ◀
  </button>

    <div className="slider-wrapper">
      <div className="slider-track" />

      <div
        className="slider-path"
        style={{
          left: `${pathLeft}%`,
          width: `${pathWidth}%`,
        }}
      />

      {showCurrent && currentPercent !== null && (
        <div
          className="current-marker"
          style={{ left: `${currentPercent}%` }}
          title="Posición real actual"
        />
      )}

      <div
        className="reference-marker"
        style={{ left: `${referencePercent}%` }}
        title="Referencia inicial"
      />

      <div
        className="target-marker"
        style={{ left: `${valuePercent}%` }}
        title="Objetivo"
      />

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>

    <button
      type="button"
      className="slider-step-button"
      onMouseDown={() => startContinuousChange(1)}
      onMouseUp={stopContinuousChange}
      onMouseLeave={stopContinuousChange}
    >
      ▶
    </button>

    </div>
  </div>
  );
}
