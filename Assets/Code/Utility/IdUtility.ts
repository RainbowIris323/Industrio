export default class IdUtility {
    public static Vector3ToId = (pos: Vector3) => {
        return `${pos.x},${pos.y},${pos.z}`
    };

    public static IdToVector3 = (id: string) => {
        const splitId = id.split(",");
        return new Vector3(tonumber(splitId[0])!, tonumber(splitId[1])!, tonumber(splitId[2])!);
    };
}