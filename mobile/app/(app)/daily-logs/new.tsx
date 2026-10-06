import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, Fonts, Radius, Spacing } from '../../../constants/theme';
import { Glass, AmberGlow } from '../../../constants/glass';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { GlassView } from '../../../components/ui/GlassView';
import { ScreenBackground } from '../../../components/ui/ScreenBackground';
import { StepIndicator } from '../../../components/ui/StepIndicator';
import { database } from '../../../lib/watermelon';
import { useAuthStore } from '../../../store/authStore';
import { fetchWeather } from '../../../lib/weather';
import { format } from 'date-fns';
import { api } from '../../../lib/api';
import { unwrapList } from '../../../lib/apiMappers';
import { refreshPendingCount } from '../../../lib/sync';

const dailyLogSchema = z.object({
  project_id: z.string().min(1, 'Project selection is required'),
  site_id: z.string().optional(),
  logDate: z.date(),
  weather_temp: z.number().optional(),
  weather_condition: z.string().optional(),
  weather_icon: z.string().optional(),
  weather_humidity: z.number().optional(),
  weather_wind: z.number().optional(),
  
  attendance_data: z.array(z.object({
    company: z.string(),
    count: z.number(),
    notes: z.string().optional(),
  })).optional(),

  progress_notes: z.string().max(1000).optional(),
  completion_percent: z.number().min(0).max(100).optional().default(0),

  materials_data: z.array(z.object({
    item: z.string(),
    status: z.enum(['RECEIVED', 'PENDING', 'REJECTED']),
    quantity: z.string().optional(),
  })).optional(),
});

type FormData = z.infer<typeof dailyLogSchema>;

const STEPS = [
  { id: 'overview', label: 'Overview' },
  { id: 'crew', label: 'Crew' },
  { id: 'progress', label: 'Progress' },
  { id: 'materials', label: 'Materials' },
];

