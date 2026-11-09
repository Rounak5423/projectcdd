using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Collections.Concurrent;
using Unity.Entities;
using Unity.Collections;
using Unity.Mathematics;
using Game;
using Game.Modding;
using Game.Citizens;
using Game.Pathfind;
using Game.Events;
using Game.City;
using Game.Simulation;

namespace GENESIS.CS2Telemetry
{
    public class CS2TelemetryMod : IMod
    {
        public void OnLoad(UpdateSystem updateSystem)
        {
            updateSystem.UpdateAt<CS2TelemetrySystem>(SystemUpdatePhase.GameSimulation);
            UnityEngine.Debug.Log("[GENESIS] Cities: Skylines II Telemetry Mod Loaded Successfully.");
        }

        public void OnDispose()
        {
            UnityEngine.Debug.Log("[GENESIS] Telemetry Mod Disposed.");
        }
    }

    public partial class CS2TelemetrySystem : GameSystemBase
    {
        private SimulationSystem? m_SimulationSystem;
        private EntityQuery m_CitizenQuery;
        private EntityQuery m_IncidentQuery;
        private string m_OutputDirectory = "";
        private readonly ConcurrentQueue<string> m_LogQueue = new ConcurrentQueue<string>();
        private const uint SAMPLING_INTERVAL_FRAMES = 512; // Every ~1 sim-hour

        protected override void OnCreate()
        {
            base.OnCreate();
            m_SimulationSystem = World.GetOrCreateSystemManaged<SimulationSystem>();
            m_CitizenQuery = GetEntityQuery(
                ComponentType.ReadOnly<Citizen>(),
                ComponentType.ReadOnly<HouseholdMember>(),
                ComponentType.ReadOnly<TravelPurpose>()
            );
            m_IncidentQuery = GetEntityQuery(
                ComponentType.ReadOnly<AccidentSite>()
            );

            string userDoc = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
            m_OutputDirectory = Path.Combine(userDoc, "GENESIS_Telemetry", "CS2_Exports");
            Directory.CreateDirectory(m_OutputDirectory);

            Task.Run(BackgroundWriterLoop);
        }

        protected override void OnUpdate()
        {
            if (m_SimulationSystem == null) return;
            uint frame = m_SimulationSystem.frameIndex;
            if (frame % SAMPLING_INTERVAL_FRAMES != 0) return;

            // Sample citizens
            using (var entities = m_CitizenQuery.ToEntityArray(Allocator.TempJob))
            using (var citizens = m_CitizenQuery.ToComponentDataArray<Citizen>(Allocator.TempJob))
            using (var purposes = m_CitizenQuery.ToComponentDataArray<TravelPurpose>(Allocator.TempJob))
            {
                int sampleCount = Math.Min(entities.Length, 100);
                for (int i = 0; i < sampleCount; i++)
                {
                    var cit = citizens[i];
                    var purp = purposes[i];

                    string line = $"{{\"source\":\"cs2\",\"tick\":{frame},\"id\":\"cs2_{entities[i].Index}\"," +
                                  $"\"age\":{cit.m_BirthDay},\"health\":{cit.m_Health / 100.0f:F2}," +
                                  $"\"education\":{cit.m_EducationLevel},\"activity\":\"{purp.m_Purpose}\"}}";
                    m_LogQueue.Enqueue(line);
                }
            }
        }

        private async Task BackgroundWriterLoop()
        {
            string outPath = Path.Combine(m_OutputDirectory, $"cs2_telemetry_{DateTime.UtcNow:yyyyMMdd_HHmmss}.jsonl");
            using var writer = new StreamWriter(outPath, true, Encoding.UTF8);

            while (true)
            {
                while (m_LogQueue.TryDequeue(out var line))
                {
                    await writer.WriteLineAsync(line);
                }
                await writer.FlushAsync();
                await Task.Delay(250);
            }
        }
    }
}
