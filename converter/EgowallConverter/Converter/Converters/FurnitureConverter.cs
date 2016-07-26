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
        TextureCompressor m_textureCompressor;
        ZipBundler m_zipBundler;

        public FurnitureConverter()
        {
            m_fbxExporter = new FbxExporter();
            m_babylonHandler = new BabylonHandler();
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
            string[] files = Directory.GetFiles(a_directoryPath, "*.fbx");            
            
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
            bool fbxResult = m_fbxExporter.ConvertFbxToBabylon(a_file, Application.TempDirectory);

            if (fbxResult)
            {
                // Files exist now
                string[] tempFiles = Directory.GetFiles(Application.TempDirectory, "*.babylon");

                if (tempFiles.Length == 1)
                {
                    string babylonFile = tempFiles[0];

                    m_babylonHandler.FixPrecision(babylonFile);

                    m_babylonHandler.ChangeMaterialId(babylonFile);

                    m_babylonHandler.AddMeshIdTags(babylonFile);

                    m_textureCompressor.CompressImages(Application.TempDirectory);

                    string outputDirectory = Application.GetOutputDirectory(a_file);


                    m_zipBundler.CreateZipBundle(Application.TempDirectory, babylonFile, outputDirectory);

                    Application.CleanTemp();

                    return true;
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

            return false;
        }
    }
}
