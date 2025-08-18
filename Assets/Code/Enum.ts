export namespace Enum {
    export const NormalValues: { [key: number]: Quaternion } = {
        0: Quaternion.Euler(0, 0, 0),
        1: Quaternion.Euler(0, 0, 180),
        2: Quaternion.Euler(0, 0, 0),
        3: Quaternion.Euler(90, 0, 0),
        4: Quaternion.Euler(0, 0, -90),
        5: Quaternion.Euler(-90, 0, 0),
        6: Quaternion.Euler(0, 0, 90),
    }

    export const NormalFromVector3 = (vector: Vector3): number => {
        if (vector === Vector3.down) return 1;
        if (vector === Vector3.up) return 2;
        if (vector === Vector3.forward) return 3;
        if (vector === Vector3.right) return 4;
        if (vector === Vector3.back) return 5;
        if (vector === Vector3.left) return 6;
        return 0;
    }

    export const Vector3FromNormal = (normal: Enum.Normal): Vector3 => {
        if (normal === Enum.Normal.Bottom) return Vector3.down;
        if (normal === Enum.Normal.Top) return Vector3.up;
        if (normal === Enum.Normal.Front) return Vector3.forward;
        if (normal === Enum.Normal.Right) return Vector3.right;
        if (normal === Enum.Normal.Back) return Vector3.back;
        if (normal === Enum.Normal.Left) return Vector3.left;
        return Vector3.down;
    }

    export enum Normal {
        Default = 0,
        Bottom = 1,
        Top = 2,
        Front = 3,
        Right = 4,
        Back = 5,
        Left = 6,
    }

    export const RotationValues: { [key: number]: Quaternion } = {
        0: Quaternion.Euler(0, 0, 0),
        1: Quaternion.Euler(0, 0, 0),
        2: Quaternion.Euler(0, 90, 0),
        3: Quaternion.Euler(0, 180, 0),
        4: Quaternion.Euler(0, 270, 0),
    }

    export enum Rotation {
        Default = 0,
        Front = 1,
        Right = 2,
        Back = 3,
        Left = 4,
    }

    export const QuarterValues: { [key: number]: Vector3 } = {
        0: new Vector3(0, 0, 0),
        1: new Vector3(0.25, 0, 0.25),
        2: new Vector3(-0.25, 0, 0.25),
        3: new Vector3(0.25, 0, -0.25),
        4: new Vector3(-0.25, 0, -0.25),
    }

    export enum Quarter {
        Default = 0,
        FrontRight = 1,
        FrontLeft = 2,
        BackRight = 3,
        BackLeft = 4,
    }

    export const HeightValues: { [key: number]: Vector3 } = {
        0: new Vector3(0, 0, 0),
        1: new Vector3(0, -0.25, 0),
        2: new Vector3(0, 0.25, 0),
    }

    export enum Height {
        Default = 0,
        Bottom = 1,
        Top = 2,
    }

    export enum Collider {
        None = 0,
        Normal = 1,
        OccupancyOnly = 2,
        Partial = 3,
    }

    export enum ItemComponentGroup {
    None = "None",
    Tool = "Tool",
    WorldObject = "World Object",
}

    export enum ItemComponent {
        None = "None",
        MeleeWeapon = "Melee Weapon",
        MiningTool = "Mining Tool",
        BlockObject = "Block",
        CraftingTable = "Crafting Table",
        Machine = "Machine",
        Crop = "Crop"
    }

    export enum ObjectInteraction {
        None = "None",
        OpenMenu = "Open Menu"
    }

    export enum Menu {
        None = "None",
        Crafting = "Crafting",
        Processing = "Processing",
        Status = "Status",
    }
}