using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EgowallConverter.Converter.Converters
{
    class FurnitureConverter : IConverter
    {
        FbxExporter m_fbxExporter;
        BabylonHandler m_babylonHandler;
        TextureFinder m_textureFinder;
        TextureCompressor m_textureCompressor;
        ZipBundler m_zipBundler;        

        public FurnitureConverter()
        {   
            m_fbxExporter = new FbxExporter();
            m_babylonHandler = new BabylonHandler();
            m_textureFinder = new TextureFinder();
            m_textureCompressor = new TextureCompressor();
            m_zipBundler = new ZipBundler();
        }

        public void Run()
        {
            HandleDirectory(Application.InputDirectory);
        }

        public void CreateResourcesFolder(string a_directoryPath)
        {
            // If we're currently in a resources folder
            if (a_directoryPath.ToLower().EndsWith("\\resources"))
            {
                return;
            }

            string resourcespath = a_directoryPath + "/" + "Resources";
            if (!Directory.Exists(resourcespath))
            {
                string[] textures = Directory.GetFiles(a_directoryPath, "*.tga");
                if (textures.Length > 0)
                {
                    
                    Directory.CreateDirectory(resourcespath);
                    foreach (string texture in textures)
                    {
                        FileInfo info = new FileInfo(texture);
                        File.Copy(texture, resourcespath + "/" + info.Name, true);
                    }
                }
            }
        }

        /// <summary>
        /// Recursive function to find all files & directories
        /// Does Files first and then Directories
        /// </summary>
        /// <param name="a_directoryPath"></param>
        public void HandleDirectory(string a_directoryPath)
        {
            string[] files = Directory.GetFiles(a_directoryPath, "*.fbx");

            // Incase some fbx files need the resource director specifically copy all .tga files there.
            CreateResourcesFolder(a_directoryPath);

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
            foreach (string file in a_files)
            {
                if (ProcessFile(file))
                {
                    Application.LogMessage("Succesfully processed " + file, ConsoleColor.Gray);
                }
                else
                {
                    Application.LogMessage("Failed to process " + file, ConsoleColor.Red);
                }
            }
        }
        
        public bool ProcessFile(string a_file)
        {
            bool success = false;
            bool fbxResult = m_fbxExporter.ConvertFbxToBabylon(a_file, Application.TempDirectory);

            if (fbxResult)
            {
                // Files exist now
                string[] tempFiles = Directory.GetFiles(Application.TempDirectory, "*.babylon");

                if (tempFiles.Length == 1)
                {
                    string babylonFile = tempFiles[0];
                    
                    try
                    {
                        // Since some meshes doesn't have textures try and add them to the material
                        if (m_textureFinder.TryFindFiles(a_file, Application.TempDirectory))
                        {
                            m_babylonHandler.AddTexturesToMaterial(babylonFile, m_textureFinder.TextureInfos);
                        }

                        m_babylonHandler.FixPrecision(babylonFile);

                        m_babylonHandler.ChangeMaterialId(babylonFile);                        

                        m_textureCompressor.CompressImages(Application.TempDirectory);

                        string outputDirectory = Application.GetOutputDirectory(a_file);

                        m_zipBundler.CreateZipBundle(Application.TempDirectory, babylonFile, outputDirectory);
                        success = true;

                    }
                    catch(Exception e)
                    {
                        Application.LogMessage("An error occured when parsing babylon file. - " + e.Message, ConsoleColor.Red);
                    }

                    Application.CleanTemp();                   
                }
                else
                {
                    Application.LogMessage("No babylon file found in temp folder", ConsoleColor.Red);
                }
            }
            else
            {
                Application.LogMessage("Failed to process: '" + a_file + "'", ConsoleColor.Red);
            }

            return success;
        }
    }
}
