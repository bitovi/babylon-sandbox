using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EgowallConverter.Converter
{
    class FbxFileMerger
    {
        public const string ExePath = "/Dependancies/FbxRerouteSkeleton.exe";

        private Dictionary<string, bool> m_mergedFiles;
        private List<string> m_autoAdd;

        public string MergedFile { get; set; }

        public FbxFileMerger()
        {
            m_mergedFiles = new Dictionary<string, bool>();
            m_autoAdd = new List<string>();
        }

        /// <summary>
        /// Clean up the tempmerge directory
        /// </summary>
        public void Cleanup()
        {
            if (Directory.Exists( Application.TempMergeDirectory))
            {
                Directory.Delete(Application.TempMergeDirectory, true);
            }
        }

        /// <summary>
        /// Copies all *.tga textures
        /// </summary>
        /// <param name="a_file"></param>
        /// <param name="a_targetDirectory"></param>
        public void CopyTextures( string a_file, string a_targetDirectory )
        {
            string directory = Path.GetDirectoryName(a_file) + "/Resources";

            if (Directory.Exists(directory))
            {
                string[] textures = Directory.GetFiles(directory, "*.tga");

                a_targetDirectory += "/Resources";
                if (!Directory.Exists(a_targetDirectory))
                {
                    Directory.CreateDirectory(a_targetDirectory);
                }

                foreach (string texture in textures)
                {
                    FileInfo info = new FileInfo(texture);
                    File.Copy(texture, a_targetDirectory + "/" + info.Name, true);
                }
            }
        }

        /// <summary>
        /// If the file has already been processed (merged) 
        /// </summary>
        /// <param name="a_file"></param>
        /// <returns></returns>
        public bool IsProcessed( string a_file)
        {
            return m_mergedFiles.ContainsKey(a_file);
        }

        /// <summary>
        /// Process the file by first checking for merge candidates
        /// </summary>        
        /// <returns>
        /// True if can continue exporting
        /// False if it should not continue exporting the fbx
        /// </returns>
        public bool ProcessFile( string a_file, string a_targetDirectory)
        {
            MergedFile = a_file;

            m_mergedFiles.Add(a_file, true);

            List<string> candidates = FindCandidates(a_file);
            // If there are possible merge candidates
            if ( candidates.Count != 0 || m_autoAdd.Count != 0)
            {
                // Start by removing the tempmerge directory
                Cleanup();

                Application.LogMessage("Current: " + MergedFile, ConsoleColor.Magenta);
                Console.ForegroundColor = ConsoleColor.Gray;
                PrintCandidates(candidates);
                PrintActions();

                string action = Console.ReadLine();
                // If auto adding then do that!
                if (action.StartsWith("a"))
                {
                    AddToAuto(action, candidates);             
                }
                else if (action.StartsWith( "x"))
                {                    
                }
                else
                {
                    List<string> mergeItems = GetMergeItems(action, candidates);
                    mergeItems.AddRange(m_autoAdd);
                    mergeItems.Add(MergedFile);
                    // Sort alphabethically
                    mergeItems.Sort();

                    // Check that there are more than 1 item to merge
                    if (mergeItems.Count > 1)
                    {
                        if (!Directory.Exists( a_targetDirectory))
                        {
                            Directory.CreateDirectory(a_targetDirectory);
                        }
                        int exitCode = RunFbxRerouteSkeleton(mergeItems, a_targetDirectory);



                        return exitCode == 0;                        
                    }
                    // If there's only 1 item to merge then just let the normal fbxexporter do it
                    else
                    {
                        return true;
                    }                    
                }
            }
            // If there is only the file then let the normal fbx exporter use that file
            else
            {
                return true;
            }

            return false;
        }

        public void ResetAutoMerge()
        {
            m_autoAdd.Clear();
        }

        public int RunFbxRerouteSkeleton(List<string> a_items, string a_targetDirectory)
        {
            // To get the output filename 
            FileInfo fileInfo = new FileInfo(MergedFile);

            string arguments = "";

            foreach (string item in a_items)
            {
                arguments += String.Format("/m:\"{0}\\{1}\" ", Environment.CurrentDirectory, item);
            }

            //arguments += String.Format("/a:\"{0}\\{1}\" ", Environment.CurrentDirectory, MergedFile);
            arguments += "/a:\"idontexist.fbx\" ";

            MergedFile = a_targetDirectory + "\\" + fileInfo.Name;
            string output = String.Format("/o:\"{0}\\{1}\"", Environment.CurrentDirectory, MergedFile);
            arguments += output;

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
                // Since the converter doesn't give errors check that file really is created
                if (!File.Exists(MergedFile))
                {
                    exitCode = -1;
                }

            }
            catch
            {
                exitCode = -1;
            }

            return exitCode;            
        }

        private void AddToAuto(string a_action, List<string> a_candidates)
        {
            if (a_action.Length > 1)
            {
                var files = GetMergeItems(a_action, a_candidates);

                foreach (string file in files)
                {
                    m_autoAdd.Add(file);
                    if (!m_mergedFiles.ContainsKey( file))
                    {
                        m_mergedFiles.Add(file, true);
                    }                    
                }
            }            

            m_autoAdd.Add(MergedFile);
        }


        private List<string> FindCandidates(string a_file)
        {
            string[] files = Directory.GetFiles(Path.GetDirectoryName(a_file), "*.fbx");
            // 1. File isn't the same 
            // 2. Auto add list doesn't include the file
            // 3. It has not been already merged
            return files.Where(x => x != a_file &&
                                    !m_autoAdd.Contains(x) &&
                                    !m_mergedFiles.ContainsKey(x)).ToList(); ;
        }

        /// <summary>
        /// From user input get all indices and return the candidates with those indices
        /// </summary>
        /// <param name="a_value"></param>
        /// <param name="a_candidates"></param>
        /// <returns></returns>
        private List<string> GetMergeItems(string a_value, List<string> a_candidates)
        {
            List<string> result = new List<string>();

            string[] values = a_value.Split(' ');
           
            HashSet<int> addedIndices = new HashSet<int>();
            
            foreach (string value in values)
            {
                int index;

                if (int.TryParse(value, out index))
                {
                    // Check it's within bounds
                    if (index >= 0 && index < a_candidates.Count && !addedIndices.Contains(index))
                    {
                        result.Add(a_candidates[index]);
                        addedIndices.Add(index);
                    }
                }
            }            

            return result;
        }

        /// <summary>
        /// Print merge candidates
        /// </summary>
        /// <param name="a_candidates"></param>
        private void PrintCandidates(List<string> a_candidates)
        {
            if (a_candidates.Count > 0)
            {                
                for (int i = 0; i < a_candidates.Count; i++)
                {
                    Console.WriteLine(String.Format("{0}: {1}", i, a_candidates[i]));
                }
            }
        }

        private void PrintActions()
        {
            Console.WriteLine();           
            // Set the color back            
            Console.WriteLine("Available actions: ");
            Console.WriteLine("'a' - Merge mesh with all other meshes in this folder.");
            Console.WriteLine("'m' - The indices to merge with. Can be empty.");
            Console.WriteLine("'x' - Skip merging this mesh or add to auto merge list");
        }


    }
}
