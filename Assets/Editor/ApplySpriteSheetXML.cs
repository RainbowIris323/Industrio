using UnityEngine;
using UnityEditor;
using System.Xml; // For XML parsing
using System.IO; // For Path operations

public class SpriteSheetXML : EditorWindow
{
    public TextAsset textureAtlasXML; // Assign your XML TextAsset here
    public Texture2D spriteSheetTexture; // Assign your actual spritesheet image here

    [MenuItem("Tools/Sprite Sheet XML")]
    public static void ShowWindow()
    {
        GetWindow<SpriteSheetXML>("Sprite Sheet XML");
    }

    void OnGUI()
    {
        GUILayout.Label("Sprite Sheet Slicer Setup", EditorStyles.boldLabel);

        textureAtlasXML = (TextAsset)EditorGUILayout.ObjectField("Texture Atlas XML", textureAtlasXML, typeof(TextAsset), false);
        spriteSheetTexture = (Texture2D)EditorGUILayout.ObjectField("Sprite Sheet Texture", spriteSheetTexture, typeof(Texture2D), false);

        if (GUILayout.Button("Slice Sprite Sheet"))
        {
            if (textureAtlasXML == null)
            {
                EditorUtility.DisplayDialog("Error", "Please assign the Texture Atlas XML.", "OK");
                return;
            }
            if (spriteSheetTexture == null)
            {
                EditorUtility.DisplayDialog("Error", "Please assign the Sprite Sheet Texture.", "OK");
                return;
            }

            ApplySpriteSheetXML(textureAtlasXML, spriteSheetTexture);
        }
    }

    void ApplySpriteSheetXML(TextAsset xmlAsset, Texture2D texture)
    {
        string xmlContent = xmlAsset.text;
        string texturePath = AssetDatabase.GetAssetPath(texture);

        // Get the TextureImporter for the sprite sheet
        TextureImporter importer = AssetImporter.GetAtPath(texturePath) as TextureImporter;
        if (importer == null)
        {
            EditorUtility.DisplayDialog("Error", "Could not get TextureImporter for the sprite sheet.", "OK");
            return;
        }

        // --- Configure Texture Importer for Sprite Mode ---
        importer.textureType = TextureImporterType.Sprite;
        importer.spriteImportMode = SpriteImportMode.Multiple; // Important for multiple sprites
        importer.mipmapEnabled = false; // Usually off for UI/sprites
        importer.filterMode = FilterMode.Point; // Or Bilinear, depending on desired quality

        // --- Parse XML and create SpriteMetaData ---
        XmlDocument doc = new XmlDocument();
        doc.LoadXml(xmlContent);

        XmlNode textureAtlasNode = doc.SelectSingleNode("/TextureAtlas"); // Adjust if root element name differs
        if (textureAtlasNode == null)
        {
            EditorUtility.DisplayDialog("Error", "TextureAtlas root node not found in XML.", "OK");
            return;
        }

        XmlNodeList subTextureNodes = textureAtlasNode.SelectNodes("SubTexture"); // Adjust if sub-element name differs

        if (subTextureNodes == null || subTextureNodes.Count == 0)
        {
            EditorUtility.DisplayDialog("Error", "No SubTexture nodes found in XML.", "OK");
            return;
        }

        SpriteMetaData[] newSprites = new SpriteMetaData[subTextureNodes.Count];
        int i = 0;
        foreach (XmlNode node in subTextureNodes)
        {
            string name = node.Attributes["name"].Value;
            int x = int.Parse(node.Attributes["x"].Value);
            int y = int.Parse(node.Attributes["y"].Value);
            int width = int.Parse(node.Attributes["width"].Value);
            int height = int.Parse(node.Attributes["height"].Value);

            // Unity's texture origin is bottom-left, so we need to adjust Y
            // Total texture height - (y + height) gives correct bottom-left Y
            newSprites[i] = new SpriteMetaData
            {
                name = Path.GetFileNameWithoutExtension(name), // Often the subtexture name includes .png, remove it
                rect = new Rect(x, texture.height - y - height, width, height),
                pivot = new Vector2(0.5f, 0.5f) // Default pivot to center; adjust if needed
            };
            i++;
        }

        importer.spritesheet = newSprites; // Assign the new sprite data
        importer.SaveAndReimport(); // Apply changes and reimport the texture

        EditorUtility.DisplayDialog("Success", "Sprite Sheet Sliced Successfully!", "OK");
        Debug.Log($"Sliced {newSprites.Length} sprites from {texture.name}");
    }
}
