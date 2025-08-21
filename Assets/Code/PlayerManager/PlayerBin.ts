import { Bin } from "@Easy/Core/Shared/Util/Bin";
import State from "Code/StateContainer/State/State";
import { LocalPlayer, LocalPlayerState, PlayerConfig, PlayerConfigState, PlayerState, PlayerStats, PlayerStatsState } from "./PlayerData";
import { Game } from "@Easy/Core/Shared/Game";
import { Player } from "@Easy/Core/Shared/Player/Player";
import StateContainer from "Code/StateContainer/StateContainer";

export class PlayerBin extends AirshipBehaviour {
    private _bin = new Bin();

    public player: Player;
    public isLoaded: boolean = false;

    public state: State<PlayerState>;
    public stats: State<PlayerStatsState>;
    public config: State<PlayerConfigState>;
    public local: State<LocalPlayerState>;

    public Initialize(player: Player, stats: PlayerStats = PlayerStats, config: PlayerConfig = PlayerConfig, local: LocalPlayer = LocalPlayer) {
        this.player = player;
        this.state = StateContainer.Get().CreateState<PlayerState>({
            _id: `${this.player.userId}@Player`,
            _sync: "ServerToClient",
            joinTime: DateTime.now().TimestampSeconds,
        });
        this.stats = StateContainer.Get().CreateState<PlayerStatsState>({
            _id: `${this.player.userId}@Stats`,
            _sync: "None",
            ...stats,
        });
        this.config = StateContainer.Get().CreateState<PlayerConfigState>({
            _id: `${this.player.userId}@Config`,
            _sync: "None",
            ...config,
        });
        if (Game.IsClient()) {
            this.local = StateContainer.Get().CreateState<LocalPlayerState>({
                _id: `${this.player.userId}@LocalPlayer`,
                _sync: "None",
                ...local,
            });
        }
    }

    public LateUpdate(): void {
        this.state.Tick();
        this.stats.Tick();
        this.config.Tick();
        this.local.Tick();
    }

    public override OnDestroy() {
        this._bin.Clean();
        StateContainer.Get().DestroyState(this.state.Get("_id"));
        StateContainer.Get().DestroyState(this.stats.Get("_id"));
        StateContainer.Get().DestroyState(this.config.Get("_id"));
        StateContainer.Get().DestroyState(this.local.Get("_id"));
    }
}