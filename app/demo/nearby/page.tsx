"use client";

const places = [
  {
    category: "🍽️ Restaurantes",
    items: [
      { name: "La Cantina del Mar", distance: "150m", rating: "4.8", desc: "Mariscos frescos, vistas al mar", open: true },
      { name: "El Rincón Mexicano", distance: "300m", rating: "4.6", desc: "Comida tradicional mexicana", open: true },
      { name: "Sushi & Co", distance: "500m", rating: "4.4", desc: "Fusión japonesa-mexicana", open: false },
    ],
  },
  {
    category: "🏖️ Playas & Actividades",
    items: [
      { name: "Playa Azul", distance: "200m", rating: "4.9", desc: "Bandera azul, aguas tranquilas", open: true },
      { name: "Tour en lancha", distance: "400m", rating: "4.7", desc: "Paseo 2hrs · $350 MXN/persona", open: true },
      { name: "Snorkel Park", distance: "800m", rating: "4.5", desc: "Equipo incluido, instructor", open: true },
    ],
  },
  {
    category: "🛍️ Tiendas",
    items: [
      { name: "Artesanías del Puerto", distance: "250m", rating: "4.3", desc: "Recuerdos y artesanías locales", open: true },
      { name: "Farmacia Del Ahorro", distance: "350m", rating: "4.1", desc: "24 horas, medicamentos", open: true },
      { name: "Super Chedraui", distance: "1.2km", rating: "4.0", desc: "Supermercado completo", open: true },
    ],
  },
];

export default function NearbyPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-5">
        <div className="text-xl font-semibold">Cerca de ti</div>
        <div className="text-sm text-white/50 mt-1">Lugares recomendados a pasos del hotel</div>
      </div>

      {places.map((cat) => (
        <div key={cat.category}>
          <div className="font-semibold mb-3">{cat.category}</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cat.items.map((item) => (
              <div
                key={item.name}
                className="rounded-[20px] bg-white/[0.05] border border-white/8 p-4 hover:bg-white/8 transition"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                    item.open ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-white/30 border border-white/10"
                  }`}>
                    {item.open ? "Abierto" : "Cerrado"}
                  </div>
                </div>
                <div className="text-xs text-white/50 mb-3">{item.desc}</div>
                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span>📍 {item.distance}</span>
                  <span>⭐ {item.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-[22px] bg-cyan-500/8 border border-cyan-500/15 p-4 text-sm text-cyan-300/80">
        💡 Nuestro concierge puede reservarte taxi o tour. Ve a <strong>Chat IA</strong> y pide ayuda.
      </div>
    </div>
  );
}
