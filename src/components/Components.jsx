import Banner from "./Banner";
import Minicards from "./Minicards";
import Graph from "./Graph";
import Profile from "./Profile";

export default function Component() {
  return (
    <div className="w-full p-4 space-y-4">
      
      {/* Top row */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Banner />
        </div>
        <div>
          <Profile />
        </div>
      </div>

      <Minicards />
      <Graph />
    </div>
  );
}