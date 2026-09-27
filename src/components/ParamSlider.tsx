import type { CSSProperties } from 'react';
import { useVortexStore } from '../hooks/useVortexStore';
import { PARAM_LIMITS, type VortexParams } from '../utils/params';

interface Props {
  param: keyof VortexParams;
  label: string;
  format: (value: number) => string;
}

export function ParamSlider({ param, label, format }: Props) {
  const value = useVortexStore((s) => s.params[param]);
  const setParam = useVortexStore((s) => s.setParam);
  const { min, max, step } = PARAM_LIMITS[param];
  const fill = ((value - min) / (max - min)) * 100;
  const id = `slider-${param}`;

  return (
    <div className="slider">
      <label className="slider__head" htmlFor={id}>
        <span>{label}</span>
        <output htmlFor={id}>{format(value)}</output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--fill': `${fill}%` } as CSSProperties}
        onChange={(e) => setParam(param, Number(e.target.value))}
      />
    </div>
  );
}
