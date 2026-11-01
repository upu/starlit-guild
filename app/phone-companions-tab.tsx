import { TabsContent } from "@/components/ui/tabs";
import { CharacterPanel } from "./equipment-panels";
import type { PhoneFrameModel } from "./phone-game-types";

export function CompanionsTab({ model }: { model: PhoneFrameModel }) {
  return (
    <TabsContent value="companions" className="phone-characters">
      <CharacterPanel state={model.state} ready={model.ready} onAction={model.act} />
    </TabsContent>
  );
}
