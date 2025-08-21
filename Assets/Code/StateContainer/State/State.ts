import { Airship } from "@Easy/Core/Shared/Airship";
import { Game } from "@Easy/Core/Shared/Game";
import { NetworkFunction } from "@Easy/Core/Shared/Network/NetworkFunction";
import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";
import { Player } from "@Easy/Core/Shared/Player/Player";
import { Bin } from "@Easy/Core/Shared/Util/Bin";
import { keys } from "@Easy/Core/Shared/Util/ObjectUtils";
import { Signal, SignalPriority } from "@Easy/Core/Shared/Util/Signal";

export interface BaseState {
    _id: string,
    _sync: "ServerToClient" | "None";
}

export default class State<T extends BaseState> {
    private _state: T;
    private readonly _onServerChanged: NetworkSignal<[k: keyof T, v: unknown]>;
    private readonly _onClientRequest: NetworkFunction<[], [state: T]>;
    private _actions: (() => void)[] = [];
    private _keys: (keyof T)[] = [];
    private _bin = new Bin();
    private _clients: Player[] | undefined;
    private readonly _onChanged = new Signal<[k: keyof T, newValue: unknown, oldValue: unknown]>();

    public constructor(state: T, clients?: Player[]) {
        this._state = state;
        this._clients = clients;
        this._keys = keys(this._state) as (keyof T)[];
        if (state._sync === "ServerToClient") this._onServerChanged = new NetworkSignal<[k: keyof T, v: unknown]>(`${state._id}._onServerChanged`);
        this._onClientRequest = new NetworkFunction<[], [state: T]>(`${state._id}._onClientRequest`);
        this.StartClient();
        this.StartServer();
    }

    private StartClient(): void {
        if (!Game.IsClient() || this._state._sync !== "ServerToClient") return;
        this._bin.Add(this._onServerChanged.client.OnServerEvent((k, v) => {
            this.Set(k, v as T[typeof k]);
        }));
        this.Update();
    }

    private StartServer(): void {
        if (!Game.IsServer() || this._state._sync !== "ServerToClient") return;
        if (!this._clients) {
            this._bin.Add(this._onChanged.ConnectWithPriority(SignalPriority.HIGHEST, (k, v) => this._onServerChanged.server.FireAllClients(k, v)));
        } else {
            this._bin.Add(this._onChanged.ConnectWithPriority(SignalPriority.HIGHEST, (k, v) => this._onServerChanged.server.FireClients(this._clients!, k, v)));
        }
        this._onClientRequest.server.SetCallback(() => this._state);
    }

    public Tick(): void {
        const oldState = { ...this._state };
        for (let i = 0; i < this._actions.size(); i++) this._actions.pop()?.();
        for (let i = 0; i < this._keys.size(); i++) {
            if (oldState[this._keys[i]] === this._state[this._keys[i]]) continue;
            this._onChanged.Fire(this._keys[i], this._state[this._keys[i]], oldState[this._keys[i]]);
        }
    }

    public Update(): void {
        if (!Game.IsClient() || this._state._sync !== "ServerToClient") return;
        const oldState = { ...this._state };
        this._state = this._onClientRequest.client.FireServer();
        for (let i = 0; i < this._keys.size(); i++) {
            if (oldState[this._keys[i]] === this._state[this._keys[i]]) continue;
            this._onChanged.Fire(this._keys[i], this._state[this._keys[i]], oldState[this._keys[i]]);
        }
    }

    public Get<K extends keyof T>(k: K): T[K] {
        return this._state[k];
    }

    public Set<K extends keyof T>(k: K, v: T[K]): void {
        this._actions.unshift(() => this._state[k] = v);
    }

    public Apply<K extends keyof T>(k: K, apply: (v: T[K]) => T[K]): void {
        this._actions.unshift(() => this._state[k] = apply(this._state[k]));
    }

    public Connect<K extends keyof T>(k: K, func: (newValue: T[K], oldValue: T[K]) => void) {
        const connection = this._onChanged.Connect((k, newValue, oldValue) => func(newValue as T[K], oldValue as T[K]));
        this._bin.Add(connection);
        return connection;
    }

    public ConnectWithPriority<K extends keyof T>(k: K, priority: SignalPriority, func: (newValue: T[K], oldValue: T[K]) => void) {
        const connection = this._onChanged.ConnectWithPriority(priority, (k, newValue, oldValue) => func(newValue as T[K], oldValue as T[K]));
        this._bin.Add(connection);
        return connection;
    }

    public GetClients(): Player[] {
        return this._clients ?? Airship.Players.GetPlayers();
    }

    public Destroy(): void {
		this._bin.Clean();
	}
}