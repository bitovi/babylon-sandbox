using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EgowallConverter.Converter
{
    class TextureInfo
    {
        public enum TexType{
            Undefined,
            Diffuse,
            Normal
        }

        public string FolderPath { get; set; }
        public string Prefix { get; set; }
        public string Name { get; set; }
        public TexType TextureType { get; set; } = TexType.Undefined;

        /// <summary>
        /// Input: Concrete_001_Tex0_Nrm.tga
        /// Output: Concrete_001_Tex0
        /// </summary>
        /// <param name="a_file"></param>
        /// <returns></returns>
        public static TextureInfo GetInfo(string a_file)
        {
            FileInfo fileInfo = new FileInfo(a_file);
            string[] parts = fileInfo.Name.Split('_');
            TextureInfo result = new TextureInfo();

            for (int i = 0; i < parts.Length - 1; i++)
            {
                result.Prefix += parts[i];
                if (i < parts.Length - 2)
                {
                    result.Prefix += "_";
                }
            }

            string lastPart = parts[parts.Length - 1];
            result.Name = lastPart.Substring(0, lastPart.Length - fileInfo.Extension.Length);

            result.FolderPath = a_file.Substring(0, a_file.Length - fileInfo.Name.Length);

            switch (result.Name)
            {
                case "Diff":
                    result.TextureType = TexType.Diffuse;
                    break;
                case "Nrml":
                    result.TextureType = TexType.Normal;
                    break; 
            }            

            return result;
        }
    }
}
