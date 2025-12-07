interface RecommendedSpot {
  title: string;
  subtitle: string;
  activity: string;
  image: string;
}

const recommended: RecommendedSpot[] = [
  {
    title: 'Debugging And Sleeping in Lab',
    subtitle: 'ECEB 3026 • 2AM-6AM',
    activity: 'Debugging code in ECEB 3026',
    image: 'https://ws.engr.illinois.edu/mediarooms/viewphoto.aspx?id=1369&s=400',
  },
  {
    title: 'I can\'t solve it in O(n) time... ',
    subtitle: 'Grainger Library 4th Floor',
    activity: 'Doing algorithm homework',
    image: 'https://i.redd.it/3mvqg4mtyjjx.jpg',
  },
  {
    title: 'Do you like Phys225?',
    subtitle: 'Loomis Lab • Study lounge',
    activity: 'Studying physics in Loomis',
    image: 'https://grainger.illinois.edu/_sitemanager/viewphoto.aspx?id=95334&s=1200',
  },
];

export function RecommendedSpots() {
  return (
    <div className="mt-10 text-left">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-800">Recommended spots today</h4>
        <span className="text-sm text-orange-600 font-medium">Illini favorites</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommended.map((card) => (
          <div
            key={card.title}
            className="rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden bg-gradient-to-b from-white to-orange-50/60"
          >
            <div className="h-32 overflow-hidden">
              <img src={card.image} alt={card.activity} className="w-full h-full object-cover" />
            </div>
            <div className="p-4 space-y-1">
              <p className="text-xs uppercase tracking-wide text-orange-600 font-semibold">{card.subtitle}</p>
              <h5 className="text-base font-semibold text-gray-900">{card.activity}</h5>
              <p className="text-sm text-gray-600">{card.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
