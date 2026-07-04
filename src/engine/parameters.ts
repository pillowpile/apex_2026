export type NumberParameter = {
  type: "number";
  label: string;
  min: number;
  max: number;
  step?: number;
  default: number;
};

export type BooleanParameter = {
  type: "boolean";
  label: string;
  default: boolean;
};

export type ColorParameter = {
  type: "color";
  label: string;
  default: string;
};

export type SelectParameter = {
  type: "select";
  label: string;
  options: string[];
  default: string;
};

export type PaletteParameter = {
  type: "palette";
  label: string;
  default: string;
};

export type Parameter =
  | NumberParameter
  | BooleanParameter
  | ColorParameter
  | SelectParameter
  | PaletteParameter;

export type ParameterSchema = Record<string, Parameter>;

export type ParameterValues = Record<string, number | boolean | string>;

export function getDefaultParameters(schema: ParameterSchema): ParameterValues {
  return Object.fromEntries(
    Object.entries(schema).map(([key, parameter]) => [key, parameter.default]),
  );
}
