import React, { useState } from 'react';
import { Search, MapPin, ExternalLink, Star, Store, Navigation } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

interface Place {
  id: string;
  name: string;
  address: string;
  rating: number;
  distance: string;
  type: string;
}

const MarketExplorerPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);

    // Simulate search results
    setTimeout(() => {
      setPlaces([
        {
          id: '1',
          name: 'City Bike Parts Store',
          address: '123 Main Street, Bangalore',
          rating: 4.5,
          distance: '2.3 km',
          type: 'Spare Parts'
        },
        {
          id: '2',
          name: 'AutoZone Service Center',
          address: '456 Market Road, Bangalore',
          rating: 4.2,
          distance: '3.1 km',
          type: 'Service Center'
        },
        {
          id: '3',
          name: 'Bike Hub',
          address: '789 Park Avenue, Bangalore',
          rating: 4.8,
          distance: '1.5 km',
          type: 'Dealer'
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  const quickSearches = [
    { label: 'Spare Parts Suppliers', icon: Store },
    { label: 'Competitor Shops', icon: Star },
    { label: 'Bike Dealers', icon: Navigation }
  ];

  const openInMaps = (address: string) => {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(address)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Market Explorer</h1>
        <p className="text-sm text-slate-600 mt-1">Find nearby businesses and competitors</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="space-y-3">
        <Input
          type="text"
          placeholder="Search for businesses, parts suppliers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search className="w-5 h-5" />}
        />
        <Button
          type="submit"
          isLoading={loading}
          className="w-full"
        >
          <Search className="w-5 h-5 mr-2" />
          Search Nearby
        </Button>
      </form>

      {/* Quick Searches */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Searches</h3>
        <div className="grid grid-cols-3 gap-2">
          {quickSearches.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setSearchQuery(item.label);
                handleSearch();
              }}
              className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <item.icon className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xs font-semibold text-slate-900 text-center">{item.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {places.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Found {places.length} Results
          </h3>
          <div className="space-y-3">
            {places.map((place) => (
              <Card key={place.id} padding="md">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-900">{place.name}</h4>
                        <Badge variant="neutral" size="sm">
                          {place.type}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{place.address}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{place.rating}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Navigation className="w-4 h-4" />
                            <span>{place.distance} away</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openInMaps(place.address)}
                      className="w-full"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Open in Google Maps
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {places.length === 0 && !loading && (
        <Card>
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Explore Your Market</h3>
            <p className="text-slate-600">Search for nearby businesses, competitors, or suppliers</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MarketExplorerPage;
