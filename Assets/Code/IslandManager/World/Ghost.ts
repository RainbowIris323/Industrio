import GameManager from "Code/GameManager/GameManager";
import { WaitFrame } from "@Easy/Core/Shared/Util/TimeUtil";
import { Placement } from "./Placement";
import IslandManager from "../IslandManager";
import ModifyRenderer from "Code/Utility/ModifyRenderer";

export default class Ghost {
    public isActive: boolean = false;
    private isUpdating: boolean = false;
    private colliders: GameObject[] = [];
    private model: GameObject | undefined = undefined;

    public Create(overrides?: { active?: boolean, position?: Vector3, model?: GameObject, renderer?: Renderer, size?: Vector3, color?: Color }) {
        if (this.model) this.Destroy();
        this.model = CreateGhost(overrides);
        this.Hide();
        this.isActive = false;
    }

    public Update(check: boolean, data?: Placement.Data) {
        if (!data || !this.model) return this.Hide();
        this.isUpdating = true;
        this.colliders.forEach((coll) => Destroy(coll));
        this.colliders.clear();

        if (check) {
            const errorInfo = IslandManager.Get().world.bin.Verify(data);
            if (!errorInfo.success) {
                errorInfo.collisions.forEach((vector) => {
                    this.colliders.push(CreateGhost({ color: new Color(255, 0, 0), position: vector, active: true, size: new Vector3(1.001, 1.001, 1.001) }));
                });
                errorInfo.unsupported.forEach((vector) => {
                    this.colliders.push(CreateGhost({ color: new Color(255, 255, 0), position: vector, active: true, size: new Vector3(1.001, 1.001, 1.001) }));
                });
            } else {
                this.colliders.forEach((coll) => Destroy(coll));
                this.colliders.clear();
            }
        }
        Placement.Data.TransformModel(data, this.model);
        
        this.isUpdating = false;
        this.Show();
    }

    public Hide() {
        if (!this.isActive) return;
        if (!this.model) return;
        this.WaitForUpdate();
        this.model.SetActive(false);
        this.colliders.forEach((coll) => Destroy(coll));
        this.colliders.clear();
        this.isActive = false;
    }

    public Show() {
        if (this.isActive) return;
        if (!this.model) return;
        this.WaitForUpdate();
        this.model.SetActive(true);
        this.isActive = true;
    }

    public Destroy() {
        if (this.model) {
            this.WaitForUpdate();
            Destroy(this.model);
            this.model = undefined;
        }
        this.colliders.forEach((coll) => Destroy(coll));
        this.colliders.clear();
        this.isActive = false;
    }

    private WaitForUpdate() {
        if (!this.isUpdating) return;
        while (this.isUpdating) WaitFrame();
    }
}

export function CreateGhost(overrides?: { active?: boolean, position?: Vector3, model?: GameObject, renderer?: Renderer, size?: Vector3, color?: Color }): GameObject {
    let model: GameObject;
    if (overrides?.model) {
        model = Instantiate(overrides.model, GameManager.Get().config.gameObject.transform);
    } else {
        model = GameObject.CreatePrimitive(PrimitiveType.Cube);
    }
    model.SetActive(!!overrides?.active);
    model.transform.localScale = overrides?.size ? overrides.size : new Vector3(1, 1, 1);
    model.transform.position = overrides?.position ? overrides.position : Vector3.zero;

    const CreateGhostObject = (object: GameObject): GameObject => {
        const renderer = object.GetComponent<Renderer>();
        if (renderer) ModifyRenderer(renderer, overrides?.renderer ? overrides.renderer : GameManager.Get().config.ghostRenderer, overrides?.color);

        const collider = object.GetComponent<Collider>();
        if (collider) Destroy(collider);

        for (let i = 0; i < object.transform.childCount; i++) CreateGhostObject(object.transform.GetChild(i).gameObject);

        return object;
    }

    return CreateGhostObject(model);
}