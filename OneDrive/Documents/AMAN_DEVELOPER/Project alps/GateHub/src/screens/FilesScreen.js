// src/screens/FilesScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useApp } from '../context/AppContext';
import { apiFetchFiles, apiDeleteFile, apiSaveLink } from '../api';

const openFile = async (file) => {
  if (file.url.includes('drive.google.com')) {
    Linking.openURL(file.url);
    return;
  }

  try {
    const localUri = FileSystem.documentDirectory + file.name;
    const result = await FileSystem.downloadAsync(file.url, localUri);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(result.uri);
    } else {
      Alert.alert('Download Complete', 'File saved for offline use.');
    }
  } catch (e) {
    Linking.openURL(file.url);
  }
};

export default function FilesScreen({ route }) {
  const { subject } = route.params || {};
  const { user, addToVault } = useApp();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);

  useEffect(() => {
    if (!subject) return;
    loadFiles();
  }, [subject]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const list = await apiFetchFiles(subject._id);
      setFiles(list);
    } catch (err) {
      Alert.alert('Error', 'Unable to load files.');
    } finally {
      setLoading(false);
    }
  };

  const saveOffline = (file) => {
    addToVault(file);
    Alert.alert('Saved', `"${file.name}" is now in your vault.`);
  };

  const deleteFile = (fileId) => {
    Alert.alert('Delete file', 'Confirm delete?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDeleteFile(fileId);
            await loadFiles();
          } catch (err) {
            Alert.alert('Error', err.message || 'Could not delete file.');
          }
        },
      },
    ]);
  };

  const addLink = async () => {
    if (!linkName.trim() || !linkUrl.trim()) {
      return Alert.alert('Fill contents', 'Name and URL are required.');
    }
    setLinkLoading(true);
    try {
      await apiSaveLink(subject._id, linkName.trim(), linkUrl.trim());
      setLinkName('');
      setLinkUrl('');
      await loadFiles();
      Alert.alert('Done', 'Link added to subject.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not add link.');
    } finally {
      setLinkLoading(false);
    }
  };

  const displayed = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{subject?.name || 'Files'}</Text>
      <Text style={styles.subHeading}>{subject?.branch} resources</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search files..."
        placeholderTextColor="#94a3b8"
        value={search}
        onChangeText={setSearch}
      />

      {loading ? (
        <ActivityIndicator color="#6366f1" size="large" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.fileName}>{item.name}</Text>
                <Text style={styles.fileType}>{item.type} • {item.size}</Text>
              </View>
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.btnPrimary} onPress={() => { openFile(item); saveOffline(item); }}>
                  <Text style={styles.btnText}>Open</Text>
                </TouchableOpacity>
                {user?.role === 'admin' && (
                  <TouchableOpacity style={styles.btnDelete} onPress={() => deleteFile(item._id)}>
                    <Text style={styles.btnTextDanger}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>No files were found for this subject.</Text>
          )}
        />
      )}

      {user?.role === 'admin' && (
        <View style={styles.linkBox}>
          <Text style={styles.linkTitle}>Add link</Text>
          <TextInput
            style={styles.input}
            placeholder="Resource title"
            placeholderTextColor="#94a3b8"
            value={linkName}
            onChangeText={setLinkName}
          />
          <TextInput
            style={styles.input}
            placeholder="https://drive.google.com/..."
            placeholderTextColor="#94a3b8"
            value={linkUrl}
            onChangeText={setLinkUrl}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.addLinkBtn} onPress={addLink} disabled={linkLoading}>
            <Text style={styles.addLinkText}>{linkLoading ? 'Saving...' : 'Save link'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 54, paddingHorizontal: 16 },
  heading: { color: '#0f172a', fontSize: 24, fontWeight: '900' },
  subHeading: { color: '#64748b', fontSize: 13, marginTop: 2, marginBottom: 12 },
  searchInput: { backgroundColor: '#fff', borderRadius: 16, borderColor: '#e2e8f0', borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14 },

  list: { paddingBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10, padding: 12 },
  cardInfo: { marginBottom: 10 },
  fileName: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  fileType: { fontSize: 11, color: '#64748b', marginTop: 4 },

  actionsRow: { flexDirection: 'row', justifyContent: 'flex-start', gap: 8 },
  btnPrimary: { backgroundColor: '#6366f1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
  btnDelete: { backgroundColor: '#fef2f2', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  btnTextDanger: { color: '#dc2626', fontWeight: '700' },

  emptyText: { marginTop: 24, color: '#94a3b8', textAlign: 'center' },

  linkBox: { marginTop: 18, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 14 },
  linkTitle: { color: '#334155', fontSize: 14, fontWeight: '800', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  addLinkBtn: { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  addLinkText: { color: '#fff', fontWeight: '800' },
});