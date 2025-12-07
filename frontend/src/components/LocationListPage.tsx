import { useEffect, useMemo, useState } from 'react';
import { MapPin, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { listBuildingUsage } from '../api/buildings';

interface Location {
  id: number;
  name: string;
  category: string;
  imageUrl: string;
}

export default function LocationListPage() {
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  const [usageMap, setUsageMap] = useState<Record<string, number>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rows = await listBuildingUsage(getAccessTokenSilently);
        if (!mounted) return;
        const map: Record<string, number> = {};
        rows.forEach((r: any) => {
          if (r && r.key) map[r.key] = r.count || 0;
        });
        setUsageMap(map);
      } catch (e) {
        console.warn('Failed to load building usage', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [getAccessTokenSilently]);

  const imageMap: Record<string, string> = {
    'Grainger Engineering Library':
      'https://www.library.illinois.edu/enx/wp-content/uploads/sites/27/2025/06/GraingerExterior-1-e1749483744556.jpg',
    'Siebel Center for Computer Science':
      'https://grainger.illinois.edu/_sitemanager/viewphoto.aspx?id=95344&s=1200',
    'Main Quad': 'http://fightingillini.com/images/2015/11/10/illinois_campus_quad.jpg',
    'Illini Union': 'http://fightingillini.com/images/2015/11/10/illinois_campus_quad.jpg',
    'Electrical and Computer Engineering Building':
      'https://living-future.org/wp-content/uploads/2023/02/North_Side.jpeg_202301051354-1024x558.jpeg',
    'Activities and Recreation Center (ARC)':
      'https://campusrec.illinois.edu/sites/default/files/styles/hero_image/public/paragraphs/hero/2022-05/ARC.jpg?h=e6b46478&itok=XgfrEVSA'
  };

  const makeImage = (name: string) =>
    imageMap[name] ||
    `https://source.unsplash.com/featured/?${encodeURIComponent(name + ' uiuc campus')}`;

  const locations: Location[] = useMemo(() => {
    const names: { name: string; category: string }[] = [
      { name: 'Grainger Engineering Library', category: 'Library' },
      { name: 'Siebel Center for Computer Science', category: 'Academic Building' },
      { name: 'Main Quad', category: 'Outdoor Space' },
      { name: 'Activities and Recreation Center (ARC)', category: 'Recreation' },
      { name: 'Illini Union', category: 'Student Center' },
      { name: 'Memorial Stadium', category: 'Sports Venue' },
      { name: 'Ikenberry Dining Center', category: 'Dining' },
      { name: 'Electrical and Computer Engineering Building', category: 'Academic Building' },
      { name: 'Japan House', category: 'Cultural Center' },
      { name: 'Krannert Center for the Performing Arts', category: 'Theater' },
      { name: 'Beckman Institute for Advanced Science and Technology', category: 'Research' },
      { name: 'National Center for Supercomputing Applications (NCSA)', category: 'Research' },
      { name: 'Coordinated Science Laboratory (CSL)', category: 'Research' },
      { name: 'Engineering Hall', category: 'Academic Building' },
      { name: 'Talbot Laboratory', category: 'Academic Building' },
      { name: 'Bardeen Quadrangle', category: 'Outdoor Space' },
      { name: 'Everitt Laboratory', category: 'Academic Building' },
      { name: 'Campus Instructional Facility (CIF)', category: 'Academic Building' },
      { name: 'Digital Computer Laboratory', category: 'Academic Building' },
      { name: 'HMNTL', category: 'Research' },
      { name: 'Civil and Environmental Engineering Building', category: 'Academic Building' },
      { name: 'Newmark Civil Engineering Laboratory', category: 'Academic Building' },
      { name: 'Transportation Building', category: 'Academic Building' },
      { name: 'Ceramics Building', category: 'Academic Building' },
      { name: 'Engineering Sciences Building (ESB)', category: 'Academic Building' },
      { name: 'Engineering Student Projects Laboratory (ESPL)', category: 'Maker Space' },
      { name: 'Loomis Laboratory', category: 'Academic Building' },
      { name: 'Sidney Lu Mechanical Engineering Building', category: 'Academic Building' },
      { name: 'Materials Science and Engineering Building', category: 'Academic Building' },
      { name: 'Campus Recreation Center East (CRCE)', category: 'Recreation' },
      { name: 'Foellinger Auditorium', category: 'Lecture Hall' },
      { name: 'Altgeld Hall', category: 'Academic Building' },
      { name: 'Lincoln Hall', category: 'Academic Building' },
      { name: 'Gregory Hall', category: 'Academic Building' },
      { name: 'Business Instructional Facility (BIF)', category: 'Academic Building' },
      { name: 'Education Building', category: 'Academic Building' },
      { name: 'Armory', category: 'Academic Building' },
      { name: 'Law Building', category: 'Academic Building' },
      { name: 'ACES Library', category: 'Library' },
      { name: 'Turner Hall', category: 'Academic Building' },
      { name: 'Smith Memorial Hall', category: 'Music' },
      { name: 'Krannert Art Museum', category: 'Museum' },
      { name: 'Spurlock Museum', category: 'Museum' },
      { name: 'Huff Hall', category: 'Athletics' },
      { name: 'Activities and Recreation Center Fields', category: 'Recreation' },
      { name: 'Research Park', category: 'Research' },
      { name: 'Veterinary Medicine Basic Sciences Building', category: 'Academic Building' },
      { name: 'Illini Grove', category: 'Outdoor Space' },
      { name: 'South Quad', category: 'Outdoor Space' },
      { name: 'North Quad', category: 'Outdoor Space' },
      { name: 'Library (Main Library)', category: 'Library' },
      { name: 'ISR Dining', category: 'Dining' },
      { name: 'PAR Dining Hall', category: 'Dining' },
      { name: 'FAR Dining Hall', category: 'Dining' }
    ];

    return names.map((item, idx) => ({
      id: idx + 1,
      name: item.name,
      category: item.category,
      imageUrl: makeImage(item.name)
    }));
  }, []);

  const displayCount = (name: string) => {
    const key = name.toLowerCase();
    const stored = usageMap[key] || 0;
    return stored + 1; // default baseline count is 1
  };

  return (
    <div className="illini-cute w-full min-h-screen bg-gradient-to-br from-[#13294B] via-[#1f3d63] to-[#E84A27] py-12 px-6">
      <div className="max-w-7xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl px-8 py-10 border border-white/50 text-[#13294B]">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-[#13294B] mb-2">UIUC Campus Locations</h1>
            <p className="text-[#1f3d63]">Explore popular locations on campus</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#13294B] text-white shadow hover:shadow-lg transition-shadow border border-[#0f2140] text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to planner
          </button>
        </div>

        {/* Location Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => (
            <div
              key={location.id}
              className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer border border-orange-100"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={location.imageUrl}
                  alt={location.name}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-[#13294B]/90 text-white backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-sm">{location.category}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-orange-500 mt-1 shrink-0" />
                  <h3 className="text-gray-900 leading-tight">{location.name}</h3>
                </div>

                {/* Visit Count */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-[#1f3d63] text-sm">Visited</span>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-600 text-2xl">{displayCount(location.name)}</span>
                    <span className="text-[#1f3d63] text-sm">times</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
