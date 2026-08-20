(() => {
  const dl = window.DesignLanguage;
  dl?.wireReveals(".dl-reveal");

  async function loadOverviewStats() {
    const els = {
      venues: document.getElementById("dash-stat-venues"),
      provinces: document.getElementById("dash-stat-provinces"),
      sports: document.getElementById("dash-stat-sports"),
      indoor: document.getElementById("dash-stat-indoor"),
    };
    if (!els.venues) return;
    try {
      const res = await fetch("assets/data/national-sports-map.json");
      if (!res.ok) throw new Error("map load failed");
      const data = await res.json();
      const rows = data.venues || [];
      const provinces = new Set();
      const sports = new Set();
      let indoor = 0;
      rows.forEach((row) => {
        const province = Array.isArray(row) ? row[3] : row.province;
        const sport = Array.isArray(row) ? row[4] : row.sport;
        const env = Array.isArray(row) ? row[5] : row.env;
        if (province) provinces.add(province);
        if (sport) sports.add(sport);
        if (env === "indoor") indoor += 1;
      });
      dl?.animateCount(els.venues, rows.length);
      dl?.animateCount(els.provinces, provinces.size);
      dl?.animateCount(els.sports, sports.size);
      dl?.animateCount(els.indoor, indoor);
    } catch (err) {
      console.error(err);
      els.venues.textContent = "—";
      els.provinces.textContent = "—";
      els.sports.textContent = "—";
      els.indoor.textContent = "—";
    }
  }

  loadOverviewStats();
})();
