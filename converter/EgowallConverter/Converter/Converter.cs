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

        public Converter()
        {
            m_fbxExporter = new FbxExporter();
        }

        public void Run()
        {
            if (!Directory.Exists(InputDirectory))
            {
                LogMessage("The input directory does not exist.", ConsoleColor.Red);
                return;
            }
            
            HandleDirectory(InputDirectory);                     
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

            string[] directories = Directory.GetDirectories(InputDirectory);

            foreach(string directory in directories)
            {
                HandleDirectory(directory);
            }

            LogMessage("Directory " + a_directoryPath + " is finished being processed.", ConsoleColor.Gray);
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
                    Console.WriteLine("Succesfully processed" + file, ConsoleColor.Gray);
                }
                else
                {
                    Console.WriteLine("Failed to process" + file, ConsoleColor.Red);
                }
            }
        }

        public bool ProcessFile(string a_file)
        {
            m_fbxExporter.ConvertFbxToBabylon(a_file, TempDirectory);
            return false;
        }

        public void LogMessage(string a_message, ConsoleColor a_color)
        {
            Console.ForegroundColor = a_color;
            Console.WriteLine(a_message);
        }

    }
}
