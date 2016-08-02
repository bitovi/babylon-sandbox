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
            Converter.Application converter = new EgowallConverter.Converter.Application();
            converter.Run();            
        }
    }
}
