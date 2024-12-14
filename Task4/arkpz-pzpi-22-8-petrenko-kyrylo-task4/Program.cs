using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace IoT_Device
{
    internal class Program
    {
        const string conn = "https://logical-honor-423508-g5.ew.r.appspot.com";
        const string configFilePath = "credentials.cfg";

        static async Task Main(string[] args)
        {
            string id;
            string jwt;
            Console.Title ="IoT device";

            if (File.Exists(configFilePath))
            {
                var configFileContent = File.ReadAllText(configFilePath);
                var savedConfig = JsonConvert.DeserializeObject<DeviceCredentials>(configFileContent);
                id = savedConfig?.Id ?? string.Empty;
                jwt = savedConfig?.Jwt ?? string.Empty;
            }
            else
            {
                id = string.Empty;
                jwt = string.Empty;
            }

            while (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(jwt) || !await VerifyDevice(id, jwt))
            {
                Console.Write("Введiть id пристрою: ");
                id = Console.ReadLine();
                Console.Write("Введiть JWT для початку роботи: ");
                jwt = Console.ReadLine();
            }

            Console.WriteLine("Починаeмо вимiрювання...");
            var credentials = new DeviceCredentials { Id = id, Jwt = jwt };
            File.WriteAllText(configFilePath, JsonConvert.SerializeObject(credentials));

            var (measurementInterval, normalRange) = await GetDeviceConfiguration(id, jwt);

            while (true)
            {
                var conditions = MeasureConditions(normalRange);
                Console.WriteLine($"Температура: {conditions.Temperature}");
                Console.WriteLine($"Вологiсть: {conditions.Humidity}");
                var newConfig = await SendConditions(id, jwt, conditions);
                if (newConfig != null && (
                    newConfig.MeasurementInterval != measurementInterval ||
                    newConfig.NormalRange.Temperature.Min != normalRange.Temperature.Min ||
                    newConfig.NormalRange.Temperature.Max != normalRange.Temperature.Max ||
                    newConfig.NormalRange.Humidity.Min != normalRange.Humidity.Min ||
                    newConfig.NormalRange.Humidity.Max != normalRange.Humidity.Max
                )){
                    measurementInterval = newConfig.MeasurementInterval;
                    normalRange = newConfig.NormalRange;

                    Console.WriteLine("Оновлено конфiгурацiю:");
                    Console.WriteLine($"Новий iнтервал вимiрювань: {measurementInterval} с");
                    Console.WriteLine($"Новий нормальний дiапазон: Температура ({normalRange.Temperature.Min}-{normalRange.Temperature.Max}), Вологiсть ({normalRange.Humidity.Min}-{normalRange.Humidity.Max})");
                }

                Thread.Sleep(measurementInterval * 1000);
            }
        }

        static async Task<bool> VerifyDevice(string id, string jwt)
        {
            using var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwt);

            try
            {
                var response = await client.GetAsync($"{conn}/admin/iot-devices/{id}/config");
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine("Невдала перевiрка пристрою. Спробуйте ще раз.");
                    Console.WriteLine(await response.Content.ReadAsStringAsync());
                    return false;
                }

                Console.WriteLine("Перевiрка пристрою успiшна.");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Помилка пiд час перевiрки: {ex.Message}");
                return false;
            }
        }

        static async Task<(int measurementInterval, NormalRange normalRange)> GetDeviceConfiguration(string id, string jwt)
        {
            using var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwt);

            var response = await client.GetAsync($"{conn}/admin/iot-devices/{id}/config");
            if (!response.IsSuccessStatusCode)
            {
                throw new Exception("Не вдалося отримати конфiгурацiю пристрою.");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var config = JsonConvert.DeserializeObject<DeviceConfig>(responseContent);

            return (config.MeasurementInterval, config.NormalRange);
        }

        static Conditions MeasureConditions(NormalRange normalRange)
        {
            var random = new Random();

            int GetRandomInRange(double min, double max) =>
                (int)(min + (max - min) * random.NextDouble());

            var tempDeviation = (normalRange.Temperature.Max - normalRange.Temperature.Min) * 0.05;
            var humidityDeviation = (normalRange.Humidity.Max - normalRange.Humidity.Min) * 0.05;

            return new Conditions
            {
                Temperature = GetRandomInRange(normalRange.Temperature.Min - tempDeviation, normalRange.Temperature.Max + tempDeviation),
                Humidity = GetRandomInRange(normalRange.Humidity.Min - humidityDeviation, normalRange.Humidity.Max + humidityDeviation)
            };
        }

        static async Task<DeviceConfig?> SendConditions(string id, string jwt, Conditions conditions)
        {
            using var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwt);

            var payload = JsonConvert.SerializeObject(conditions);
            var content = new StringContent(payload, Encoding.UTF8, "application/json");

            var response = await client.PostAsync($"{conn}/admin/iot-devices/{id}/report", content);

            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<DeviceConfig>(responseContent);
            }
            else
            {
                Console.WriteLine("Помилка пiд час вiдправлення даних.");
                return null;
            }
        }
    }

    class Conditions
    {
        public int Humidity { get; set; }
        public int Temperature { get; set; }
    }

    class NormalRange
    {
        public Range Temperature { get; set; }
        public Range Humidity { get; set; }
    }

    class Range
    {
        public double Min { get; set; }
        public double Max { get; set; }
    }

    class DeviceConfig
    {
        public int MeasurementInterval { get; set; }
        public NormalRange NormalRange { get; set; }
    }

    class DeviceCredentials
    {
        public string Id { get; set; }
        public string Jwt { get; set; }
    }
}
