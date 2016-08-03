using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EgowallConverter.Converter
{
    class FbxExporter
    {
        public const string ExePath = "/Dependancies/FbxExporter.exe";

        public bool ConvertFbxToBabylon(string a_inputfile, string a_outputDirectory)
        {
            int exitCode = RunConverter(Environment.CurrentDirectory + "\\" + a_inputfile, Environment.CurrentDirectory + "\\" + a_outputDirectory);           
            return exitCode == 0;
        }

        private int RunConverter(string a_inputFile, string a_outputDirectory)
        {
            string arguments = String.Format("{0} {1}", a_inputFile, a_outputDirectory);
            ProcessStartInfo startInfo = new ProcessStartInfo()
            {
                FileName = Environment.CurrentDirectory + ExePath,
                Arguments = arguments,
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
