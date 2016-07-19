using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EgowallConverter
{
    class Program
    {
        static void Main(string[] args)
        {
            Converter.Converter converter = new EgowallConverter.Converter.Converter();
            converter.Run();

            Console.ReadLine();
        }
    }
}
