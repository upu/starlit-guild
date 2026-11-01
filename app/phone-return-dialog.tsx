import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { squadName } from "@/lib/game";
import type { PhoneFrameModel } from "./phone-game-types";

export function ReturnDialog({ model: m }: { model: PhoneFrameModel }) {
  const intent = m.returnIntent;
  const title =
    intent?.destination === "companions"
      ? "帰還して編成しますか？"
      : intent?.quest
        ? "帰還して行き先を変えますか？"
        : "帰還しますか？";
  const target = m.state.squads.find((p) => p.id === intent?.squad);
  return (
    <AlertDialog
      open={!!intent}
      onOpenChange={(open) => {
        if (!open) m.setReturnIntent(null);
      }}
    >
      <AlertDialogContent className="game-confirm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {target && squadName(target)}
            の確保済みの区間報酬は残ります。途中の依頼は最初からになります。
            {intent?.quest && "帰還後に行き先を選び直します。自動では出発しません。"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>冒険を続ける</AlertDialogCancel>
          <AlertDialogAction
            disabled={!m.ready}
            onClick={(e) => {
              e.preventDefault();
              m.confirmReturn();
            }}
          >
            {intent?.destination === "companions" ? "帰還して編成する" : "帰還する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