export default function NewDailyLogWizard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      const camStatus = (await ImagePicker.requestCameraPermissionsAsync()).status;
      if (camStatus !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera or photo library access to add work photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotos(prev => [...prev, result.assets[0].uri]);
      }
      return;
    }
    Alert.alert('Add Photo', 'Choose source', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: false });
          if (!result.canceled && result.assets[0]) setPhotos(prev => [...prev, result.assets[0].uri]);
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsMultipleSelection: true,
          });
          if (!result.canceled) {
            setPhotos(prev => [...prev, ...result.assets.map(a => a.uri)]);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(dailyLogSchema) as any,
    defaultValues: {
      logDate: new Date(),
      project_id: '',
      completion_percent: 0,
      attendance_data: [{ company: '', count: 0 }],
      materials_data: [],
    }
  });

  const weatherData = watch(['weather_temp', 'weather_condition', 'weather_icon', 'weather_humidity', 'weather_wind']);
  const selectedProjectId = watch('project_id');
  const selectedSiteId = watch('site_id');
  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'daily-log-selector'],
    queryFn: () => api.get('/projects').then((res) => res.data),
  });
  const projects: any[] = unwrapList(projectsData);
  const selectedProject: any = projects.find((p: any) => p.id === selectedProjectId);
  const projectSites: any[] = Array.isArray(selectedProject?.sites) ? selectedProject.sites : [];

  const loadWeather = async () => {
    setWeatherLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Location permission denied.');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const weather = await fetchWeather(location.coords.latitude, location.coords.longitude);
      if (weather) {
        setValue('weather_temp', weather.temp);
        setValue('weather_condition', weather.condition);
        setValue('weather_icon', weather.icon);
        setValue('weather_humidity', weather.humidity);
        setValue('weather_wind', weather.wind_speed);
      }
    } catch (err) {
      console.warn('Weather load failed', err);
    } finally {
      setWeatherLoading(false);
    }
  };

  const onSaveDraft = async (data: FormData) => {
    setIsSaving(true);
    try {
      await api.post('/daily-logs', {
        project: { connect: { id: data.project_id } },
        user: { connect: { id: user?.id } },
        log_date: data.logDate.toISOString(),
        status: 'SUBMITTED',
        weather_data: data.weather_temp ? {
          temp: data.weather_temp,
          condition: data.weather_condition,
          icon: data.weather_icon,
          humidity: data.weather_humidity,
          wind: data.weather_wind
        } : undefined,
        attendance_data: data.attendance_data ?? undefined,
        material_receipt_data: data.materials_data ?? undefined,
        progress_notes: data.progress_notes ? [{ note: data.progress_notes }] : undefined,
      });
      await refreshPendingCount();
      router.back();
    } catch (e) {
      // Offline/local-first fallback to keep UX resilient.
      await database.write(async () => {
        await database.get('daily_logs').create((log: any) => {
          log.projectId = data.project_id;
          log.siteId = data.site_id;
          log.userId = user?.id || '';
          log.logDate = data.logDate.toISOString();
          log.status = 'DRAFT';
          log.progressNotes = data.progress_notes;
          log.weatherData = data.weather_temp ? JSON.stringify({
            temp: data.weather_temp,
            condition: data.weather_condition,
            icon: data.weather_icon,
            humidity: data.weather_humidity,
            wind: data.weather_wind
          }) : null;
          log.attendanceData = data.attendance_data ? JSON.stringify(data.attendance_data) : null;
          log.materialsData = data.materials_data ? JSON.stringify(data.materials_data) : null;
        });
      });
      await refreshPendingCount();
      alert('Saved locally as draft (offline fallback).');
      router.back();
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit(onSaveDraft)();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  return (
    <ScreenBackground>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        {/* Modal-style Header */}
        <View style={styles.header}>
          <View style={styles.handleBar} />
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Daily Log</Text>
              <Text style={styles.headerDate}>{format(new Date(), 'EEEE, MMM do')}</Text>
            </View>
            <TouchableOpacity onPress={handleSubmit(onSaveDraft)}>
              <Text style={styles.saveDraftText}>Save Draft</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Step Indicator */}
        <View style={styles.indicatorContainer}>
          <StepIndicator steps={STEPS} currentStepIndex={currentStep} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          {/* Step 1: Overview */}
          {currentStep === 0 && (
            <View style={styles.stepContainer}>
              <Text style={styles.sectionHeading}>LOG CONTEXT</Text>
              <Controller
                control={control}
                name="project_id"
                render={({ field: { onChange, value } }) => (
                  <TouchableOpacity onPress={() => {
                    if (!projects.length) return;
                    const currentIndex = projects.findIndex((p: any) => p.id === value);
                    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % projects.length : 0;
                    onChange(projects[nextIndex].id);
                    setValue('site_id', undefined);
                  }}>
                    <GlassView variant="input" style={styles.pickerSelector}>
                      <Text style={[styles.pickerValue, !value && { color: Colors.text3 }]}>
                        {projects.find((p: any) => p.id === value)?.name || 'Tap to cycle project'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color={Colors.text3} />
                    </GlassView>
                  </TouchableOpacity>
                )}
              />

              <Controller
                control={control}
                name="site_id"
                render={({ field: { onChange, value } }) => (
                  <TouchableOpacity onPress={() => {
                    if (!projectSites.length) return;
                    const currentIndex = projectSites.findIndex((s: any) => s.id === value);
                    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % projectSites.length : 0;
                    onChange(projectSites[nextIndex].id);
                  }} style={{ marginTop: 12 }}>
                    <GlassView variant="input" style={styles.pickerSelector}>
                      <Text style={[styles.pickerValue, !value && { color: Colors.text3 }]}>
                        {projectSites.find((s: any) => s.id === value)?.name || 'Tap to cycle site (optional)'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color={Colors.text3} />
                    </GlassView>
                  </TouchableOpacity>
                )}
              />

              {/* Weather Card */}
              <View style={styles.weatherSection}>
                <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
                  <Text style={styles.sectionHeading}>WEATHER</Text>
                  <TouchableOpacity onPress={loadWeather} disabled={weatherLoading}>
                    <Ionicons 
                      name="refresh" 
                      size={14} 
                      color={weatherLoading ? Colors.text3 : Colors.amber} 
                    />
                  </TouchableOpacity>
                </View>

                {weatherData[0] ? (
                  <GlassView variant="card" style={styles.weatherCard}>
                    <View style={styles.weatherMain}>
                      <View style={styles.weatherCol}>
                         <View style={styles.weatherConditionRow}>
                           <Ionicons name="partly-sunny" size={28} color={Colors.amber} />
                           <Text style={styles.weatherConditionText}>{weatherData[1]}</Text>
                         </View>
                         <Text style={styles.tempText}>{weatherData[0]}°C</Text>
                      </View>
                      
                      <View style={styles.weatherGrid}>
                        <View style={styles.weatherGridItem}>
                          <Ionicons name="water-outline" size={14} color={Colors.text3} />
                          <Text style={styles.weatherGridValue}>{weatherData[3]}%</Text>
                        </View>
                        <View style={styles.weatherGridItem}>
                          <Ionicons name="leaf-outline" size={14} color={Colors.text3} />
                          <Text style={styles.weatherGridValue}>{weatherData[4]} km/h</Text>
                        </View>
                      </View>
                    </View>
                  </GlassView>
                ) : (
                  <TouchableOpacity onPress={loadWeather}>
                    <GlassView variant="card" style={styles.weatherPlaceholder}>
                      <Ionicons name="cloud-download-outline" size={24} color={Colors.amber} />
                      <Text style={styles.weatherPlaceholderText}>
                        {weatherLoading ? 'Updating...' : 'Tap to pull site weather'}
                      </Text>
                    </GlassView>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Step 2: Crew */}
          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.sectionHeading}>CREW & ATTENDANCE</Text>
              <GlassView variant="card" style={{ padding: 16 }}>
                 <Input 
                   label="Main Contractor Headcount"
                   placeholder="0"
                   keyboardType="numeric"
                   leftIcon={<Ionicons name="people-outline" size={20} color={Colors.text3} />}
                   style={Glass.input}
                 />
                 <Input 
                   label="Subcontractor Presence"
                   placeholder="e.g. Electricians (4)"
                   leftIcon={<Ionicons name="business-outline" size={20} color={Colors.text3} />}
                   style={Glass.input}
                 />
              </GlassView>
            </View>
          )}
          
          {/* Step 3: Progress */}
          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.sectionHeading}>PROGRESS & ISSUES</Text>
              <GlassView variant="card" style={{ padding: 16 }}>
                 <Input 
                   label="Progress Highlights"
                   placeholder="Summary of today's achievements..."
                   multiline
                   numberOfLines={4}
                   style={[Glass.input, { height: 120, textAlignVertical: 'top' }]}
                 />
                 <Text style={[styles.sectionHeading, { marginTop: 12, marginBottom: 8 }]}>SITE ASSETS</Text>
                 {photos.length > 0 && (
                   <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                     {photos.map((uri, i) => (
                       <Image key={i} source={{ uri }} style={{ width: 80, height: 80, borderRadius: 10, marginRight: 8 }} />
                     ))}
                   </ScrollView>
                 )}
                 <TouchableOpacity style={styles.photoBox} onPress={pickPhoto}>
                    <Ionicons name="camera-outline" size={32} color={Colors.amber} />
                    <Text style={styles.photoBoxText}>{photos.length > 0 ? `${photos.length} photo(s) – tap to add more` : 'Add Work Photos'}</Text>
                 </TouchableOpacity>
              </GlassView>
            </View>
          )}

          {/* Step 4: Materials */}
          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.sectionHeading}>MATERIAL DELIVERIES</Text>
              <GlassView variant="card" style={{ padding: 16 }}>
                 <Text style={styles.materialsHint}>Log any shipments received or rejected today.</Text>
                 <TouchableOpacity style={[styles.addShipmentBtn]}>
                   <Ionicons name="add" size={18} color={Colors.text1} />
                   <Text style={styles.addShipmentText}>Add Shipment</Text>
                 </TouchableOpacity>
              </GlassView>
            </View>
          )}
        </ScrollView>

        {/* Fixed submit area uses nav glass per UI spec */}
        <GlassView variant="nav" style={styles.actionBar}>
          <View style={styles.actionRowInner}>
            <Button variant="ghost" onPress={prevStep} style={{ flex: 1 }}>
              {currentStep === 0 ? 'Cancel' : 'Back'}
            </Button>
            <Button 
              isLoading={isSaving} 
              onPress={nextStep} 
              style={{ flex: 2, ...AmberGlow.soft }}
            >
              {currentStep === STEPS.length - 1 ? 'Finish & Save' : 'Next Step'}
            </Button>
          </View>
          <Text style={styles.actionHint}>Draft saves locally and syncs when online</Text>
        </GlassView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.text1,
  },
  headerDate: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text2,
    marginTop: 2,
  },
  saveDraftText: {
    fontFamily: Fonts.body,
    fontWeight: '600',
    color: Colors.amber,
    fontSize: 14,
  },
  indicatorContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  stepContainer: {
    gap: 16,
  },
  sectionHeading: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text3,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  pickerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
  },
  pickerValue: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text1,
  },
  weatherSection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherCard: {
    padding: 16,
    borderRadius: 16,
  },
  weatherMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherCol: {
    flex: 1,
  },
  weatherConditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weatherConditionText: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.text1,
    fontWeight: '500',
  },
  tempText: {
    fontFamily: Fonts.display,
    fontSize: 40,
    color: Colors.text1,
    marginTop: 4,
  },
  weatherGrid: {
    gap: 12,
  },
  weatherGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
  },
  weatherGridValue: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.text2,
  },
  weatherPlaceholder: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(212,146,10,0.3)',
  },
  weatherPlaceholderText: {
    fontFamily: Fonts.body,
    color: Colors.amber,
    fontSize: 14,
    marginTop: 8,
  },
  photoBox: {
    height: 120,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(212,146,10,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212,146,10,0.2)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  photoBoxText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.amber,
    marginTop: 8,
  },
  materialsHint: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text3,
    fontStyle: 'italic',
  },
  addShipmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addShipmentText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text1,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
  },
  actionRowInner: {
    flexDirection: 'row',
    gap: 12,
  },
  actionHint: {
    marginTop: 8,
    textAlign: 'center',
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.text3,
  },
});
