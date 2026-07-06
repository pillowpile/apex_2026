import { Activity, Maximize2, RadioTower } from "lucide-react";

type Props = {
  fps: number;
  activeModule: string;
};

export function StatusBar({ fps, activeModule }: Props) {
  return (
    <footer className="status-bar">
      <span>
        <Activity size={15} />
        {fps.toFixed(0)} FPS
      </span>
      <span>69 x 45 RGB</span>
      <span>
        <Maximize2 size={15} />
        1920 x 1080 full-grid fit
      </span>
      <span>
        <RadioTower size={15} />
        Browser preview
      </span>
      <strong>{activeModule}</strong>
    </footer>
  );
}
