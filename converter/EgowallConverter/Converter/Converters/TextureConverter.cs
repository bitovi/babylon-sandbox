using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EgowallConverter.Converter.Converters
{
    class TextureConverter : IConverter
    {
        TextureCompressor m_textureCompressor;
        ZipBundler m_zipBundler;

        public TextureConverter()
        {
            m_textureCompressor = new TextureCompressor();
            m_zipBundler = new ZipBundler();
        }

        public void Run()
        {
            HandleDirectory(Application.InputDirectory);
        }

        /// <summary>
        /// Recursive function to find all files & directories
        /// Does Files first and then Directories
        /// </summary>
        /// <param name="a_directoryPath"></param>
        public void HandleDirectory(string a_directoryPath)
        {
            string[] files = Directory.GetFiles(a_directoryPath, "*.tga");

            HandleFiles(files);


            string[] directories = Directory.GetDirectories(a_directoryPath);

            Application.LogMessage("Directory '" + a_directoryPath + "' is finished being processed.", ConsoleColor.Gray);
            foreach (string directory in directories)
            {
                HandleDirectory(directory);
            }
        }
        /// <summary>
        /// Handles all the fbx files
        /// </summary>
        /// <param name="a_files"></param>
        public void HandleFiles(string[] a_files)
        {
            // For example if we process Concrete_001_Tex0_Diff.tga
            // Then we add Concrete_001_Tex0_Nrm.tga to this dictionary so when foreach finds the Nrm file it skips it.
            Dictionary<string, bool> siblings = new Dictionary<string, bool>();

            foreach (string file in a_files)
            {
                if (siblings.ContainsKey(file))
                {
                    continue;
                }

                List<string> files = FindSiblings(file, a_files);

                foreach (string sibling in files)
                {
                    siblings.Add(sibling, true);
                }
                // Finally add the file to the list
                files.Add(file);

                if (ProcessFiles(files))
                {
                    Application.LogMessage("Succesfully processed " + file, ConsoleColor.Gray);
                }
                else
                {
                    Application.LogMessage("Failed to process " + file, ConsoleColor.Red);
                }
            }
        }

        public bool ProcessFiles(List<string> a_files)
        {
            if (!Directory.Exists(Application.TempDirectory))
            {
                Directory.CreateDirectory(Application.TempDirectory);
            }

            // 1. Copy files to temp directory
            foreach (string file in a_files)
            {
                FileInfo fileInfo = new FileInfo(file);
                File.Copy(file, Application.TempDirectory + "/" + fileInfo.Name);
            }

            m_textureCompressor.CompressImages(Application.TempDirectory);

            string outputDirectory = Application.GetOutputDirectory(a_files[0]);
            FilePrefix filePrefix = GetFilePrefix(a_files[0]);

            m_zipBundler.CreateZipBundle(Application.TempDirectory, filePrefix.Prefix + ".png", outputDirectory);

            Application.CleanTemp();

            return true;
        }        

        /// <summary>
        /// Finds the related textures for Concrete_001_Tex0_Nrm.tga
        /// Function finds Concrete_001_Tex0_Diff.tga
        /// </summary>
        /// <param name="a_file"></param>
        /// <param name="a_files"></param>
        /// <returns></returns>
        private List<string> FindSiblings(string a_file, string[] a_files)
        {
            List<string> result = new List<string>();
            FilePrefix filePrefix = GetFilePrefix(a_file);

            foreach (string file in a_files)
            {
                if (file != a_file)
                {
                    if (file.StartsWith( filePrefix.FolderPath + filePrefix.Prefix))
                    {
                        result.Add(file);
                    }
                }
            }

            return result;
        }

        /// <summary>
        /// Input: Concrete_001_Tex0_Nrm.tga
        /// Output: Concrete_001_Tex0
        /// </summary>
        /// <param name="a_file"></param>
        /// <returns></returns>
        private FilePrefix GetFilePrefix(string a_file)
        {
            FileInfo fileInfo = new FileInfo(a_file);
            string[] parts = fileInfo.Name.Split('_');
            FilePrefix result = new FilePrefix();

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

            return result;
        }

        private class FilePrefix
        {
            public string FolderPath { get; set; }
            public string Prefix { get; set; }
            public string Name { get; set; }
        }
    }
}
