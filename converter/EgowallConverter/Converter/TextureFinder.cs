using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EgowallConverter.Converter
{
    /// <summary>
    /// Finds textures for a babylon file based off name if there were no textures copied to temp folder
    /// </summary>
    class TextureFinder
    {
        public List<TextureInfo> TextureInfos { get; set; } = new List<TextureInfo>();

        public bool TryFindFiles( string a_inputFile, string a_targetDirectory)
        {
            // Clear the list first of all so it doesnt have old data
            TextureInfos.Clear();
            // Only do things if no files exists 
            if (!HasFiles( a_targetDirectory ))
            {
                TextureInfo info = TextureInfo.GetInfo(a_inputFile);
                
                // Don't try and add textures for collision
                if (info.Name != "Col")
                {
                    FindFiles(info, a_targetDirectory);
                    return true;
                }
            }

            return false;
        }

        /// <summary>
        /// Copy .tga file to temp directory
        /// </summary>
        /// <param name="a_file"></param>
        /// <param name="a_targetDirectory"></param>
        public void CopyFile(string a_file, string a_targetDirectory)
        {
            FileInfo info = new FileInfo(a_file);
            File.Copy(a_file, a_targetDirectory + "/" + info.Name, true);
        }

        public void FindFiles( TextureInfo a_info, string a_targetDirectory)
        {
            string resourcesPath = a_info.FolderPath + "Resources";

            string[] files = Directory.GetFiles(resourcesPath, "*.tga");

            string prefix = a_info.Prefix;
            switch (a_info.Name)
            {
                case "LOD0":
                    prefix += "_Tex0";
                    break;
                case "LOD1":
                    prefix += "_Tex1";
                    break;
                case "LOD2":
                    prefix += "_Tex2";
                    break;
                case "LOD3":
                    prefix += "_Tex3";
                    break;
                default:
                    Application.LogMessage("Unknown prefix for file found: " + a_info.Name + " \nAssuming _Tex0", ConsoleColor.Yellow);
                    prefix += "_Tex0";
                    break;
            }

            foreach (string file in files)
            {
                TextureInfo info = TextureInfo.GetInfo(file);

                if (info.Prefix == prefix)
                {
                    if (info.TextureType != TextureInfo.TexType.Undefined)
                    {
                        TextureInfos.Add(info);
                        CopyFile(file, a_targetDirectory);
                    }
                    else
                    {
                        Application.LogMessage("Texture with unknown type found for: " + a_info.Prefix + "_" +  a_info.Name, ConsoleColor.Yellow);
                    }                    
                }
            }
        }               

        public bool HasFiles( string a_directory)
        {
            string[] files = Directory.GetFiles(a_directory, "*.tga");

            return files.Length > 0;
        }
    }
}
