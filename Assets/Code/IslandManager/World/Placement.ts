import { NexusTypes } from "@Vorlias/NexusNet/Framework";
import { Enum } from "Code/Enum";
import GameManager from "Code/GameManager/GameManager";
import ItemManager from "Code/ItemManager/ItemManager";
import IdUtility from "Code/Utility/IdUtility";
import { MathUtil } from "@Easy/Core/Shared/Util/MathUtil";
import WorldObjectComponent from "Code/Components/Items/WorldObject/WorldObject";

export namespace Placement {

    export interface NetData {
        worldObject: string;
        position: Vector3;
        normal: Enum.Normal;
        rotation: Enum.Rotation;
        quarter: Enum.Quarter;
        height: Enum.Height;
    }

    export const netData = NexusTypes.Interface<NetData>({
        worldObject: NexusTypes.String,
        position: NexusTypes.Vector3,
        normal: NexusTypes.IntEnum(Enum.Normal),
        rotation: NexusTypes.IntEnum(Enum.Rotation),
        quarter: NexusTypes.IntEnum(Enum.Quarter),
        height: NexusTypes.IntEnum(Enum.Height),
    });

    export class Data {

        public readonly positionId: string;
        public readonly worldObject: WorldObjectComponent;
        public readonly position: Vector3 = Vector3.zero;
        public readonly normal: Enum.Normal = Enum.Normal.Default;
        public readonly rotation: Enum.Rotation = Enum.Rotation.Default;
        public readonly quarter: Enum.Quarter = Enum.Quarter.Default;
        public readonly height: Enum.Height = Enum.Height.Default;

        public readonly transform: {
            position: Vector3;
            rotation: Quaternion;
        }

        public constructor(worldObject: WorldObjectComponent, args?: {
            
            position?: Vector3,
            normal?: Enum.Normal,
            rotation?: Enum.Rotation,
            quarter?: Enum.Quarter,
            height?: Enum.Height,
        }) {
            this.worldObject = worldObject;
            if (args?.position) this.position = args.position;
            if (args?.normal) this.normal = args.normal;
            if (args?.rotation) this.rotation = args.rotation;
            if (args?.quarter) this.quarter = args.quarter;
            if (args?.height) this.height = args.height;

            this.positionId = `${this.position.x},${this.position.y},${this.position.z}`; 

            const rotation = MathUtil.RoundVec(Enum.NormalValues[this.normal].mul(Enum.RotationValues[this.rotation]).mul(Quaternion.Euler(this.worldObject.originRotation.x, this.worldObject.originRotation.y, this.worldObject.originRotation.z)).eulerAngles);

            this.transform = {
                position: MathUtil.RoundVec(this.position.add(Enum.QuarterValues[this.quarter].add(Enum.HeightValues[this.height]))),
                // Sets rotation to apply the object's local rotation to face Z+ then local rotation on y-axis and then normal rotation to face -Y to the "ground" (in that exact order)
                rotation: Quaternion.Euler(rotation.x, rotation.y, rotation.z),
            }
        }

        public static TransformModel(data: Data, model: GameObject): void {
            model.transform.position = data.transform.position.add(GameManager.Get().config.islandPositionOffset);
            model.transform.rotation = data.transform.rotation;
        }

        public static TransformCollider(data: Data, vector: Vector3): Vector3 {
            return MathUtil.RoundVec(MathUtil.RoundVec(data.transform.rotation.mul(vector).add(data.transform.position)));
        }

        public static receiveNet(data: NetData): Data | undefined {
            const object = ItemManager.Get().TryGetItemComponentGroup(data.worldObject, Enum.ItemComponentGroup.WorldObject);
            if (!object) return;
            return new Data(object, { position: data.position, normal: data.normal, rotation: data.rotation, quarter: data.quarter, height: data.height });
        }

        public static sendNet(data: Data): NetData {
            return {
                worldObject: data.worldObject.name,
                position: data.position,
                normal: data.normal,
                rotation: data.rotation,
                quarter: data.quarter,
                height: data.height,
            }
        }
    }
    
    export class Bin {
        private colliders: { [positionId: string]: string | undefined } = { };
        private objects: { [positionId: string]: Data | undefined } = { };

        public readonly GetColliders = () => this.colliders;
        public readonly GetObjects = () => this.objects;

