import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Challenge {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  progressLogs: ProgressLog[];
}

interface ProgressLog {
  id: string;
  date: string;
  description: string;
  mediaUrl: string;
}

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchChallenge();
  }, [id]);

  const fetchChallenge = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/challenges/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setChallenge(data);
    } catch (error) {
      console.error('Error fetching challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setMediaUrl(result.assets[0].uri);
    }
  };

  const handleSubmitProgress = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          challengeId: id,
          date: selectedDate.toISOString(),
          description,
          mediaUrl,
        }),
      });

      if (response.ok) {
        setShowProgressForm(false);
        setDescription('');
        setMediaUrl(null);
        fetchChallenge();
      }
    } catch (error) {
      console.error('Error submitting progress:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={styles.container}>
        <Text>Challenge not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>{challenge.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>{challenge.description}</Text>

        <View style={styles.dates}>
          <Text style={styles.dateText}>
            Start: {new Date(challenge.startDate).toLocaleDateString()}
          </Text>
          <Text style={styles.dateText}>
            End: {new Date(challenge.endDate).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.progressHeader}>
          <Text style={styles.sectionTitle}>Progress Logs</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowProgressForm(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {showProgressForm && (
          <View style={styles.progressForm}>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{selectedDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
              />
            )}

            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="How did it go?"
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
              <Text style={styles.mediaButtonText}>
                {mediaUrl ? 'Change Image' : 'Add Image'}
              </Text>
            </TouchableOpacity>

            {mediaUrl && (
              <Image source={{ uri: mediaUrl }} style={styles.previewImage} />
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitProgress}
            >
              <Text style={styles.submitButtonText}>Submit Progress</Text>
            </TouchableOpacity>
          </View>
        )}

        {challenge.progressLogs.map((log) => (
          <View key={log.id} style={styles.progressLog}>
            <Text style={styles.logDate}>
              {new Date(log.date).toLocaleDateString()}
            </Text>
            <Text style={styles.logDescription}>{log.description}</Text>
            {log.mediaUrl && (
              <Image source={{ uri: log.mediaUrl }} style={styles.logImage} />
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  dates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dateText: {
    color: '#8E8E93',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressForm: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  mediaButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  mediaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressLog: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  logDate: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  logDescription: {
    fontSize: 16,
    marginBottom: 8,
  },
  logImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
}); 