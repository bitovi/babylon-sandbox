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

namespace EgowallConverter.Converter
{
    class BabylonHandler
    {
        private Regex precision;
        private Regex firstPass;
        private Regex secondPass;

        public BabylonHandler()
        {
            precision = new Regex(@"(-?\d+\.\d+(e[+\-]\d+)?)", RegexOptions.IgnoreCase);
            firstPass = new Regex(@"([\d]+\.[\d]+(e-?\d+))");
            secondPass = new Regex(@"(\.\d+)\b", RegexOptions.IgnoreCase);      
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
       
        private string FirstpassAdjuster(Match m)
        {
            decimal number;
            //var val = input.value;
            //val = val.replace( / ([\d] +\.[\d] + (e -?\d +))/ g, function(x, $1) {
            //    return parseFloat( $1).toFixed(7);
            //});
            //val = val.replace( / (\.\d +)\b / gi, function(x, $1) {
            //    var y = parseFloat( $1);

            //    return y < 0.0001 ? "" : y.toPrecision(4).substr(1);
            //});
            //output.value = val;

            if ( decimal.TryParse(m.Value, System.Globalization.NumberStyles.Float, new CultureInfo("en-GB"),  out number))
            {
                number = Math.Round(number, 7);    
                string output = String.Format("{0:0.0000000}", number);
                return output;
            }
            // If it fails to parse it into a double then return the old value
            else
            {
                Converter.LogMessage("Failed to parse double", ConsoleColor.Yellow);
                return m.Value;
            }
        }

        private string SecondPassAdjuster(Match m)
        {
            decimal number;

            if (decimal.TryParse(m.Value, out number))
            {
                decimal original = number;
                number = Math.Round(number, 4);

                if (number < -0.999m && number > -1.0001m)
                {
                    
                }

                string output = String.Format("{0:.0000}", number);               
                if (output[1] == '.')
                {
                    output = output.Substring(1);
                }

                return output;
            }
            // If it fails to parse it into a double then return the old value
            else
            {
                Converter.LogMessage("Failed to parse double", ConsoleColor.Yellow);
                return m.Value;
            }
        }
    }
}
