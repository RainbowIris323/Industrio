import EffectTableComponent from "./EffectTableComponent";
import SoundTableComponent from "./SoundTableComponent";

@AirshipComponentMenu("Island/System/Block Effect")
export default class BlockEffectComponent extends AirshipBehaviour {

    @Spacing(10) @Header("Effects")
    public placeEffectTable?: EffectTableComponent[];
    public breakEffectTable?: EffectTableComponent[];

    @Spacing(10) @Header("Sounds")
    public placeSoundTable?: SoundTableComponent[];
    public breakSoundTable?: SoundTableComponent[];
    public constantSound?: SoundTableComponent;
}