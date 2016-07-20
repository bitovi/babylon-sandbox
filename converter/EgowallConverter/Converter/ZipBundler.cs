using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EgowallConverter.Converter
{
    class ZipBundler
    {
        /// <summary>
        /// Takes a folder and put all files in a zip archive.
        /// </summary>
        /// <param name="a_folder"></param>
        public void CreateZipBundle(string a_folder, string a_babylonFile, string a_outputDirectory)
        {            
            FileInfo fileInfo = new FileInfo(a_babylonFile);

            string filename = fileInfo.Name.Substring(0, fileInfo.Name.Length - fileInfo.Extension.Length);
            string outputName = a_outputDirectory + filename + ".zip";            
            
            if (!Directory.Exists(a_outputDirectory))
            {
                Directory.CreateDirectory(a_outputDirectory);
            }

            if (File.Exists( outputName))
            {
                File.Delete(outputName);
            }

            ZipFile.CreateFromDirectory(a_folder, outputName, CompressionLevel.Optimal, false);
        }
    }
}
