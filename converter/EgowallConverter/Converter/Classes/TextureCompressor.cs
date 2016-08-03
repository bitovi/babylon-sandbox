using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
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

        public TextureCompressor()
        {           
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
                    Application.LogMessage("Failed to compress image: " + file, ConsoleColor.Red);
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
                Application.LogMessage("Failed to remove file.", ConsoleColor.Red);
            }
        }

        /// <summary>
        /// Do stuff! 
        /// </summary>
        /// <param name="a_file"></param>
        /// <param name="a_outputDirectory"></param>
        /// <returns></returns>
        private bool CompressImage(string a_file, string a_outputDirectory)
        {
            FileInfo fileInfo = new FileInfo(a_file);
            string filename = fileInfo.Name.Substring(0, fileInfo.Name.Length - fileInfo.Extension.Length);

            string output = Environment.CurrentDirectory + "/" + a_outputDirectory + "/" + filename + ".png"; 

            if (!ConvertTgaToPng(a_file, output))
            {
                Application.LogMessage("Failed to convert .tga to .png for: " + a_file, ConsoleColor.Red);
                return false;
            }

            if (!RunPngQuant(output))
            {
                Application.LogMessage("PngQuant failed to run for: " + a_file, ConsoleColor.Red);
                return false;
            }
#if DEBUG
            Application.LogMessage("Running AdvPng", ConsoleColor.Cyan);
#endif

            if (!RunAdvPng(output))
            {
                Application.LogMessage("AdvPng failed to run for: " + a_file, ConsoleColor.Red);
                return false;
            }

            return true;
        }        

        /// <summary>
        /// 1. Convert from Tga to Png
        /// 2. Resize by a factor of 2 and minimum of 512x512.  
        /// So 1024x1024 => 512x512
        /// 2048x2048 => 1024x1024
        /// 256x256 => 256x256
        /// </summary>
        /// <param name="a_file"></param>
        /// <param name="a_output"></param>
        /// <returns></returns>
        private bool ConvertTgaToPng(string a_file, string a_output)
        {
            try
            {
                Dictionary<MagickColor, bool> colors = new Dictionary<MagickColor, bool>();
                int colorCount = 0;
                bool needResize = false;
                // Read from file.
                using (MagickImage image = new MagickImage(a_file))
                {
                    if (image.Width > 512 && image.Height > 512)
                    {
                        needResize = true;
                    }

                    image.Write(a_output);
                }

                if (needResize)
                {
#if DEBUG
                    Application.LogMessage("Resizing texture", ConsoleColor.Cyan);
#endif
                    using (MagickImage image = new MagickImage(a_output))
                    {
                        float widthScale = image.Width / 512;
                        float heightScale = image.Height / 512;

                        if (widthScale > heightScale)
                        {
                            widthScale = heightScale;
                        }
                        if (widthScale > 2)
                        {
                            widthScale = 2;
                        }

                        image.Resize((int)(image.Width / widthScale), (int)(image.Height / widthScale));
                        image.Write(a_output);

                    }
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
