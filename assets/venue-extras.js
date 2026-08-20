(() => {
  const IMG_BASE = "https://api.sports-almanac.go.th";
  const SHARD_COUNT = 40;
  let covers = null;
  const shardCache = new Map();

  function absUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return IMG_BASE + (path.startsWith("/") ? path : `/${path}`);
  }

  async function loadCovers() {
    if (covers) return covers;
    try {
      const res = await fetch("assets/data/venue-covers.json");
      covers = res.ok ? await res.json() : {};
    } catch {
      covers = {};
    }
    return covers;
  }

  function coverFor(id, fallback = "") {
    const path = covers?.[String(id)];
    return path ? absUrl(path) : fallback;
  }

  async function loadDetail(id) {
    if (id == null || id === "") return null;
    const num = Number(id);
    if (!Number.isFinite(num)) return null;
    const shard = ((num % SHARD_COUNT) + SHARD_COUNT) % SHARD_COUNT;
    if (!shardCache.has(shard)) {
      try {
        const res = await fetch(`assets/data/venue-shards/${shard}.json`);
        shardCache.set(shard, res.ok ? await res.json() : {});
      } catch {
        shardCache.set(shard, {});
      }
    }
    return shardCache.get(shard)[String(num)] || null;
  }

  function almanacUrl(id) {
    if (!id) return "https://sports-almanac.go.th/stadium/";
    return `https://sports-almanac.go.th/stadium/?p=stadium_detail&stadium_id=${id}`;
  }

  function detailHref(venue = {}) {
    const params = new URLSearchParams();
    const id = venue.id ?? venue[6];
    if (id != null && id !== "") {
      params.set("id", String(id));
    } else {
      const lat = venue.lat ?? venue[0];
      const lon = venue.lon ?? venue[1];
      if (lat != null) params.set("lat", String(lat));
      if (lon != null) params.set("lon", String(lon));
    }
    const name = venue.name ?? venue[2];
    const province = venue.province ?? venue[3];
    const sport = venue.sport ?? venue[4];
    const env = venue.env ?? venue[5];
    const type = venue.type;
    if (name) params.set("name", String(name));
    if (province) params.set("province", String(province));
    if (sport) params.set("sport", String(sport));
    if (env) params.set("env", String(env));
    if (type) params.set("type", String(type));
    return `venue.html?${params.toString()}`;
  }

  window.VenueExtras = { loadCovers, coverFor, loadDetail, absUrl, almanacUrl, detailHref };
})();
