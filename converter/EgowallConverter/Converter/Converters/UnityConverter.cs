using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EgowallConverter.Converter.Classes;

namespace EgowallConverter.Converter.Converters
{
    class UnityConverter : IConverter
    {        
        BabylonHandler m_babylonHandler;
        TextureFinder m_textureFinder;
        TextureCompressor m_textureCompressor;
        UnityBabylonHandler m_unityBabylonHandler;
        ZipBundler m_zipBundler;

        bool m_addMeshIds;

        public UnityConverter(bool a_addNeshIds)
        {
            m_addMeshIds = a_addNeshIds;

            m_babylonHandler = new BabylonHandler();
            m_textureFinder = new TextureFinder();
            m_textureCompressor = new TextureCompressor();
            m_unityBabylonHandler = new UnityBabylonHandler();
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
            string[] files = Directory.GetFiles(a_directoryPath, "*.babylon");            

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
            
            if (m_unityBabylonHandler.CopyFile( a_file, Application.TempDirectory))
            {
                // Files exist now
                string[] tempFiles = Directory.GetFiles(Application.TempDirectory, "*.babylon");

                if (tempFiles.Length == 1)
                {
                    string babylonFile = tempFiles[0];

                    // Minify the output
                    m_unityBabylonHandler.Minify(babylonFile);

                    try
                    {       
                        m_babylonHandler.FixPrecision(babylonFile);
                        
                        m_babylonHandler.ChangeMaterialTextureUrls(babylonFile);

                        if (m_addMeshIds)
                        {
                            m_babylonHandler.AddMeshIdTags(babylonFile);
                        }

                        m_textureCompressor.CompressImages(Application.TempDirectory);

                        string outputDirectory = Application.GetOutputDirectory(a_file);

                        m_zipBundler.CreateZipBundle(Application.TempDirectory, babylonFile, outputDirectory);
                        success = true;

                    }
                    catch (Exception e)
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

            return success;
        }
    }
}
