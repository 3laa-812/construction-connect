import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { useQuery } from '@tanstack/react-query';
import { Colors, Fonts, Radius, Spacing } from '../../../../../constants/theme';
import { AmberGlow } from '../../../../../constants/glass';
import { Button } from '../../../../../components/ui/Button';
import { GlassView } from '../../../../../components/ui/GlassView';
import { ScreenBackground } from '../../../../../components/ui/ScreenBackground';
import { Ionicons } from '@expo/vector-icons';
import { SiteProgressCard } from '../../../../../components/progress/SiteProgressCard';
import { api } from '../../../../../lib/api';
import { unwrapList } from '../../../../../lib/apiMappers';

function SiteDetails({ site, projectDates }: { site: any; projectDates?: { start?: string; end?: string } }) {
  const router = useRouter();
  const lat = Number(site.latitude ?? site.gpsLat);
  const lng = Number(site.longitude ?? site.gpsLong);

  const handleNavigate = () => {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const url = Platform.select({
        ios: `maps:0,0?q=${lat},${lng}`,
        android: `geo:0,0?q=${lat},${lng}(${site.name})`,
      }) || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      Linking.openURL(url);
    }
  };

  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);
  let parsedGeofence = null;
  
  if (site.geofence) {
    try {
      const parsed = typeof site.geofence === 'string' ? JSON.parse(site.geofence) : site.geofence;
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsedGeofence = parsed;
      }
    } catch (e) {
      // invalid geo-json
    }
  }

  const siteProgressInput = {
    totalDaysLogged: 18,
    ordersDeliveredToSite: 9,
    ordersExpectedAtSite: 14,
    lastActivityDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    projectStartDate: projectDates?.start ?? Date.now(),
    projectEndDate: projectDates?.end ?? Date.now(),
  };

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* Map Header */}
        <View style={styles.mapContainer}>
          {hasLocation ? (
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              customMapStyle={mapDarkStyle}
            >
              <Marker 
                coordinate={{ latitude: lat, longitude: lng }}
                title={site.name}
              >
                <View style={[styles.markerContainer, AmberGlow.strong]}>
                  <Ionicons name="construct" size={16} color={Colors.ground} />
                </View>
              </Marker>
              {parsedGeofence && (
                <Polygon
                  coordinates={parsedGeofence.map((pt: any) => ({ 
                    latitude: pt.lat || pt.latitude, 
                    longitude: pt.lng || pt.longitude 
                  }))}
                  fillColor="rgba(212, 146, 10, 0.15)"
                  strokeColor={Colors.amber}
                  strokeWidth={2}
                />
              )}
            </MapView>
          ) : (
            <View style={[styles.noMapPlaceholder, { backgroundColor: Colors.surface2 }]}>
              <Ionicons name="map-outline" size={48} color={Colors.text3} />
              <Text style={styles.noMapText}>No location data set</Text>
            </View>
          )}

          {/* Back Button Overlay */}
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.backButtonOverlay, { top: 60 }]}
          >
            <GlassView variant="nav" style={styles.backButtonGlass}>
              <Ionicons name="chevron-back" size={24} color={Colors.text1} />
            </GlassView>
          </TouchableOpacity>
        </View>

        {/* Info Card (Overlaps Map) */}
        <GlassView variant="card" style={styles.infoCard}>
          <Text style={styles.siteTitle}>{site.name}</Text>
          <View style={styles.siteSubRow}>
            <Ionicons name="location-outline" size={14} color={Colors.text2} />
            <Text style={styles.addressText} numberOfLines={1}>{site.address || 'Industrial Area, Block 4'}</Text>
          </View>

          <View style={styles.contactRow}>
            <View style={styles.contactItem}>
              <Ionicons name="person-outline" size={14} color={Colors.text3} />
              <Text style={styles.contactText}>{site.contact_person || site.contactName || '—'}</Text>
            </View>
            <TouchableOpacity onPress={() => (site.contact_phone || site.contactPhone) && Linking.openURL(`tel:${site.contact_phone || site.contactPhone}`)}>
              <View style={styles.contactItem}>
                <Ionicons name="call-outline" size={14} color={Colors.amber} />
                <Text style={[styles.contactText, { color: Colors.amber }]}>{site.contact_phone || site.contactPhone || '--'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </GlassView>

        <SiteProgressCard input={siteProgressInput} />

        {/* Action Buttons Row */}
        <View style={styles.actionRow}>
          <Button 
            variant="primary" 
            onPress={() => router.push('/work/daily-logs/new' as any)} 
            style={{ flex: 1.5 }}
          >
            <Ionicons name="add" size={20} color={Colors.ground} style={{ marginRight: 4 }} />
            New Log
          </Button>
          <Button 
            variant="secondary" 
            onPress={handleNavigate}
            style={{ flex: 1 }}
          >
            <Ionicons name="navigate-outline" size={20} color={Colors.text1} />
          </Button>
        </View>

        {/* Recent Section - Small List */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>RECENT DELIVERIES</Text>
          <GlassView variant="card" style={styles.miniLogItem}>
            <Ionicons name="cube-outline" size={18} color={Colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.miniLogTitle}>Site mapped to project scope</Text>
              <Text style={styles.miniLogSub}>{projectDates?.start ? `Project start: ${new Date(projectDates.start).toLocaleDateString()}` : 'No recent delivery note'}</Text>
            </View>
          </GlassView>
        </View>

      </ScrollView>
    </ScreenBackground>
  );
}

export default function SiteDetailsScreen() {
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ['projects', 'sites', siteId],
    queryFn: () => api.get('/projects').then((res) => res.data),
    enabled: Boolean(siteId),
  });
  const projects = unwrapList(data);
  const flattened = projects.flatMap((p: any) => (Array.isArray(p.sites) ? p.sites.map((s: any) => ({ site: s, project: p })) : []));
  const match = flattened.find((x: any) => x.site.id === siteId);
  if (!siteId || isLoading) return <ScreenBackground style={styles.container}><Text style={{ color: Colors.text2, padding: 24 }}>Loading site...</Text></ScreenBackground>;
  if (!match) return <ScreenBackground style={styles.container}><Text style={{ color: Colors.text2, padding: 24 }}>Site not found.</Text></ScreenBackground>;
  return <SiteDetails site={match.site} projectDates={{ start: match.project?.start_date, end: match.project?.end_date }} />;
}

// Dark map style for Forge aesthetics
const mapDarkStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#000000" }]
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  mapContainer: {
    height: 240,
    width: '100%',
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  noMapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMapText: {
    fontFamily: Fonts.body,
    color: Colors.text3,
    marginTop: 8,
  },
  backButtonOverlay: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
  },
  backButtonGlass: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.ground,
  },
  infoCard: {
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 20,
    marginTop: -40, // overlap
    zIndex: 20,
  },
  siteTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.text1,
  },
  siteSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  addressText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text2,
    flex: 1,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text2,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 24,
    gap: 12,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text3,
    letterSpacing: 1,
    marginBottom: 16,
  },
  miniLogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: Radius.md,
    gap: 12,
  },
  miniLogTitle: {
    fontFamily: Fonts.body,
    fontWeight: '600',
    fontSize: 14,
    color: Colors.text1,
  },
  miniLogSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text3,
    marginTop: 2,
  },
});
