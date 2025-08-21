import { keys } from "@Easy/Core/Shared/Util/ObjectUtils";
import State, { BaseState } from "./State/State";
import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";
import { Bin } from "@Easy/Core/Shared/Util/Bin";
import { Game } from "@Easy/Core/Shared/Game";

export default class StateContainer extends AirshipSingleton {
    private _states: { [_id: string]: State<BaseState> | undefined } = { }
    private readonly _onContainerDestroy: NetworkSignal<[_id: string]>;
    private _bin = new Bin();

    protected Awake(): void {
        if (Game.IsClient()) {
            this._onContainerDestroy.client.OnServerEvent((_id) => {
                if (!(_id in this._states) || !this._states[_id]) return;
                this._states[_id].Destroy();
                this._states[_id] = undefined;
            });
        }
    }

    public LateUpdate(): void {
        keys(this._states).forEach(k => {
            this._states[k]?.Tick();
        });
    }

    public CreateState<T extends BaseState>(data: T): State<T> {
        const state = new State(data);
        this._states[data._id] = state as unknown as State<BaseState>;
        return state;
    }

    public DestroyState(_id: string): void {
        if (!(_id in this._states) || !this._states[_id]) return;
        if (Game.IsServer() && this._states[_id].Get("_sync") === "ServerToClient") {
            this._onContainerDestroy.server.FireClients(this._states[_id].GetClients(), _id);
        }
        this._states[_id].Destroy();
        this._states[_id] = undefined;
    }

    public override OnDestroy(): void {
        keys(this._states).forEach(k => {
            this._states[k]?.Destroy();
            this._states[k] = undefined;
        });
        this._bin.Clean();
    }
}