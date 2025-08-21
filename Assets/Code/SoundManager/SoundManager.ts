import { Game } from "@Easy/Core/Shared/Game";
import SoundConfig from "./SoundConfig";
import { Enum } from "Code/Enum";
import PlayerManager from "Code/PlayerManager/PlayerContainer";
import { RandomUtil } from "@Easy/Core/Shared/Util/RandomUtil";
import { SetTimeout } from "@Easy/Core/Shared/Util/Timer";

export default class SoundManager extends AirshipSingleton {

    public sounds: SoundConfig;

    public Init(sounds: SoundConfig): void {
        if (!Game.IsClient()) return;
        this.sounds = sounds;
    }

    public PlaySound(parent: GameObject, sound: AudioClip[], soundType: Enum.Sound, timeToLive: number): void {
        const source = parent.AddComponent<AudioSource>();
        source.resource = RandomUtil.FromArray(sound);
        let volume = 100;
        switch (soundType) {
            case Enum.Sound.Interaction:
                volume = PlayerManager.Get().GetLocal().save.config.audio.interactionVolume;
                break;
            case Enum.Sound.Interface:
                volume = PlayerManager.Get().GetLocal().save.config.audio.interactionVolume;
                break;
            case Enum.Sound.Machine:
                volume = PlayerManager.Get().GetLocal().save.config.audio.machineVolume;
                break;
            case Enum.Sound.Ambient:
                volume = PlayerManager.Get().GetLocal().save.config.audio.ambientVolume;
                break;
            default:
                break;
        }
        source.volume = volume;
        source.Play();
        SetTimeout(timeToLive, () => Destroy(source));
    }
}