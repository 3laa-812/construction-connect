import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Colors } from '../../../constants/theme';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent } from '../../../components/ui/Card';
import { database } from '../../../lib/watermelon';
import { useAuthStore } from '../../../store/authStore';
import { fetchWeather } from '../../../lib/weather';
import * as Location from 'expo-location';

const dailyLogSchema = z.object({
  project_id: z.string().min(1, 'Project ID is required'),
  logDate: z.date(),
  weather_temp: z.number().optional(),
  weather_condition: z.string().optional(),
  attendance_company: z.string().optional(),
  attendance_headcount: z.string().optional(),
  progress_notes: z.string().max(500).optional(),
});

type FormData = z.infer<typeof dailyLogSchema>;

export default function NewDailyLogWizard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState<'overview' | 'attendance' | 'progress'>('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(dailyLogSchema),
    defaultValues: {
      logDate: new Date(),
      project_id: '',
    }
  });

  const loadWeather = async () => {
    setWeatherLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Location permission denied.');
      setWeatherLoading(false);
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    const weather = await fetchWeather(location.coords.latitude, location.coords.longitude);
    if (weather) {
      setValue('weather_temp', weather.temp);
      setValue('weather_condition', weather.condition);
    }
    setWeatherLoading(false);
  };

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      await database.write(async () => {
        await database.get('daily_logs').create((log: any) => {
          log.projectId = data.project_id;
          log.userId = user?.id || '';
          log.logDate = data.logDate.toISOString();
          log.status = 'DRAFT'; // ALWAYS DRAFT LOCALLY
          log.notes = data.progress_notes || '';
          log.weatherData = data.weather_temp ? JSON.stringify({ temp: data.weather_temp, condition: data.weather_condition }) : null;
        });
      });
      router.back();
    } catch (e) {
      console.error(e);
      alert('Failed to save log. Ensure WatermelonDB is configured correctly.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: Colors.ground }}>
      <View style={{ padding: 16, paddingTop: 64, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <Text style={{ color: Colors.text1, fontFamily: 'DMSerifDisplay', fontSize: 20 }}>
          {step === 'overview' ? 'Step 1: Log Context' : step === 'attendance' ? 'Step 2: Attendance' : 'Step 3: Progress Notes'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {step === 'overview' && (
          <Card>
            <CardContent style={{ paddingTop: 16, gap: 12 }}>
              <Controller
                control={control}
                name="project_id"
                render={({ field: { onChange, value } }) => (
                  <Input label="Project UID (e.g. 1)" value={value} onChangeText={onChange} error={errors.project_id?.message} />
                )}
              />
              
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Controller
                    control={control}
                    name="weather_condition"
                    render={({ field: { value } }) => (
                      <Input label="Weather" value={value} placeholder="e.g. Sunny" editable={false} />
                    )}
                  />
                </View>
                <Button style={{ marginBottom: 16 }} variant="secondary" onPress={loadWeather} isLoading={weatherLoading}>
                  Pull GPS Weather
                </Button>
              </View>
            </CardContent>
          </Card>
        )}

        {step === 'attendance' && (
          <Card>
            <CardContent style={{ paddingTop: 16, gap: 12 }}>
              <Controller
                control={control}
                name="attendance_company"
                render={({ field: { onChange, value } }) => (
                  <Input label="Contracting Company" value={value} onChangeText={onChange} />
                )}
              />
              <Controller
                control={control}
                name="attendance_headcount"
                render={({ field: { onChange, value } }) => (
                  <Input label="Headcount" value={value} onChangeText={onChange} keyboardType="numeric" />
                )}
              />
            </CardContent>
          </Card>
        )}

        {step === 'progress' && (
          <Card>
            <CardContent style={{ paddingTop: 16, gap: 12 }}>
              <Controller
                control={control}
                name="progress_notes"
                render={({ field: { onChange, value } }) => (
                  <Input 
                    label="Daily Notes & Issues" 
                    value={value} 
                    onChangeText={onChange} 
                    multiline 
                    style={{ height: 100 }} 
                  />
                )}
              />
              <Text style={{ color: Colors.text3, fontSize: 12, fontFamily: 'Geist' }}>
                * Photos can be attached via the hardware camera from the drafted log details screen.
              </Text>
            </CardContent>
          </Card>
        )}
      </ScrollView>

      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: 32, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Button 
          variant="ghost" 
          onPress={() => step === 'progress' ? setStep('attendance') : step === 'attendance' ? setStep('overview') : router.back()}
        >
          {step === 'overview' ? 'Cancel' : 'Back'}
        </Button>
        <Button 
          isLoading={isSaving}
          onPress={step === 'progress' ? handleSubmit(onSubmit) : () => setStep(step === 'overview' ? 'attendance' : 'progress')}
        >
          {step === 'progress' ? 'Save as Draft' : 'Next Step'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
