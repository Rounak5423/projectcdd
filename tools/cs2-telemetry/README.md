# Cities: Skylines II — GENESIS Telemetry Companion Mod

This mod samples Cities: Skylines II simulation entities (citizens, trips, accidents, and city metrics) every $N$ ticks and streams newline-delimited JSON matching the GENESIS Engine telemetry schema, with an explicit attribute `"source": "cs2"`.

---

## Prerequisites
1. .NET 6.0 SDK or .NET 7.0 SDK (`dotnet --version`)
2. Cities: Skylines II installed on Steam or Xbox Game Pass
3. Path to the game managed assemblies (e.g. `steamapps/common/Cities Skylines II/Cities2_Data/Managed/`)

---

## Build Instructions

Set the `CS2_MANAGED_DIR` environment variable to your game installation managed directory, then compile:

```bash
export CS2_MANAGED_DIR="C:\Program Files (x86)\Steam\steamapps\common\Cities Skylines II\Cities2_Data\Managed"
dotnet build -c Release
```

The compiled binary `GENESIS.CS2Telemetry.dll` will be placed in `bin/Release/netstandard2.1/`.

---

## Installation

1. Copy `GENESIS.CS2Telemetry.dll` into your Cities: Skylines II local mods directory:
   - Windows: `%AppData%\..\LocalLow\Colossal Order\Cities Skylines II\Mods\`
2. Launch Cities: Skylines II and enable the mod under the **Playsets / Mods** menu.
3. Output telemetry files are written asynchronously to:
   `%USERPROFILE%\Documents\GENESIS_Telemetry\CS2_Exports\cs2_telemetry_<timestamp>.jsonl`

---

## Schema & Isolation Contract

All exported records adhere to the GENESIS Engine schema with an immutable `"source": "cs2"` identifier. Under no circumstances is CS2 data mingled silently with internal GENESIS telemetry.
