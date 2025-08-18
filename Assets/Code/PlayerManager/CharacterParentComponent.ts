export default class CharacterParentComponent extends AirshipBehaviour {
    public movementParent?: GameObject;
    private movementParentLastPosition?: Vector3;
    private movementParentLastRotation?: Quaternion;
    private characterRigidbody: Rigidbody;
    
    protected Awake(): void {
        this.characterRigidbody = this.gameObject.GetComponent<Rigidbody>()!;
    }

    protected FixedUpdate(): void {
        this.UpdateParent();
    }

    private UpdateParent(): void {
        if (!this.movementParent) return;
        const lastObjectPosition = this.movementParentLastPosition ?? this.movementParent.transform.position;
        const lastObjectRotation = this.movementParentLastRotation ?? this.movementParent.transform.rotation;

        const localPosition = Quaternion.Inverse(lastObjectRotation).mul(this.characterRigidbody.position.sub(lastObjectPosition));
        const localRotation = Quaternion.Inverse(lastObjectRotation).mul(this.characterRigidbody.rotation);

        this.characterRigidbody.MovePosition(this.movementParent.transform.rotation.mul(localPosition).add(this.movementParent.transform.position));
        this.characterRigidbody.MoveRotation(this.movementParent.transform.rotation.mul(localRotation));

        this.movementParentLastPosition = this.movementParent.transform.position;
        this.movementParentLastRotation = this.movementParent.transform.rotation;
    }
}