using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ImageMagick;

namespace EgowallConverter.Converter
{
    class TextureCompressor
    {
        public const string AdvPngPath = "/Dependancies/advpng.exe";
        public const string PngQuantPath = "/Dependancies/pngquant.exe";

        private List<string> m_tgaFiles;
        private List<string> m_pngFiles;

        private string m_currentPngFile;
        private string m_currentTgaFile;

        public TextureCompressor()
        {
            m_tgaFiles = new List<string>();
            m_pngFiles = new List<string>();
        }

        /// <summary>
        /// Takes a directory and finds all .tga files.
        /// Converts them to PNG by using ImageMagick.
        /// Then runs pngquant to reduce filesize.
        /// Finally run advcomp to reduce filesize even further.
        /// </summary>
        /// <param name="a_directory"></param>
        public bool CompressImages(string a_directory)
        {
            string[] tgaFiles = Directory.GetFiles(a_directory, "*.tga");           

            foreach (string file in tgaFiles)
            {
                if ( !CompressImage(file, a_directory))
                {
                    Converter.LogMessage("Failed to compress image: " + file, ConsoleColor.Red);
                    return false;
                }
            }

            Cleanup(tgaFiles);

            return true;
        }

        /// <summary>
        /// Deletes the .tga files and other temp .png files if created
        /// </summary>
        public void Cleanup(string[] a_files)
        {
            try
            {
                foreach (string file in a_files)
                {
                    File.Delete(file);
                }
            }
            catch
            {
                Converter.LogMessage("Failed to remove file.", ConsoleColor.Red);
            }
        }

        private bool CompressImage(string a_file, string a_outputDirectory)
        {
            FileInfo fileInfo = new FileInfo(a_file);
            string filename = fileInfo.Name.Substring(0, fileInfo.Name.Length - fileInfo.Extension.Length);

            string output = Environment.CurrentDirectory + "/" + a_outputDirectory + "/" + filename + ".png"; 

            if (!ConvertTgaToPng(a_file, output))
            {
                Converter.LogMessage("Failed to convert .tga to .png for: " + a_file, ConsoleColor.Red);
                return false;
            }

            if (!RunPngQuant(output))
            {
                Converter.LogMessage("PngQuant failed to run for: " + a_file, ConsoleColor.Red);
                return false;
            }
            if (!RunAdvPng(output))
            {
                Converter.LogMessage("AdvPng failed to run for: " + a_file, ConsoleColor.Red);
                return false;
            }

            return true;
        }

        private bool ConvertTgaToPng(string a_file, string a_output)
        {
            try
            {
                // Read from file.
                using (MagickImage image = new MagickImage(a_file))
                {
                    image.Write(a_output);
                }
            }
            catch
            {
                return false;
            }
           

            return true;
        }

        /// <summary>
        /// Runs advpng  (advcomp) to make the bytes in the png more optimized.
        /// </summary>
        /// <param name="a_file"></param>
        /// <param name="a_output"></param>
        /// <returns></returns>
        private bool RunAdvPng(string a_file)
        { 
            string arguments = String.Format("-z -4 -i 20 {0}", a_file);
            int exitCode = RunProcess(AdvPngPath, arguments);
            return exitCode == 0;
        }

        private bool RunPngQuant(string a_file)
        {
            string arguments = String.Format("--force --output {0} {0}", a_file);
            int exitCode = RunProcess(PngQuantPath, arguments);
            return exitCode == 0;
        }

        private int RunProcess(string a_processPath, string a_arguments)
        {
            
            ProcessStartInfo startInfo = new ProcessStartInfo()
            {
                FileName = Environment.CurrentDirectory + a_processPath,
                Arguments = a_arguments,
                CreateNoWindow = true,
                UseShellExecute = false
            };

            int exitCode = -1;

            try
            {
                using (Process process = new Process()
                {
                    StartInfo = startInfo,

                })
                {
                    process.Start();
                    process.WaitForExit();

                    exitCode = process.ExitCode;
                }
            }
            catch
            {
                exitCode = -1;
            }

            return exitCode;
        }
    }
}
