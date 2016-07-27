using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.IO;
using EgowallConverter.Converter.Converters;

namespace EgowallConverter.Converter
{
    class Application
    {
        enum Mode
        {
            Backgrounds,
            Exit,
            NoMode,
            Furnitures,
            Textures

        }

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

        Mode m_converterMode = Mode.NoMode;

        IConverter m_converter;

        public Application()
        {
            
        }        

        public void Run()
        {
            GetInput();

            if (m_converterMode == Mode.Exit)
            {                
                return;
            }

            if (!Directory.Exists(InputDirectory))
            {
                LogMessage("The input directory does not exist.", ConsoleColor.Red);
                return;
            }

            Console.WriteLine("Started processing all files");
            // Start by clearing temp folder
            CleanTemp();

            m_converter.Run();            

            LogMessage("Finished processing files", ConsoleColor.Green);
            Console.ReadLine();
        }
        /// <summary>
        /// Get user input and set the converter mode
        /// </summary>
        public void GetInput()
        {
            Console.WriteLine("Welcome to Egowall converter. Select the type of conversion:");            

            while (m_converterMode == Mode.NoMode)
            {
                Console.WriteLine("b - Background models");
                Console.WriteLine("f - Furnitures");
                Console.WriteLine("t - Textures");                
                Console.WriteLine("x - Exit");
                Console.Write("Action: ");

                string input = Console.ReadLine();

                switch(input)
                {
                    case "b":
                        m_converterMode = Mode.Backgrounds;
                        m_converter = new FurnitureConverter();
                        break;
                    case "f":
                        m_converterMode = Mode.Furnitures;
                        m_converter = new FurnitureConverter();
                        break;
                    case "t":
                        m_converterMode = Mode.Textures;
                        m_converter = new TextureConverter();
                        break;
                    case "x":
                        m_converterMode = Mode.Exit;
                        break;
                    default:
                        Console.WriteLine("No such action exists. Please write a valid action.");
                        Console.WriteLine();
                        break;
                }
            }
        }        

        /// <summary>
        /// Takes input path and returns output path.
        /// input/folder1/folder2/file.fbx
        /// output/folder1/folder2/file.zip
        /// </summary>
        /// <param name="a_inputFile"></param>
        /// <returns></returns>
        public static string GetOutputDirectory( string a_inputFile)
        {
            string[] paths = a_inputFile.Split('\\');

            string result = "";

            for (int i = 1; i < paths.Length - 1; ++i)
            {
                result += paths[i] + "/";
            }            

            return OutputDirectory + "/" + result;
        }

        /// <summary>
        /// Cleans the temporary directory by removing it
        /// </summary>
        public static void CleanTemp()
        {
            if (Directory.Exists(TempDirectory))
            {
                Directory.Delete(TempDirectory, true);
            }
        }

        public static void LogMessage(string a_message, ConsoleColor a_color)
        {
            Console.ForegroundColor = a_color;
            Console.WriteLine(a_message);
        }


    }
}
