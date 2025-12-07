import { MapPin, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Location {
  id: number;
  name: string;
  category: string;
  imageUrl: string;
  visitCount: number;
}

export default function LocationListPage() {
  const navigate = useNavigate();

  const locations: Location[] = [
    {
      id: 1,
      name: 'Grainger Engineering Library',
      category: 'Library',
      imageUrl: 'https://www.library.illinois.edu/enx/wp-content/uploads/sites/27/2025/06/GraingerExterior-1-e1749483744556.jpg',
      visitCount: 42
    },
    {
      id: 2,
      name: 'Siebel Center for Computer Science',
      category: 'Academic Building',
      imageUrl: 'https://grainger.illinois.edu/_sitemanager/viewphoto.aspx?id=95344&s=1200',
      visitCount: 38
    },
    {
      id: 3,
      name: 'Main Quad',
      category: 'Outdoor Space',
      imageUrl: 'http://fightingillini.com/images/2015/11/10/illinois_campus_quad.jpg',
      visitCount: 25
    },
    {
      id: 4,
      name: 'Activities and Recreation Center (ARC)',
      category: 'Recreation',
      imageUrl: 'https://campusrec.illinois.edu/sites/default/files/styles/hero_image/public/paragraphs/hero/2022-05/ARC.jpg?h=e6b46478&itok=XgfrEVSA',
      visitCount: 31
    },
    {
      id: 5,
      name: 'Illini Union',
      category: 'Student Center',
      imageUrl: 'http://fightingillini.com/images/2015/11/10/illinois_campus_quad.jpg',
      visitCount: 56
    },
    {
      id: 6,
      name: 'Memorial Stadium',
      category: 'Sports Venue',
      imageUrl: 'https://images.unsplash.com/photo-1662318615953-ea4938514ac9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwc3RhZGl1bXxlbnwxfHx8fDE3NjUxMDU0MTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
      visitCount: 12
    },
    {
      id: 7,
      name: 'Ikenberry Dining Center',
      category: 'Dining',
      imageUrl: 'https://images.unsplash.com/photo-1685879226944-30c32b186aa7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FmZXRlcmlhfGVufDF8fHx8MTc2NTA4ODMzNHww&ixlib=rb-4.1.0&q=80&w=1080',
      visitCount: 68
    },
    {
      id: 8,
      name: 'Electrical and Computer Engineering Building',
      category: 'Academic Building',
      imageUrl: 'https://living-future.org/wp-content/uploads/2023/02/North_Side.jpeg_202301051354-1024x558.jpeg',
      visitCount: 29
    },
    {
      id: 9,
      name: 'Japan House',
      category: 'Cultural Center',
      imageUrl: 'https://images.unsplash.com/photo-1659843979793-8b3ffd321e73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1wdXMlMjBnYXJkZW58ZW58MXx8fHwxNzY1MTA1NDEyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      visitCount: 15
    },
    {
      id: 10,
      name: 'Krannert Center for the Performing Arts',
      category: 'Theater',
      imageUrl: 'https://images.unsplash.com/photo-1603647228760-f267ba43bf5a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwdGhlYXRlcnxlbnwxfHx8fDE3NjUxMDU0MTJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      visitCount: 18
    }
  ];

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
                    <span className="text-orange-600 text-2xl">{location.visitCount}</span>
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
