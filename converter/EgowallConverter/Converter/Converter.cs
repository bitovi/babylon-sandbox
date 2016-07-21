using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.IO;

namespace EgowallConverter.Converter
{
    class Converter
    {
        /// <summary>
        ///  The input directory where all the files are to be processed
        /// </summary>
        public static string InputDirectory = "input";
        /// <summary>
        /// Where the files go while being processed
        /// For example fbx exporter takes input,  places the files in temp folder.
        /// Then the .babylon file is handled by precision reduction & materialId manipulation.
        /// Then zipping the files
        /// </summary>
        public static string TempDirectory = "temp";
        /// <summary>
        /// The output directory, mimicks the input file structure with the exception of textures 
        /// </summary>
        public static string OutputDirectory = "output";

        FbxExporter m_fbxExporter;
        BabylonHandler m_babylonHandler;
        TextureCompressor m_textureCompressor = new TextureCompressor();
        ZipBundler m_zipBundler;

        public Converter()
        {
            m_fbxExporter = new FbxExporter();
            m_babylonHandler = new BabylonHandler();
            m_zipBundler = new ZipBundler();
        }

        public void Run()
        {
            if (!Directory.Exists(InputDirectory))
            {
                LogMessage("The input directory does not exist.", ConsoleColor.Red);
                return;
            }

            Console.WriteLine("Started processing all files");           
            
            HandleDirectory(InputDirectory);

            LogMessage("Finished processing files", ConsoleColor.Green);                
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

            LogMessage("Directory '" + a_directoryPath + "' is finished being processed.", ConsoleColor.Gray);
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
                    LogMessage("Succesfully processed " + file, ConsoleColor.Gray);
                }
                else
                {
                    LogMessage("Failed to process " + file, ConsoleColor.Red);
                }
            }           
        }

        public bool ProcessFile(string a_file)
        {   
            bool fbxResult = m_fbxExporter.ConvertFbxToBabylon(a_file, TempDirectory);

            if (fbxResult)
            {
                // Files exist now
                string[] tempFiles = Directory.GetFiles(TempDirectory, "*.babylon");

                if (tempFiles.Length == 1)
                {
                    string babylonFile = tempFiles[0];

                    m_babylonHandler.FixPrecision(babylonFile);

                    m_babylonHandler.ChangeMaterialId(babylonFile);

                    m_textureCompressor.CompressImages(TempDirectory);

                    string outputDirectory = GetOutputDirectory(a_file);
                    m_zipBundler.CreateZipBundle(TempDirectory, babylonFile, outputDirectory);

                    CleanTemp(a_file);

                    return true;
                }
                else
                {
                    LogMessage("No babylon file found in temp folder", ConsoleColor.Red);
                }
            }
            else
            {
                LogMessage("Failed to process: '" + a_file + "'", ConsoleColor.Red);
            }

            return false;
        }

        private string GetOutputDirectory( string a_inputFile)
        {
            string[] paths = a_inputFile.Split('\\');

            string result = "";

            for (int i = 1; i < paths.Length - 1; ++i)
            {
                result = paths[i] + "/";
            }            

            return OutputDirectory + "/" + result;
        }
       
        private void CleanTemp(string a_inputFile)
        {
            Directory.Delete(TempDirectory, true);
        }

        public static void LogMessage(string a_message, ConsoleColor a_color)
        {
            Console.ForegroundColor = a_color;
            Console.WriteLine(a_message);
        }


    }
}
