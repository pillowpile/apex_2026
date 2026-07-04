import { paletteNames, palettes } from "../palettes/palettes";
import { ParameterSchema, ParameterValues } from "../engine/parameters";

type Props = {
  schema: ParameterSchema;
  values: ParameterValues;
  onChange: (key: string, value: number | boolean | string) => void;
};

export function ParameterPanel({ schema, values, onChange }: Props) {
  return (
    <aside className="panel parameter-panel">
      <div className="panel-header">
        <span>Parameters</span>
      </div>
      <div className="parameter-list">
        {Object.entries(schema).map(([key, parameter]) => {
          const value = values[key] ?? parameter.default;
          return (
            <label className="parameter" key={key}>
              <span>
                <span>{parameter.label}</span>
                {parameter.type === "number" ? <em>{Number(value).toFixed(parameter.step && parameter.step < 1 ? 2 : 0)}</em> : null}
              </span>

              {parameter.type === "number" ? (
                <input
                  max={parameter.max}
                  min={parameter.min}
                  onChange={(event) => onChange(key, Number(event.target.value))}
                  step={parameter.step ?? 1}
                  type="range"
                  value={Number(value)}
                />
              ) : null}

              {parameter.type === "boolean" ? (
                <input
                  checked={Boolean(value)}
                  onChange={(event) => onChange(key, event.target.checked)}
                  type="checkbox"
                />
              ) : null}

              {parameter.type === "color" ? (
                <input
                  onChange={(event) => onChange(key, event.target.value)}
                  type="color"
                  value={String(value)}
                />
              ) : null}

              {parameter.type === "select" ? (
                <select value={String(value)} onChange={(event) => onChange(key, event.target.value)}>
                  {parameter.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : null}

              {parameter.type === "palette" ? (
                <select value={String(value)} onChange={(event) => onChange(key, event.target.value)}>
                  {paletteNames.map((name) => (
                    <option key={name} value={name}>
                      {palettes[name as keyof typeof palettes].name}
                    </option>
                  ))}
                </select>
              ) : null}
            </label>
          );
        })}
      </div>
    </aside>
  );
}
