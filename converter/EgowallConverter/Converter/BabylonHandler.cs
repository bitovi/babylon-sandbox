using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.IO;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using System.Threading;
using System.Globalization;
using Newtonsoft.Json.Linq;

namespace EgowallConverter.Converter
{
    class BabylonHandler
    {
        private Regex precision;

        private Regex tgaToPng;
  

        public BabylonHandler()
        {
            precision = new Regex(@"(-?\d+\.\d+(e[+\-]\d+)?)", RegexOptions.IgnoreCase);
            tgaToPng = new Regex(@"\.tga", RegexOptions.IgnoreCase);
              
        }

        /// <summary>
        /// Parse the file content
        /// Regex replace to 4 decimal precision
        /// </summary>
        /// <param name="a_babylonFile"></param>
        public void FixPrecision(string a_babylonFile)
        {
            string text;
            using (StreamReader sr = new StreamReader(a_babylonFile))
            {
                text = sr.ReadToEnd();
            }

            string output = precision.Replace(text, new MatchEvaluator(FixPrecisionAdjuster));

            output = tgaToPng.Replace(output, ".png");

            //string output = firstPass.Replace(text, new MatchEvaluator(FirstpassAdjuster));
            //output = secondPass.Replace(output, new MatchEvaluator(SecondPassAdjuster));
            // Overwrite the babylon file with the new file
            using (StreamWriter sw = new StreamWriter(a_babylonFile, false))
            {
                sw.WriteLine(output);
            }
        }

        /// <summary>
        /// Read all text from babylonFile
        /// Make a newtonsoft.Json object and iterate to the material id parts
        /// </summary>
        /// <param name="a_babylonFile"></param>
        public void ChangeMaterialId(string a_babylonFile)
        {
            string text;
            
            using (StreamReader sr = new StreamReader(a_babylonFile))
            {
                text = sr.ReadToEnd();
            }          
            

            dynamic rootObject = JsonConvert.DeserializeObject(text);

            Dictionary<string, string> materialsIds = new Dictionary<string, string>();
                        
            foreach (dynamic material in rootObject.materials)
            {
                string id = material.id;
                string name = material.name;

                materialsIds[id] = name;

                material.id = name;

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
                                    textureChild.Value = "data:" + textureName;
                                    // No need to check the rest
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            foreach (dynamic multimaterial in rootObject.multiMaterials)
            {
                
                for (var i = 0; i < multimaterial.materials.Count; ++i)
                {
                    string id = multimaterial.materials[i];
                    if (materialsIds.ContainsKey(id))
                    {
                        multimaterial.materials[i] = materialsIds[id];
                    }
                    else
                    {
                        Converter.LogMessage("Found a material with no Id: " + a_babylonFile, ConsoleColor.Yellow);
                    }
                }
            }

            string output = JsonConvert.SerializeObject(rootObject);

            using (StreamWriter sw = new StreamWriter(a_babylonFile, false))
            {
                sw.WriteLine(output);
            }            
        }

        private string FixPrecisionAdjuster(Match m)
        {
            decimal number;

            if (decimal.TryParse(m.Value, System.Globalization.NumberStyles.Float, new CultureInfo("en-GB"), out number))
            {
                number = Math.Round(number, 5);
                string output = String.Format("{0:0.0000}", number);
                return output;
            }
            // If it fails to parse it into a double then return the old value
            else
            {
#if DEBUG
                Converter.LogMessage("Failed to parse double: " + m.Value, ConsoleColor.Yellow);
#endif
                return m.Value;
            }
        }
        
        private string TgaToPngAdjuster(Match m)
        {
            return ".png";
        }               
    }
}
