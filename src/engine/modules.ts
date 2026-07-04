import { conwayModule } from "../modules/conway/conwayModule";
import { creatureModule } from "../modules/creatures/creatureModule";
import { flowModule } from "../modules/flow/flowModule";
import { neonBarsModule } from "../modules/neonBars/neonBarsModule";
import { noiseModule } from "../modules/noise/noiseModule";
import { clockModule } from "../modules/clock/clockModule";

export const starterModules = [
  creatureModule,
  neonBarsModule,
  noiseModule,
  conwayModule,
  flowModule,
  clockModule,
];
