import { Platform } from "@Easy/Core/Shared/Airship";
import GameManager from "Code/GameManager/GameManager";

export interface GlobalSaveDataKnown {
    version: number;
    [key: string]: unknown;
}

export default class SaveUtility<D extends { version: number }> {

    public name: string;
    public keyPrefix: string;

    public versions: {[version: number]: (last: { version: number }) => { version: number }};
    
    public constructor(name: string, versions: {[version: number]: (last: { version: number }) => { version: number }}) {
        this.keyPrefix = `${GameManager.Get().config.useDevPrefix ? GameManager.Get().config.devPrefix : ""}${name}`;
        this.versions = versions;
    }

    public UpdateSave(save: { version: number }): D {
        if (!(save.version + 1 in this.versions)) return save as D;
        return this.UpdateSave(this.versions[save.version + 1](save));
    }

    public GetDefaultSave(override: (save: D) => D): D {
        const save = (this.UpdateSave(this.versions[0]({ version: -1 })));
        return override(save);
    }

    public Get(key: string, override: (save: D) => D): D | undefined {
        if (!Platform.Server.DataStore.LockKeyOrStealSafely(`${this.keyPrefix}:${key}`).await()[1]) return;
        let save = Platform.Server.DataStore.GetKey<D>(
            `${this.keyPrefix}:${key}`,
        ).await()[1] as D | undefined;

        if (!save || !("version" in save)) {
            save = this.GetDefaultSave(override);
        } else {
            save = this.UpdateSave(save);
        }

        return save;
    }

    public Set(key: string, data: D): void {
        Platform.Server.DataStore.SetKey(`${this.keyPrefix}:${key}`, data).await();
        Platform.Server.DataStore.UnlockKey(`${this.keyPrefix}:${key}`);
    }
}