import { ChatCommand } from "@Easy/Core/Shared/Commands/ChatCommand";
import IslandManager from "Code/IslandManager/IslandManager";
import { Player } from "@Easy/Core/Shared/Player/Player";
import PlayerManager from "Code/PlayerManager/PlayerContainer";
import { keys } from "@Easy/Core/Shared/Util/ObjectUtils";

export class SaveCommand extends ChatCommand {
	constructor() {
		super("save");
	}

	public Execute(player: Player): void {
        PlayerManager.Get().NotifyPlayer(player, "Generating save...");
		const save = IslandManager.Get().world.server.GenerateWorldSave();
        const _key: string[] = [];
        keys(save.key).forEach((key) => {
            _key.push(`${key}: "${save.key[key]}"`);
        })

        const str = `export const DefaultWorldSave = { blocks: "${save.blocks}", blockSaves: "${save.blockSaves}", key: {${_key.join(", ")} } };`;
        warn(str);
        PlayerManager.Get().NotifyPlayer(player, "Generated save in config");
	}
}