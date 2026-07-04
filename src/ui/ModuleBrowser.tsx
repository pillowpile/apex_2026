import { PixelModule } from "../engine/types";

type Props = {
  modules: PixelModule[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function ModuleBrowser({ modules, activeId, onSelect }: Props) {
  return (
    <aside className="panel module-panel">
      <div className="panel-header">
        <span>Modules</span>
      </div>
      <div className="module-list">
        {modules.map((module, index) => (
          <button
            className={module.id === activeId ? "module-button active" : "module-button"}
            key={module.id}
            onClick={() => onSelect(module.id)}
            type="button"
          >
            <span className="module-index">{index + 1}</span>
            <span>
              <strong>{module.name}</strong>
              <small>{module.description}</small>
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