        private AddCollider(data: Data, vector: Vector3): void {
            vector = Data.TransformCollider(data, vector);
            this.colliders[IdUtility.Vector3ToId(vector)] = data.positionId;
        }

        private RunPerCollider(data: Data, func: (vector: Vector3) => void): void {
            for (let x = 0; x < data.worldObject.size.x; x++) {
                for (let y = 0; y < data.worldObject.size.y; y++) {
                    for (let z = 0; z < data.worldObject.size.z; z++) {
                        func(new Vector3(x, y, z).add(data.worldObject.originPosition));
                    }
                }
            }
        }

        private PerCollidersOnSide(data: Data, normal: Enum.Normal, func: (vector: Vector3) => void): void {
            for (let x = 0; x < data.worldObject.size.x; x++) {
                for (let z = 0; z < data.worldObject.size.z; z++) {
                    func(new Vector3(x, -1, z).add(data.worldObject.originPosition));
                }
            }
        }

        private AddColliders(data: Data): void {
            if (data.worldObject.size === Vector3.one) return this.AddCollider(data, Vector3.zero);
            this.RunPerCollider(data, (vector) => this.AddCollider(data, vector));
        }

        public AddObject(data: Data): void {
            this.objects[data.positionId] = data;
            this.AddColliders(data);
        }

        private GetUnsupportedColliders(data: Data): Vector3[] {
            if (data.worldObject.requireSupport.isEmpty()) return [];

            const unsupported: Vector3[] = [];
            data.worldObject.requireSupport.forEach((normal) => {
                this.PerCollidersOnSide(data, normal, (vector) => {
                    vector = Data.TransformCollider(data, vector);
                    const positionId = IdUtility.Vector3ToId(vector);
                    if (!(positionId in this.colliders) || !this.colliders[positionId]) return unsupported.push(vector);
                    if (this.objects[this.colliders[positionId]]?.worldObject.colliderType !== Enum.Collider.Normal) return unsupported.push(vector);
                })
            });
            return unsupported;
        }

        public GetObjectByCollisionAt(position: Vector3): Data | undefined {
            const positionId = IdUtility.Vector3ToId(position);
            if (positionId in this.colliders && this.colliders[positionId]) return this.objects[this.colliders[positionId]];
        }

        public GetObjectByBaseAt(position: Vector3): Data | undefined {
            const positionId = IdUtility.Vector3ToId(position);
            if (positionId in this.objects) return this.objects[positionId];
        }

        public GetCollisions(data: Data): Vector3[] {
            const collisions: Vector3[] = [];
            this.RunPerCollider(data, (vector) => {
                vector = Data.TransformCollider(data, vector);
                if (this.GetObjectByCollisionAt(vector)) return collisions.push(vector);
            });
            return collisions;
        }

        public Verify(data: Data): { success: true } | { success: false, collisions: Vector3[], unsupported: Vector3[] } {
            const collisions = this.GetCollisions(data);
            const unsupported = this.GetUnsupportedColliders(data);

            if (!collisions.isEmpty() || !unsupported.isEmpty()) return {
                success: false,
                collisions: collisions,
                unsupported: unsupported
            }
            return { success: true }
        }

        private RemoveCollider(data: Data, vector: Vector3): void {
            vector = Data.TransformCollider(data, vector);
            this.colliders[IdUtility.Vector3ToId(vector)] = undefined;
        }

        private RemoveColliders(data: Data): void {
            if (data.worldObject.size === Vector3.one) return this.RemoveCollider(data, Vector3.zero);
            this.RunPerCollider(data, (vector) => this.RemoveCollider(data, vector));
        }

        public GetObjectCollidersAt(position: Vector3): Vector3[] {
            const data = this.GetObjectByCollisionAt(position);
            if (!data) return [];
            if (data.worldObject.size === Vector3.one) return [Data.TransformCollider(data, Vector3.zero)];
            const colliders: Vector3[] = []
            this.RunPerCollider(data, (vector) => colliders.push(Data.TransformCollider(data, vector)));
            return colliders;
        }

        public RemoveObject(data: Data): void {
            this.objects[data.positionId] = undefined;
            this.RemoveColliders(data);
        }

        public RemoveObjectAt(position: Vector3): Data | undefined {
            const data = this.GetObjectByCollisionAt(position);
            if (!data) return;
            this.RemoveObject(data);
            return data;
        }
    }
}