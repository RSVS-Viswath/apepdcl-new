import Minicards from "./Minicards";
import Graph from "./Graph";

export default function Component() {
  return (
    <div className="w-full p-4 space-y-4">
      <Minicards />
      <Graph />
    </div>
  );
}