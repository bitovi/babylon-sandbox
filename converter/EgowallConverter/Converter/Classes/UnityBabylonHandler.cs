using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace EgowallConverter.Converter.Classes
{
    class UnityBabylonHandler
    {
        /// <summary>
        /// Copies the .babylon file and all textures that is inside it.           
        /// </summary>
        /// <param name="a_file"></param>
        /// <param name="a_targetDirectory"></param>
        /// <returns></returns>
        public bool CopyFile( string a_file, string a_targetDirectory)
        {
            FileInfo fileInfo = new FileInfo(a_file);
            string outputFile = a_targetDirectory + "/" + fileInfo.Name;

            if (!Directory.Exists( a_targetDirectory))
            {
                Directory.CreateDirectory(a_targetDirectory);
            }
            // Copy file to temp
            File.Copy(a_file, outputFile, true);
            // Possibly convert material StandardMaterial

            // Get all textures
            string originalDirectory = Path.GetDirectoryName(a_file);
            var textures = GetTextures(outputFile, originalDirectory);
            // Copy all textures
            foreach (string texture in textures)
            {
                FileInfo textureFileInfo = new FileInfo(texture);
                File.Copy(originalDirectory + "/" + texture, a_targetDirectory + "/" + textureFileInfo.Name, true);
            }

            return true;
        }

        public List<string> GetTextures( string a_file, string a_originalDirectory )
        {
            string data;
            using (StreamReader sr = new StreamReader(a_file))
            {
                data = sr.ReadToEnd();
            }

            dynamic rootObject = JsonConvert.DeserializeObject(data);

            // only add texture once
            // the copy function will overwrite duplicates 
            // but better to only do 1 IO operation / texture!
            HashSet<string> textures = new HashSet<string>();            

            foreach (dynamic material in rootObject.materials)
            {
                // Iterate over all properties to find object types
                foreach (JProperty prop in material)
                {
                    // There's a layer between prop and its values
                    // { prop: { value } }                
                    foreach (JToken child in prop.Children())
                    {
                        // Check if { value } has 4 children+    
                        // A texture should have 18
                        if (child.Count() > 5)
                        {
                            // Iterate over the textureProp children
                            foreach (JProperty textureChild in child.Children())
                            {
                                // Find the one we need
                                if (textureChild.Name == "name")
                                {
                                    string textureName = textureChild.ToObject<string>();
                                    if (!textures.Contains(textureName))
                                    {
                                        textures.Add(textureName);
                                    }
                                    // No need to check the rest
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            // Now check that all textures actually exists
            var textureList = textures.ToList();

            for (int i = 0; i < textureList.Count;)
            {
                if (File.Exists( a_originalDirectory + "/" + textureList[i]))
                {
                    i++;
                }
                else
                {
                    Application.LogMessage("Found a texture that isn't in the folder. " + textureList[i], ConsoleColor.Yellow);
                    textureList.RemoveAt(i);
                }
            }

            return textureList;
        }        

        public void Minify( string a_file)
        {
            string text;
            using (StreamReader sr = new StreamReader(a_file))
            {
                text = sr.ReadToEnd();
            }
            var obj = JsonConvert.DeserializeObject(text);
            using (StreamWriter sw = new StreamWriter(a_file, false))
            {
                sw.WriteLine(JsonConvert.SerializeObject(obj, Formatting.None));
            }
        }
    }
}
