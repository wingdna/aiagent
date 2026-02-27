import { dataService } from './services/dataService';

async function test() {
  const agents = await dataService.getAgents(0, 12);
  console.log("Agents returned:", agents.length);
}
test();
