import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, Polygon } from 'react-native-maps';
import withObservables from '@nozbe/with-observables';
import { database } from '../../../../lib/watermelon';
import Site from '../../../../models/Site';
import { Colors, Spacing, Radius } from '../../../../constants/theme';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import { Feather } from '@expo/vector-icons';


function SiteDetails({ site }: { site: Site }) {
  const router = useRouter();

  const handleNavigate = () => {
    if (site.gpsLat && site.gpsLong) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${site.gpsLat},${site.gpsLong}`;
      Linking.openURL(url);
    }
  };

  const hasLocation = site.gpsLat && site.gpsLong;
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{site.name}</Text>
      
      <Card variant="default" style={styles.card}>
        <View style={styles.infoRow}>
          <Feather name="map-pin" size={16} color={Colors.amber} />
          <Text style={styles.infoText}>{site.address || 'No address provided'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="user" size={16} color={Colors.amber} />
          <Text style={styles.infoText}>{site.contactName || 'No contact name'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="phone" size={16} color={Colors.amber} />
          <Text style={styles.infoText}>{site.contactPhone || 'No contact phone'}</Text>
        </View>
      </Card>

      {hasLocation ? (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: site.gpsLat!,
              longitude: site.gpsLong!,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker coordinate={{ latitude: site.gpsLat!, longitude: site.gpsLong! }} title={site.name} />
            {parsedGeofence && (
              <Polygon
                coordinates={parsedGeofence.map((pt: any) => ({ latitude: pt.lat || pt.latitude, longitude: pt.lng || pt.longitude }))}
                fillColor={`${Colors.amber}33`}
                strokeColor={Colors.amber}
                strokeWidth={2}
              />
            )}
          </MapView>
          <View style={styles.mapAction}>
            <Button
              variant="primary"
              size="md"
              onPress={handleNavigate}
            >
              Navigate to Site
            </Button>
          </View>
        </View>
      ) : (
        <Card variant="flat" style={styles.noLocationCard}>
          <Feather name="map" size={32} color={Colors.text3} />
          <Text style={styles.noLocationText}>No GPS coordinates provided for this site</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const enhance = withObservables(['site'], ({ site }: { site: Site }) => ({
  site: site.observe(),
}));

const EnhancedSiteDetails = enhance(SiteDetails);

export default function SiteDetailsScreen() {
  const { siteId } = useLocalSearchParams<{ siteId: string }>();

  // If we can't find it locally quite yet or the ID is undefined, we handle gracefully
  if (!siteId) return <View style={styles.container} />;

  const siteObservable = database.get<Site>('sites').findAndObserve(siteId);

  return <EnhancedSiteDetails site={siteObservable as any} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ground,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  title: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 28,
    color: Colors.text1,
    marginBottom: Spacing.sm,
  },
  card: {
    gap: Spacing.md,
    padding: Spacing.md,
    paddingTop: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoText: {
    fontFamily: 'Geist',
    fontSize: 14,
    color: Colors.text2,
    flex: 1,
  },
  mapContainer: {
    height: 300,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
    borderColor: Colors.border,
    borderWidth: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapAction: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
  },
  noLocationCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.surface2,
  },
  noLocationText: {
    fontFamily: 'Geist',
    color: Colors.text3,
    marginTop: Spacing.sm,
    textAlign: 'center',
  }
});
