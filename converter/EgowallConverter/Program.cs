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
            //string number = "2.2204460492503131e-16";
            //decimal dec = decimal.Parse(number, System.Globalization.NumberStyles.Float);

            Converter.Converter converter = new EgowallConverter.Converter.Converter();
            converter.Run();

            Console.ReadLine();
        }
    }
}
