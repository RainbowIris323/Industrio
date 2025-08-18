export default function ModifyRenderer(renderer: Renderer, toCopy: Renderer, overrideColor?: Color): () => void {
    const materials = renderer.sharedMaterials;

    renderer.materials = toCopy.materials;
    renderer.materials.forEach((material, i) => {
        if (materials[i].mainTexture) material.SetTexture("_MainTex", materials[i].mainTexture);
        if (overrideColor) {
            material.SetColor("_Color", Color.Lerp(overrideColor, materials[i].color, 0.5));
        } else material.SetColor("_Color", materials[i].color);
    })

    return () => {
        renderer.SetMaterials(materials);
    }
}